const config = require('../config/vars');
const conversationModel = require('../models/conversationModel');
const botController = require('./botController');
const whatsappService = require('../services/whatsappService');
const {messageTexts} = require("../config/messageTexts");
const constants = require("../config/constants");
const bookingModel = require("../models/bookingModel");
const {STATES} = require("../config/constants");

/**
 * Handles WhatsApp webhook verification (GET request).
 * This function is called by Meta to verify the webhook URL.
 */
const verifyWebhook = (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    // Check if the mode and token match the expected values
    if (mode === 'subscribe' && token === config.WEBHOOK_VERIFY_TOKEN) {
        console.log('Webhook verified successfully!');
        res.status(200).send(challenge); // Respond with the challenge to complete verification
    } else {
        res.status(403).send('Forbidden'); // Return 403 if verification fails
    }
};

/**
 * Handles incoming WhatsApp messages (POST request).
 * This function processes the payload from Meta's webhook.
 */
const receiveMessage = async (req, res) => {
    try {
        const body = req.body;
            // Ensure the payload is from a WhatsApp Business Account
        if (body.object === 'whatsapp_business_account') {
            // Iterate over each entry (can contain multiple changes)
            for (const entry of body.entry) {
                // Iterate over each change within an entry
                for (const change of entry.changes) {
                    // Check if the change is related to messages
                    if (change.field === 'messages') {
                        const messages = change.value.messages;
                        if (messages) {
                            // Process each individual message
                            for (const message of messages) {
                                await handleIncomingMessage(message);
                            }
                        }
                    }
                }
            }
        }
        res.status(200).send('OK'); // Acknowledge receipt of the webhook event
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).send('Internal Server Error');
    }
};

/**
 * Processes an individual incoming WhatsApp message.
 * It retrieves/creates conversation state and delegates to the bot controller.
 * @param {Object} message - The incoming message object from WhatsApp.
 */
async function handleIncomingMessage(message) {
    const phoneNumber = message.from;
    // Get message text, convert to lowercase, or default to empty string
    const messageText = message.text?.body?.toLowerCase() || '';
    const buttonReply = message.interactive?.button_reply?.id || '';
    const messageType = message.type;
    const interactiveType = message.interactive?.type?.toLowerCase() || '';
    const flowReply = message.interactive?.nfm_reply?.response_json || '';

    // Only process text (and interactive) messages for now. Other types (image, video, etc.) are ignored.
    if (messageType !== 'text' && messageType !== 'interactive') {
        let conversation = await conversationModel.getConversation(phoneNumber);
        const language = conversation.context.language
        if (language === 'english') {
            console.log(`Received non-text or non-interactive message type: ${messageType} from ${phoneNumber}. Skipping.`);
            await whatsappService.sendMessage(phoneNumber, messageTexts.unprocessedMessageEnglish);
            return;
        } else if (language === 'french') {
            console.log(`Received non-text or non-interactive message type: ${messageType} from ${phoneNumber}. Skipping.`);
            await whatsappService.sendMessage(phoneNumber, messageTexts.unprocessedMessageFrench);
            return;
        } else if (language === 'dutch') {
            console.log(`Received non-text or non-interactive message type: ${messageType} from ${phoneNumber}. Skipping.`);
            await whatsappService.sendMessage(phoneNumber, messageTexts.unprocessedMessageDutch);
            return;
        } else {
            console.log(`Received non-text or non-interactive message type: ${messageType} from ${phoneNumber}. Skipping.`);
            await whatsappService.sendMessage(phoneNumber, messageTexts.unprocessedMessageEnglish);
            return;
        }
    }
    try {
        // Get the current conversation state for the user's phone number
        let conversation = await conversationModel.getConversation(phoneNumber);
        const isAdmin = constants.admins.includes(phoneNumber)
        const adminTexts = ['admin', 'allbookings', '1. Bookings', 'allcs', '2. Context CS', 'incomplete', '3. Incomplete status', 'pendingbookings', '1. Bookings pending', 'bookingstoday', '2. Confirmed today', 'bookingsfuture', '3. Confirmed future', 'mailtables'];
        const isAdminText = (adminTexts.includes(messageText) || adminTexts.includes(buttonReply) || messageText.includes('confirm:') || messageText.includes('complete:') || messageText.includes('deleteb:') || messageText.includes('deletec:') || messageText.includes('update:'));
        const isAdminPrompt = isAdmin && isAdminText;

        // If no conversation exists, create a new one, unless it is an admin prompt
        if (!conversation) {
            if (isAdminPrompt) {
                await botController.handleAdmin(phoneNumber, messageText, buttonReply);
            } else {
                let previousBooking = await bookingModel.getBookingByPhoneNumber(phoneNumber);
                if (previousBooking) {
                    console.log(`Trying to create a new rebooking conversation for ${phoneNumber}`);
                    newConversation = await conversationModel.createRebookingConversation(phoneNumber, {
                        rebooking: true,
                        language: previousBooking.language,
                        selectedOption: previousBooking.selected_option,
                        address: previousBooking.address,
                        distanceToAirport: previousBooking.distance_to_airport,
                        durationToAirport: previousBooking.duration_to_airport,
                        distanceFromAirport: previousBooking.distance_from_airport,
                        durationFromAirport: previousBooking.duration_from_airport,
                        price: previousBooking.price,
                        name: previousBooking.customer_name
                    });
                    console.log(`New rebooking conversation created for ${phoneNumber}`);
                    await botController.processMessage(phoneNumber, messageText, newConversation, buttonReply, interactiveType, flowReply);
                } else {
                    conversation = await conversationModel.createConversation(phoneNumber);
                    // Delegate the message processing to the botController based on the conversation state
                    await botController.processMessage(phoneNumber, messageText, conversation, buttonReply, interactiveType, flowReply);
                }
            }
        } else if (conversation) {
            if (isAdminPrompt) {
                await botController.handleAdmin(phoneNumber, messageText, buttonReply);
            } else {
                await botController.processMessage(phoneNumber, messageText, conversation, buttonReply, interactiveType, flowReply);
            }
        }
    } catch (error) {
        let conversation = await conversationModel.getConversation(phoneNumber);
        const language = conversation.context.language
        if (language === 'english') {
            console.error('Error handling incoming message:', error);
            // Send a generic error message back to the user
            await whatsappService.sendMessage(phoneNumber, messageTexts.errorMessageEnglish);
        } else if (language === 'french') {
            console.error('Error handling incoming message:', error);
            // Send a generic error message back to the user
            await whatsappService.sendMessage(phoneNumber, messageTexts.errorMessageFrench);
        } else if (language === 'dutch') {
            console.error('Error handling incoming message:', error);
            // Send a generic error message back to the user
            await whatsappService.sendMessage(phoneNumber, messageTexts.errorMessageDutch);
        } else {
            console.error('Error handling incoming message:', error);
            // Send a generic error message back to the user
            await whatsappService.sendMessage(phoneNumber, messageTexts.errorMessageEnglish);
        }
    }
}

module.exports = {
    verifyWebhook, receiveMessage
};