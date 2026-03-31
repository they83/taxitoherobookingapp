const express = require('express');
const router = express.Router(); 
const webhookController = require('../controllers/webhookController'); 

// Route for WhatsApp webhook verification (GET request)
// Meta sends a GET request to verify your webhook URL.
router.get('/', webhookController.verifyWebhook);

// Route for receiving incoming WhatsApp messages (POST request)
// Meta sends POST requests to this endpoint when new messages arrive.
router.post('/', webhookController.receiveMessage);

module.exports = router; // Export the router