//require('dotenv').config(); // read API Key

const axios = require('axios');
const express = require('express');
const cors = require('cors');
const path = require("path");

const app = express();


// Middleware to parse JSON request bodies and handle CORS
app.use(express.json());
app.use(cors({ origin: '*' })); // Allow all origins (restrict in production)

// Serve static files (frontend)
app.use(express.static(path.join(__dirname, 'public')));

const ASSISTANT_ID = 'asst_ZnjlwXkf1ddTQaq6K8k2Uktp';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // API-Schlüssel aus Umgebungsvariablen

// Funktion: Anfrage an den Assistenten senden
async function queryAssistant(userMessage) {
    try {
        const response = await axios.post(
            `https://api.openai.com/v1/assistants/${ASSISTANT_ID}/messages`,
            {
                messages: [
                    { role: 'user', content: userMessage }
                ]
            },
            {
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data.choices[0].message.content; // Antwortinhalt zurückgeben
    } catch (error) {
        console.error('Error querying OpenAI Assistant:', error.response?.data || error.message);
        throw new Error('Failed to communicate with OpenAI Assistant.');
    }
}

// Route für den Chatbot
app.post('/chat', async (req, res) => {
    const userMessage = req.body.message;

    if (!userMessage) {
        return res.status(400).json({ reply: "I didn't receive a message!" });
    }

    try {
        const botResponse = await queryAssistant(userMessage); // Anfrage an den Assistenten
        res.json({ reply: botResponse }); // Antwort zurückgeben
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({
            reply: "Sorry, I encountered an issue generating a response. Try again later."
        });
    }
});

// Default route (serves the frontend `index.html`)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server (if not for serverless environments)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
