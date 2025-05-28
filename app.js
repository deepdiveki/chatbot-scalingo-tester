require('dotenv').config(); // read API Key

const axios = require('axios');
const express = require('express');
const cors = require('cors');
const path = require("path");
const { readFileSync } = require('fs');
const { Document, Packer } = require('docx');
const mammoth = require('mammoth');

const app = express();

const fs = require('fs');

let docContent = ''; // Variable to store extracted .docx content

let docChunks = []; // To store document chunks

// Function to read and extract text from .docx file
const extractTextFromDocx = async (filePath) => {
    try {
        const result = await mammoth.extractRawText({ path: filePath });
        const paragraphs = result.value.split(/\n+/).filter((para) => para.trim() !== '');
        return paragraphs;
    } catch (error) {
        console.error('Error reading .docx file:', error);
        throw error;
    }
};

const generateEmbedding = async (text) => {
    const response = await axios.post(
        'https://api.openai.com/v1/embeddings',
        {
            model: 'text-embedding-ada-002',
            input: text,
        },
        {
            headers: {
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
        }
    );
    return response.data.data[0].embedding;
};

// Function to calculate cosine similarity
const cosineSimilarity = (vecA, vecB) => {
    const dotProduct = vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
};

const preprocessText = (text) => text.toLowerCase().replace(/[^\w\s]/g, '');


// Function to find the most relevant chunks
const findRelevantChunks = async (userQuery, chunks, topK = 3) => {
    const queryEmbedding = await generateEmbedding(preprocessText(userQuery));
    const chunkEmbeddings = await Promise.all(
        chunks.map(async (chunk) => ({
            text: chunk,
            embedding: await generateEmbedding(preprocessText(chunk)),
        }))
    );

    const similarities = chunkEmbeddings.map((chunk) => ({
        text: chunk.text,
        similarity: cosineSimilarity(queryEmbedding, chunk.embedding),
    }));

    return similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK)
        .map((chunk) => chunk.text);
};

// Read the .docx file at startup and store the content
(async () => {
    try {
        const filePath = 'output.docx'; // Your .docx file
        docChunks = await extractTextFromDocx(filePath); // Extract chunks
        console.log("Document content loaded and split into chunks.");
    } catch (error) {
        console.warn("Warnung: Dokument konnte nicht geladen werden. Chatbot läuft trotzdem.");
    }
})();

// Start the server regardless of .docx success
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
});


//const systemPrompt = `Fragen zum Gymnasium Alster beantworten. Beziehe dich dabei auf Informationen: ${docContent}`;


// Middleware to parse JSON request bodies and handle CORS
app.use(express.json());
app.use(cors({ origin: '*' })); // Allow all origins (restrict in production)

// Serve static files (frontend)
app.use(express.static(path.join(__dirname, 'public')));

// Chatbot route
app.post('/chat', async (req, res) => {
    const { message: userMessage, memory } = req.body;
    //userMessage = correctSpelling(userMessage);

    if (!userMessage) {
        return res.status(400).json({ reply: "I didn't receive a message!" });
    }

    try {
        // Find the most relevant chunks for the user query
        const relevantChunks = await findRelevantChunks(userMessage, docChunks);

//        // Check if relevant chunks are found
//        if (!relevantChunks || relevantChunks.length === 0) {
//            console.error("No relevant chunks were found for the user query.");
//
//            const reformulationPrompt = `
//You are an expert in improving and reformulating user queries.
//Rephrase the following message to make it clearer and more specific:
//
//Message: "${userMessage}"
//Instructions: Make the message concise and structured while keeping the original meaning intact.
//`;
//            // Call GPT API to reformulate the message
//            const reformulateResponse = await axios.post(
//                'https://api.openai.com/v1/chat/completions',
//                {
//                    model: 'gpt-4o-mini',
//                    messages: [
//                        { role: 'system', content: reformulationPrompt },
//                        { role: 'user', content: userMessage },
//                    ],
//                    max_tokens: 100,
//                },
//                {
//                    headers: {
//                        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
//                        'Content-Type': 'application/json',
//                    },
//                }
//            );
//
//            const reformulatedMessage = reformulateResponse.data.choices[0].message.content;
//
//            // Try finding relevant chunks for the reformulated message
//            relevantChunks = await findRelevantChunks(reformulatedMessage, docChunks);

            if (!relevantChunks || relevantChunks.length === 0) {
                console.error("No relevant chunks found after reformulating the query.");
                return res.status(500).json({ reply: "Leider habe ich keine passenden Informationen zu Ihrer Anfrage gefunden. Schreiben Sie uns gerne eine Email mit Ihrer Anfrage an: info@deepdive-ki.de" });
            //}

            // Update the user's message with the reformulated version for further processing
            //userMessage = reformulatedMessage;

        } else {
            console.log("Relevant Chunks for the Query:", relevantChunks);
        }

        // Construct the system prompt
        const systemPrompt = `
You are an expert assistant for answering questions about the Gymnasium Alster.
Your goal is to provide detailed, helpful, and accurate responses based on the provided information and the user's previous messages.

### Relevant Information:
${relevantChunks.join('\n\n')}

### User's Message History:
If applicable, here are the user's last messages for reference:
${memory}

### Instructions:
1. Always use the relevant information above when answering the query.
2. If the user has made specific requests (e.g., responding in a different language), follow those instructions consistently.
3. If the user references previous inputs, use the listed message history to provide accurate and contextual answers.
4. If the user's question cannot be answered with the provided information, respond politely by explaining that no relevant data is available. Offer further assistance or suggest the user contact the school for more details.

Be polite, professional, and concise, but ensure you provide all necessary details.`;

        // Call OpenAI GPT API
        const gptResponse = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-4o-mini', // Choose the model (e.g., gpt-4 or gpt-3.5-turbo)
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage },
                ],
                max_tokens: 200, // Limit the response length
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        // Extract the bot's reply from the API response
        const botResponse = gptResponse.data.choices[0].message.content;
        //console.log('Response sent to client:', botResponse);

        // Send the response to the user
        res.json({ reply: botResponse });
    } catch (error) {
        console.error('Error communicating with OpenAI API:', error.message);

        // Return an error response
        res.status(500).json({
            reply: "Sorry, I encountered an issue generating a response. Try again later.",
        });
    }
});

// Default route (serves the frontend `index.html`)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
