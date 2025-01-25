require('dotenv').config(); // read API Key

const axios = require('axios');
const express = require('express');
const cors = require('cors');
const path = require("path");
const { readFileSync } = require('fs');
const { Document, Packer } = require('docx');
const mammoth = require('mammoth');
//const spellchecker = require('spellchecker');

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

function correctSpelling(input) {
    const words = input.split(" ");
    const correctedWords = words.map(word => {
        if (spellchecker.isMisspelled(word)) {
            // Vorschlag für falsch geschriebene Wörter holen
            const suggestions = spellchecker.getCorrectionsForMisspelling(word);
            return suggestions.length > 0 ? suggestions[0] : word;
        }
        return word;
    });
    return correctedWords.join(" ");
}

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
        console.log("Document Chunks:", docChunks); // Verify the chunks
        console.log("Document content loaded and split into chunks.");

        // Start the server
        const PORT = process.env.PORT || 3001;
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Error initializing application:", error);
        process.exit(1);
    }
})();


//const systemPrompt = `Fragen zur Grundschule Mölln beantworten. Beziehe dich dabei auf Informationen: ${docContent}`;


// Middleware to parse JSON request bodies and handle CORS
app.use(express.json());
app.use(cors({ origin: '*' })); // Allow all origins (restrict in production)

// Serve static files (frontend)
app.use(express.static(path.join(__dirname, 'public')));

// Chatbot route
app.post('/chat', async (req, res) => {
    const userMessage = req.body.message;
    //userMessage = correctSpelling(userMessage);

    if (!userMessage) {
        return res.status(400).json({ reply: "I didn't receive a message!" });
    }

    try {
        // Find the most relevant chunks for the user query
        const relevantChunks = await findRelevantChunks(userMessage, docChunks);

        // Check if relevant chunks are found
        if (!relevantChunks || relevantChunks.length === 0) {
            console.error("No relevant chunks were found for the user query.");
            return res.status(500).json({ reply: "Leider habe ich keine passenden Informationen zu Ihrer Anfrage gefunden. Schreiben Sie uns gerne eine Email mit Ihrer Anfrage an: till-eulenspiegel-schule.moelln@schule.landsh.de" });
        } else {
            console.log("Relevant Chunks for the Query:", relevantChunks);
        }

        // Construct the system prompt
        const systemPrompt = `
You are an expert assistant for answering questions about the Grundschule Mölln.
Use the provided information to answer user queries in detail.
Below is the relevant information:

${relevantChunks.join('\n\n')}

Always reference this information when responding. If the question cannot be answered with the provided information, explain, that you could not find an answer and ask if there is any thing else, where you could possibly help.
`;

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

