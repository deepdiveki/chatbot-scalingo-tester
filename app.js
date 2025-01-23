require('dotenv').config(); // read API Key

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

// Chatbot route
app.post('/chat', async (req, res) => {
    const userMessage = req.body.message;

    if (!userMessage) {
        return res.status(400).json({ reply: "I didn't receive a message!" });
    }

    try {
        // Call OpenAI GPT API
        const gptResponse = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-4o-mini', // Choose the model (e.g., gpt-4 or gpt-3.5-turbo)
                messages: [
                    { role: 'system', content: 'You are a helpful chatbot.' },
                    { role: 'user', content: userMessage },
                ],
                max_tokens: 50, // Limit the response length
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

// Start server (if not for serverless environments)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
