const fs = require('fs');
const path = require('path');
const http = require('http');
require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const { WebSocketServer } = require('ws');
const { marked } = require('marked');
const axios = require('axios');

// --- Configuration ---
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const PORT = process.env.PORT || 3000;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// --- Content Loading ---
const contentPath = __dirname; // The markdown files are in the same directory
let files = []; // This will now store objects { fileName: string, title: string }

/**
 * Loads and sorts the markdown files that make up the guidebook.
 */
function loadGuidebook() {
    try {
        files = fs.readdirSync(contentPath)
            .filter(file => file.endsWith('.md') && /^\d/.test(file)) // Only get numbered markdown files (e.g., "01_...")
            .sort();
        if (files.length === 0) {
            console.error('Error: No markdown (.md) files found.');
            process.exit(1);
        }

        // Extract titles from markdown files
        files = files.map(file => {
            const filePath = path.join(contentPath, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            const firstLine = content.split('\n')[0];
            let title = file.replace(/\.md$/, '').replace(/^\d+_/, '').replace(/_/g, ' '); // Default title from filename
            if (firstLine && firstLine.startsWith('# ')) {
                title = firstLine.substring(2).trim();
            }
            return { fileName: file, title: title };
        });
        console.log(`Loaded ${files.length} guidebook pages with titles.`);
    } catch (error) {
        console.error('Error reading content directory:', error);
        process.exit(1);
    }
}

/**
 * Sends a question to the Groq AI API and streams the response.
 * @param {string} question The user's question.
 * @param {number} pageIndex The index of the current page for context.
 * @param {WebSocket} ws The WebSocket client to send the response to.
 */
async function askAI(question, pageIndex, ws) {
    if (!GROQ_API_KEY || GROQ_API_KEY === "YOUR_GROQ_API_KEY_HERE") {
        const errorMessage = "AI functionality is disabled. Server is missing a valid GROQ_API_KEY in the .env file.";
        console.error(errorMessage);
        ws.send(JSON.stringify({ type: 'ai-error', payload: errorMessage }));
        return;
    }

    try {
        const pageContent = fs.readFileSync(path.join(contentPath, files[pageIndex].fileName), 'utf-8');

        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'llama-3.1-8b-instant', // A fast, current model on Groq
                messages: [
                    {
                        role: 'system',
                        content: `You are a helpful assistant for an interactive Kubernetes guidebook. Based on the provided context from the guidebook page, answer the user's question clearly and concisely. Context:\n\n${pageContent}`
                    },
                    {
                        role: 'user',
                        content: question
                    }
                ],
                stream: true,
            },
            {
                headers: {
                    'Authorization': `Bearer ${GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                responseType: 'stream'
            }
        );

        ws.send(JSON.stringify({ type: 'ai-start' }));
        // Stream response back to the client
        for await (const chunk of response.data) {
            const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.substring(6);
                    if (data.trim() === '[DONE]') {
                        ws.send(JSON.stringify({ type: 'ai-done' }));
                        return;
                    }
                    try {
                        const json = JSON.parse(data);
                        const content = json.choices[0]?.delta?.content;
                        if (content) {
                            ws.send(JSON.stringify({ type: 'ai-chunk', payload: content }));
                        }
                    } catch (e) { /* Ignore partial JSON from stream */ }
                }
            }
        }
    } catch (error) {
        let errorMessage = `Error communicating with AI: ${error.message}`;
        if (error.response) {
            // The error response data is a stream. We need to read it to get the actual error message.
            const errorBody = await new Promise((resolve) => {
                const bodyChunks = [];
                error.response.data.on('data', (chunk) => bodyChunks.push(chunk));
                error.response.data.on('end', () => resolve(Buffer.concat(bodyChunks).toString()));
            });

            console.error("AI API Response Body:", errorBody);

            try {
                // Try to parse the detailed error from the API
                const parsedError = JSON.parse(errorBody);
                errorMessage = `AI API Error: ${parsedError.error?.message || errorBody}`;
            } catch (e) {
                // If it's not JSON, use the status text.
                errorMessage = `AI API Error: ${error.response.statusText}`;
            }
        }
        ws.send(JSON.stringify({ type: 'ai-error', payload: errorMessage }));
    }
}

// --- Web Server Setup ---

app.use(express.static(path.join(__dirname, 'public'), {
    // This is the fix: Force the browser to never cache static files.
    setHeaders: function (res, path, stat) {
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
    }
}));

// API endpoint to get page content
app.get('/api/page/:index', (req, res) => {
    const index = parseInt(req.params.index, 10);
    if (isNaN(index) || index < 0 || index >= files.length) {
        return res.status(404).json({ error: 'Page not found' });
    }
    try {
        const fileData = files[index]; // Get the object with fileName and title
        const content = fs.readFileSync(path.join(contentPath, fileData.fileName), 'utf-8');
        const htmlContent = marked(content); // Convert markdown to HTML on the server
        res.json({
            content: htmlContent,
            page: index + 1,
            totalPages: files.length,
            title: fileData.title // Return the clean title
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to read page content' });
    }
});

// WebSocket connection handler
wss.on('connection', (ws) => {
    console.log('Client connected via WebSocket');

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            if (data.type === 'question' && data.question && data.pageIndex !== undefined) {
                console.log(`Received question for page ${data.pageIndex}: "${data.question}"`);
                askAI(data.question, data.pageIndex, ws);
            }
        } catch (e) {
            console.error('Invalid WebSocket message:', message.toString());
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

// --- Start Server ---
loadGuidebook();
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('Open this URL in your browser to use the guidebook.');
});