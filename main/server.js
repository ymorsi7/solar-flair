// Server for the Solar Analysis Agent DAIN service

require('dotenv').config();
const express = require('express');
const path = require('path');
const { handleUserRequest } = require('./agent_handler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Root route to serve the index.html file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/index.html'));
});

// Main endpoint for DAIN service
app.post('/api/dain/request', async (req, res) => {
  try {
    const response = await handleUserRequest(req.body, {
      sendIntermediateResponse: (data) => {
        // In a real implementation, this would use websockets or another mechanism
        // to send intermediate responses
        console.log('Intermediate response:', data);
      },
      conversationState: req.body.conversationState || {}
    });
    
    res.json({
      response: response.response,
      suggestions: response.suggestions,
      attachments: response.attachments,
      conversationState: response.conversationState
    });
  } catch (error) {
    console.error('Error handling request:', error);
    res.status(500).json({
      error: error.message,
      response: 'Sorry, I encountered an error while processing your request.'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Solar Analysis Agent service running on port ${PORT}`);
});