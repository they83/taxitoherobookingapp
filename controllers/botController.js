const {STATES} = require('../config/constants');
const conversationModel = require('../models/conversationModel');
const bookingModel = require('../models/bookingModel');
const whatsappService = require('../services/whatsappService');
const {parseBookingDetails, parseBookingDetailsForRebooking} = require('../utils/parser');
const {messageTexts} = require("../config/messageTexts");
const {verifyAddress, getDistanceToAirport, getDistanceFromAirport} = require("../services/googleMapsService");
const {getBookingByBookingReference, getAllBookingsAdmin} = require("../models/bookingModel");
const {getConversationById, getAllConversations} = require("../models/conversationModel");
const {sendCSToAdmin, sendStopToAdmin, mailToAdmin} = require("../services/nodemailer");
const {getCustomers} = require("../models/customerModel");
const {getPrice, getAllPrices} = require("../models/priceModel");

/**
 * Processes an incoming message based on the current conversation state.
 * This is the central dispatcher for bot logic.
 * @param {string} phoneNumber - The user's phone number.
 * @param {string} messageText - The text content of the message.
 * @param {Object} conversation - The current conversation state object from the database.
 * @param {string} buttonReply
 * @param {string} interactiveType
 * @param {Object} flowReply
 */
async function processMessage(phoneNumber, messageText, conversation, buttonReply, interactiveType, flowReply) {
    const state = conversation.current_state;

    // Parse the context JSON from the database, default to an empty object if null/invalid
    const context = JSON.parse(JSON.stringify(conversation.context || {}));

    console.log(`Processing message for ${phoneNumber} in state: ${state} with message: "${messageText}" and button reply ${buttonReply}`);

    // Delegate to specific handlers based on the current state
    // Each handler will manage its own state transitions and context updates

    switch (state) {
        case STATES.START:
            await handleStart(phoneNumber, messageText, buttonReply);
            break;
        case STATES.SELECTING_LANGUAGE:
            await handleSelectingLanguage(phoneNumber, messageText, buttonReply, context);
            break;
        case STATES.SELECTING_ARRIVAL_OR_DEPARTURE:
            await handleSelectingArrivalOrDeparture(phoneNumber, messageText, buttonReply, context);
            break;
        case STATES.INCOMING_REBOOKING:
            await handleIncomingRebooking(phoneNumber, messageText, buttonReply, context);
            break;
        case STATES.SELECTING_REBOOKING:
            await handleSelectingRebooking(phoneNumber, messageText, buttonReply, context);
            break;
        case STATES.ENTERING_ADDRESS:
            await handleEnteringAddress(phoneNumber, messageText, buttonReply, context);
            break;
        case STATES.CHOOSING_PROCEED:
            await handleSelectingToProceed(phoneNumber, messageText, buttonReply, context);
            break;
        case STATES.CHOOSING_PROCEED_REBOOKING:
            await handleSelectingToProceedRebooking(phoneNumber, messageText, buttonReply, context);
            break;
        case STATES.CHOSE_STOP:
            // If conversation is stopped, typically restart
            break;
        case STATES.ENTERING_BOOKING_DETAILS:
            await handleEnteringBookingDetails(phoneNumber, messageText, buttonReply, context, interactiveType, flowReply);
            break;
        case STATES.ENTERING_REBOOKING_DETAILS:
            await handleEnteringRebookingDetails(phoneNumber, messageText, buttonReply, context, interactiveType, flowReply);
            break;
        case STATES.PENDING:
            // If the client sends anything else before the booking is verified it is added to the booking record in additional info
            await handlePending(phoneNumber, messageText, buttonReply, context);
            break;
        case STATES.COMPLETED:
            // If conversation is completed, typically restart
            break;
        case STATES.CS:
            // If conversation is sent to CS, typically restart
            break;
        default:
            // Fallback for unknown or unhandled states, usually resets to welcome
            console.warn(`Unknown state "${state}" for ${phoneNumber}. Resetting to welcome.`);
            await handleStart(phoneNumber, messageText, buttonReply);
    }
}

/**
 * Handles the START state: sends a welcome message and transitions to SELECTING_LANGUAGE.
 * @param {string} phoneNumber - The user's phone number.
 * @param {string} message - The incoming message.
 * @param buttonReply
 */
async function handleStart(phoneNumber, message, buttonReply) {
    if (message === 'en') {
        await whatsappService.sendInteractiveMessageWith3ReplyButtons(phoneNumber, messageTexts.selectionMessageShortEnglish, `1. From Zaventem 🛬`, `2. To Zaventem 🛫`, `3. CustomerService 💬`);
        // Transition to SELECTING_ARRIVAL_OR_DEPARTURE state, indicating the next steps are in English
        await conversationModel.updateConversationState(phoneNumber, STATES.SELECTING_ARRIVAL_OR_DEPARTURE, {language: 'english'});
    } else if (message === 'fr') {
        await whatsappService.sendInteractiveMessageWith3ReplyButtons(phoneNumber, messageTexts.selectionMessageShortFrench, `1. De Zaventem 🛬`, `2. Vers Zaventem 🛫`, `3. Service client 💬`);
        // Transition to SELECTING_ARRIVAL_OR_DEPARTURE state, indicating the next steps are in French
        await conversationModel.updateConversationState(phoneNumber, STATES.SELECTING_ARRIVAL_OR_DEPARTURE, {language: 'french'});
    } else if (message === 'nl') {
        await whatsappService.sendInteractiveMessageWith3ReplyButtons(phoneNumber, messageTexts.selectionMessageShortDutch, `1. Vanaf Zaventem 🛬`, `2. Naar Zaventem 🛫`, `3. CustomerService 💬`);
        // Transition to SELECTING_ARRIVAL_OR_DEPARTURE state, indicating the next steps are in Dutch
        await conversationModel.updateConversationState(phoneNumber, STATES.SELECTING_ARRIVAL_OR_DEPARTURE, {language: 'dutch'});
    } else {
        await whatsappService.sendInteractiveMessageWithImage_3ReplyButtons(phoneNumber, messageTexts.welcomeMessageShort, `1. English`, `2. Français`, `3. Nederlands`);
        // Update conversation state to SELECTING_LANGUAGE, clearing any previous context
        await conversationModel.updateConversationState(phoneNumber, STATES.SELECTING_LANGUAGE, {});
    }
}

/**
 * Handles the SELECTING_LANGUAGE state: guides user to select arrival or departure.
 * @param {string} phoneNumber - The user's phone number.
 * @param {string} message - The user's reply (e.g., '1', '2', '3') to select a language.
 * @param buttonReply
 * @param {Object} context - The current conversation context.
 */
async function handleSelectingLanguage(phoneNumber, message, buttonReply, context) {
    if (message === '1' || buttonReply === '1') {
        await whatsappService.sendInteractiveMessageWith3ReplyButtons(phoneNumber, messageTexts.selectionMessageShortEnglish, `1. From Zaventem 🛬`, `2. To Zaventem 🛫`, `3. CustomerService 💬`);
        // Transition to SELECTING_ARRIVAL_OR_DEPARTURE state, indicating the next steps are in English
        await conversationModel.updateConversationState(phoneNumber, STATES.SELECTING_ARRIVAL_OR_DEPARTURE, {language: 'english'});
    } else if (message === '2' || buttonReply === '2') {
        await whatsappService.sendInteractiveMessageWith3ReplyButtons(phoneNumber, messageTexts.selectionMessageShortFrench, `1. De Zaventem 🛬`, `2. Vers Zaventem 🛫`, `3. Service client 💬`);
        // Transition to SELECTING_ARRIVAL_OR_DEPARTURE state, indicating the next steps are in French
        await conversationModel.updateConversationState(phoneNumber, STATES.SELECTING_ARRIVAL_OR_DEPARTURE, {language: 'french'});
    } else if (message === '3' || buttonReply === '3') {
        await whatsappService.sendInteractiveMessageWith3ReplyButtons(phoneNumber, messageTexts.selectionMessageShortDutch, `1. Vanaf Zaventem 🛬`, `2. Naar Zaventem 🛫`, `3. CustomerService 💬`);
        // Transition to SELECTING_ARRIVAL_OR_DEPARTURE state, indicating the next steps are in Dutch
        await conversationModel.updateConversationState(phoneNumber, STATES.SELECTING_ARRIVAL_OR_DEPARTURE, {language: 'dutch'});
    } else {
        await whatsappService.sendMessage(phoneNumber, messageTexts.incorrectLanguageSelectionMessage);
    }
}

/**
 * Handles the SELECTING_ARRIVAL_OR_DEPARTURE state: prompts for an address.
 * @param {string} phoneNumber - The user's phone number.
 * @param {string} message - The user's reply (arrival, departure or contact CS).
 * @param buttonReply
 * @param {Object} context - The current conversation context, including the 'step' (english/french/dutch).
 */
async function handleSelectingArrivalOrDeparture(phoneNumber, message, buttonReply, context) {
    let selectedOption = '';

    if (context.language === 'english') {
        if (message.toLowerCase() === '0') {
            const currentContext = context
            await whatsappService.sendInteractiveMessageWithImage_3ReplyButtons(phoneNumber, messageTexts.welcomeMessageShort, `1. English`, `2. Français`, `3. Nederlands`);
            await conversationModel.updateConversationState(phoneNumber, STATES.SELECTING_LANGUAGE, currentContext);
        } else {
            const options = ['1', '2']; // Corresponds to the numbered list in handleSelectingLanguage
            const optionCs = ['3']; // Corresponds to the numbered list in handleSelectingLanguage
            const choices = ['From airport', 'To airport'];
            const choiceCs = ['cs'];
            if (options.includes(message) || options.includes(buttonReply)) {
                selectedOption = choices[parseInt(message || buttonReply) - 1];
                if (message === '1' || buttonReply === '1') {
                    await whatsappService.sendMessage(phoneNumber, messageTexts.arrivalMessageEnglish);
                } else if (message === '2' || buttonReply === '2') {
                    await whatsappService.sendMessage(phoneNumber, messageTexts.departureMessageEnglish);
                }
                await conversationModel.updateConversationState(phoneNumber, STATES.ENTERING_ADDRESS, {
                    selectedOption: selectedOption, language: context.language
                });
            } else if (optionCs.includes(message) || optionCs.includes(buttonReply)) {
                selectedOption = choiceCs[parseInt(message || buttonReply) - 3];
                await whatsappService.sendMessage(phoneNumber, messageTexts.csEnglish);
                await sendCSToAdmin(phoneNumber, context.language);
                // the conversation will be reset to welcome to allow the user to restart.
                await conversationModel.updateConversationState(phoneNumber, STATES.CS, {
                    selectedOption: selectedOption, language: context.language
                });
            } else {
                // Should not happen if state transitions are managed correctly
                await whatsappService.sendMessage(phoneNumber, messageTexts.incorrectSelectionMessageEnglish);
            }
        }
    } else if (context.language === 'french') {
        if (message.toLowerCase() === '0') {
            const currentContext = context
            await whatsappService.sendInteractiveMessageWithImage_3ReplyButtons(phoneNumber, messageTexts.welcomeMessageShort, `1. English`, `2. Français`, `3. Nederlands`);
            await conversationModel.updateConversationState(phoneNumber, STATES.SELECTING_LANGUAGE, currentContext);
        } else {
            const options = ['1', '2']; // Corresponds to the numbered list in handleSelectingLanguage
            const optionCs = ['3']; // Corresponds to the numbered list in handleSelectingLanguage
            const choices = ['From airport', 'To airport'];
            const choiceCs = ['cs'];
            if (options.includes(message) || options.includes(buttonReply)) {
                selectedOption = choices[parseInt(message || buttonReply) - 1];
                if (message === '1' || buttonReply === '1') {
                    await whatsappService.sendMessage(phoneNumber, messageTexts.arrivalMessageFrench);
                } else if (message === '2' || buttonReply === '2') {
                    await whatsappService.sendMessage(phoneNumber, messageTexts.departureMessageFrench);
                }
                await conversationModel.updateConversationState(phoneNumber, STATES.ENTERING_ADDRESS, {
                    selectedOption: selectedOption, language: context.language
                });
            } else if (optionCs.includes(message) || optionCs.includes(buttonReply)) {
                selectedOption = choiceCs[parseInt(message || buttonReply) - 3];
                await whatsappService.sendMessage(phoneNumber, messageTexts.csFrench);
                await sendCSToAdmin(phoneNumber, context.language);
                // the conversation will be reset to welcome to allow the user to restart.
                await conversationModel.updateConversationState(phoneNumber, STATES.CS, {
                    selectedOption: selectedOption, language: context.language
                });
            } else {
                // Should not happen if state transitions are managed correctly
                await whatsappService.sendMessage(phoneNumber, messageTexts.incorrectSelectionMessageFrench);
            }
        }
    } else if (context.language === 'dutch') {
        if (message.toLowerCase() === '0') {
            const currentContext = context
            await whatsappService.sendInteractiveMessageWithImage_3ReplyButtons(phoneNumber, messageTexts.welcomeMessageShort, `1. English`, `2. Français`, `3. Nederlands`);
            await conversationModel.updateConversationState(phoneNumber, STATES.SELECTING_LANGUAGE, currentContext);
        } else {
            const options = ['1', '2']; // Corresponds to the numbered list in handleSelectingLanguage
            const optionCs = ['3']; // Corresponds to the numbered list in handleSelectingLanguage
            const choices = ['From airport', 'To airport'];
            const choiceCs = ['cs'];
            if (options.includes(message) || options.includes(buttonReply)) {
                selectedOption = choices[parseInt(message || buttonReply) - 1];
                if (message === '1' || buttonReply === '1') {
                    await whatsappService.sendMessage(phoneNumber, messageTexts.arrivalMessageDutch);
                } else if (message === '2' || buttonReply === '2') {
                    await whatsappService.sendMessage(phoneNumber, messageTexts.departureMessageDutch);
                }
                await conversationModel.updateConversationState(phoneNumber, STATES.ENTERING_ADDRESS, {
                    selectedOption: selectedOption, language: context.language
                });
            } else if (optionCs.includes(message) || optionCs.includes(buttonReply)) {
                selectedOption = choiceCs[parseInt(message || buttonReply) - 3];
                await whatsappService.sendMessage(phoneNumber, messageTexts.csDutch);
                await sendCSToAdmin(phoneNumber, context.language);
                // the conversation will be reset to welcome to allow the user to restart.
                await conversationModel.updateConversationState(phoneNumber, STATES.CS, {
                    selectedOption: selectedOption, language: context.language
                });
            } else {
                // Should not happen if state transitions are managed correctly
                await whatsappService.sendMessage(phoneNumber, messageTexts.incorrectSelectionMessageDutch);
            }
        }
    }
}

/**
 * Handles the INCOMING_REBOOKING state: guides user to options for rebooking a previous ride.
 * @param {string} phoneNumber - The user's phone number.
 * @param {string} message - The user's message.
 * @param buttonReply
 * @param {Object} context - The current conversation context.
 */
async function handleIncomingRebooking(phoneNumber, message, buttonReply, context) {
// got previous booking and all details stored into new rebooking conversation context
    if (context.language === 'english') {
        if (context.selectedOption === 'From airport') {
            const newMessage = `Welcome back ${context.name}!

Would you like to rebook your previous ride from Zaventem airport to ${context.address}? 

You can book the same ride, book in the other direction, or book a new ride.`;
            await whatsappService.sendInteractiveMessageWithImage_3ReplyButtons(phoneNumber, newMessage, `Book again`, `In other direction`, `Book new ride`);
            await conversationModel.updateConversationState(phoneNumber, STATES.SELECTING_REBOOKING, context);
        } else {
            const newMessage = `Welcome back ${context.name}!

Would you like to rebook your previous ride from ${context.address} to Zaventem airport? 

You can book the same ride, book in the other direction, or book a new ride.`;
            await whatsappService.sendInteractiveMessageWithImage_3ReplyButtons(phoneNumber, newMessage, `Book again`, `In other direction`, `Book new ride`);
            await conversationModel.updateConversationState(phoneNumber, STATES.SELECTING_REBOOKING, context);
        }
    } else if (context.language === 'french') {
        if (context.selectedOption === 'From airport') {
            const newMessage = `Bienvenue à nouveau ${context.name}!

Souhaitez-vous réserver à nouveau votre trajet précédent de l'aéroport de Zaventem à ${context.address}?

Vous pouvez réserver le même trajet, réserver dans l'autre sens ou réserver un nouveau trajet.`;
            await whatsappService.sendInteractiveMessageWithImage_3ReplyButtons(phoneNumber, newMessage, `Même trajet`, `Dans l'autre sens`, `Nouveau trajet`);
            await conversationModel.updateConversationState(phoneNumber, STATES.SELECTING_REBOOKING, context);
        } else {
            const newMessage = `Bienvenue à nouveau ${context.name}!

Souhaitez-vous réserver à nouveau votre trajet précédent de ${context.address} à l'aéroport de Zaventem?

Vous pouvez réserver le même trajet, réserver dans l'autre sens ou réserver un nouveau trajet.`;
            await whatsappService.sendInteractiveMessageWithImage_3ReplyButtons(phoneNumber, newMessage, `Même trajet`, `Dans l'autre sens`, `Nouveau trajet`);
            await conversationModel.updateConversationState(phoneNumber, STATES.SELECTING_REBOOKING, context);
        }
    } else if (context.language === 'dutch') {
        if (context.selectedOption === 'From airport') {
            const newMessage = `Welkom terug ${context.name}!

Wil u de vorige rit van luchthaven Zaventem naar ${context.address} opnieuw boeken? 

U kan dezelfde rit opnieuw boeken, boeken in de andere richting, of een nieuwe rit boeken.`;
            await whatsappService.sendInteractiveMessageWithImage_3ReplyButtons(phoneNumber, newMessage, `Opnieuw boeken`, `In andere richting`, `Boek een nieuwe rit`);
            await conversationModel.updateConversationState(phoneNumber, STATES.SELECTING_REBOOKING, context);
        } else {
            const newMessage = `Welkom terug ${context.name}!

Wil u de vorige rit van ${context.address} naar luchthaven Zaventem opnieuw boeken? 

U kan dezelfde rit opnieuw boeken, boeken in de andere richting, of een nieuwe rit boeken`;
            await whatsappService.sendInteractiveMessageWithImage_3ReplyButtons(phoneNumber, newMessage, `Opnieuw boeken`, `In andere richting`, `Boek een nieuwe rit`);
            await conversationModel.updateConversationState(phoneNumber, STATES.SELECTING_REBOOKING, context);
        }
    }
}

/**
 * Handles the SELECTING_REBOOKING state: guides user to select rebooking a previous ride.
 * @param {string} phoneNumber - The user's phone number.
 * @param {string} message - The user's message.
 * @param buttonReply
 * @param {Object} context - The current conversation context.
 */
async function handleSelectingRebooking(phoneNumber, message, buttonReply, context) {
    if (context.language === 'english') {
        if (buttonReply === '1') {
            const addressMessage = `You entered this address: 
*${context.address}*
Our price is ${context.price}€.
Do you want to continue or stop?`;
            await whatsappService.sendInteractiveMessageWith2ReplyButtons(phoneNumber, addressMessage, `1. Continue`, `2. Stop`);
            // Store the entered address and transition to CHOOSING_PROCEED state
            await conversationModel.updateConversationState(phoneNumber, STATES.CHOOSING_PROCEED_REBOOKING, {
                selectedOption: context.selectedOption,
                language: context.language,
                address: context.address,
                distanceToAirport: context.distanceToAirport,
                durationToAirport: context.durationToAirport,
                distanceFromAirport: context.distanceFromAirport,
                durationFromAirport: context.durationFromAirport,
                price: context.price,
                rebooking: true,
                name: context.name
            });
        } else if (buttonReply === '2') {
            if (context.selectedOption === 'To airport') {
                newSelectedOption = 'From airport';
                const price = await getPrice(context.distanceToAirport, context.distanceFromAirport, newSelectedOption);
                let addressMessage = `You entered this address: 
*${context.address}*
Our price is ${price}€.
Do you want to continue or stop?`;
                if (price === null) {
                    addressMessage = `You entered this address: 
*${context.address}*
We do not have a price as this distance is above 600km. We will contact you later. 
Do you want to continue or stop?`;
                }
                await whatsappService.sendInteractiveMessageWith2ReplyButtons(phoneNumber, addressMessage, `1. Continue`, `2. Stop`);
                // Store the entered address and transition to CHOOSING_PROCEED state
                await conversationModel.updateConversationState(phoneNumber, STATES.CHOOSING_PROCEED_REBOOKING, {
                    selectedOption: newSelectedOption,
                    language: context.language,
                    address: context.address,
                    distanceToAirport: context.distanceToAirport,
                    durationToAirport: context.durationToAirport,
                    distanceFromAirport: context.distanceFromAirport,
                    durationFromAirport: context.durationFromAirport,
                    price: price,
                    rebooking: true,
                    name: context.name
                });
            } else if (context.selectedOption === 'From airport') {
                newSelectedOption = 'To airport';
                const price = await getPrice(context.distanceToAirport, context.distanceFromAirport, newSelectedOption);
                let addressMessage = `You entered this address: 
*${context.address}*
Our price is ${price}€.
Do you want to continue or stop?`;
                if (price === null) {
                    addressMessage = `You entered this address: 
*${context.address}*
We do not have a price as this distance is above 600km. We will contact you later. 
Do you want to continue or stop?`;
                }
                await whatsappService.sendInteractiveMessageWith2ReplyButtons(phoneNumber, addressMessage, `1. Continue`, `2. Stop`);
                // Store the entered address and transition to CHOOSING_PROCEED state
                await conversationModel.updateConversationState(phoneNumber, STATES.CHOOSING_PROCEED_REBOOKING, {
                    selectedOption: newSelectedOption,
                    language: context.language,
                    address: context.address,
                    distanceToAirport: context.distanceToAirport,
                    durationToAirport: context.durationToAirport,
                    distanceFromAirport: context.distanceFromAirport,
                    durationFromAirport: context.durationFromAirport,
                    price: price,
                    rebooking: true,
                    name: context.name
                });
            }
        } else if (buttonReply === '3') {
            await conversationModel.updateConversationState(phoneNumber, STATES.SELECTING_ARRIVAL_OR_DEPARTURE, {language: context.language})
            await whatsappService.sendInteractiveMessageWith3ReplyButtons(phoneNumber, messageTexts.selectionMessageShortEnglish, `1. From Zaventem 🛬`, `2. To Zaventem 🛫`, `3. CustomerService 💬`);
        } else {
            await whatsappService.sendMessage(phoneNumber, messageTexts.incorrectSelectionMessageEnglish);
        }
    } else if (context.language === 'french') {
        if (buttonReply === '1') {
            const addressMessage = `Vous avez saisi l'adresse suivante: 
*${context.address}*
Notre prix est ${price}€
Voulez-vous continuer ou arrêter?`;
            await whatsappService.sendInteractiveMessageWith2ReplyButtons(phoneNumber, addressMessage, `1. Continuer`, `2. Arrêter`);
            // Store the entered address and transition to CHOOSING_PROCEED state
            await conversationModel.updateConversationState(phoneNumber, STATES.CHOOSING_PROCEED_REBOOKING, {
                selectedOption: context.selectedOption,
                language: context.language,
                address: context.address,
                distanceToAirport: context.distanceToAirport,
                durationToAirport: context.durationToAirport,
                distanceFromAirport: context.distanceFromAirport,
                durationFromAirport: context.durationFromAirport,
                price: context.price,
                rebooking: true,
                name: context.name
            });
        } else if (buttonReply === '2') {
            if (context.selectedOption === 'To airport') {
                newSelectedOption = 'From airport';
                const price = await getPrice(context.distanceToAirport, context.distanceFromAirport, newSelectedOption);
                let addressMessage = `Vous avez saisi l'adresse suivante: 
*${context.address}*
Notre prix est ${price}€
Voulez-vous continuer ou arrêter?`;
                if (price === null) {
                    addressMessage = `Vous avez saisi l'adresse suivante: 
*${context.address}*
Nous n'avons pas de prix pour le moment, la distance étant supérieure à 600 km. Nous vous contacterons ultérieurement. 
Voulez-vous continuer ou arrêter?`;
                }
                await whatsappService.sendInteractiveMessageWith2ReplyButtons(phoneNumber, addressMessage, `1. Continuer`, `2. Arrêter`);
                // Store the entered address and transition to CHOOSING_PROCEED state
                await conversationModel.updateConversationState(phoneNumber, STATES.CHOOSING_PROCEED_REBOOKING, {
                    selectedOption: newSelectedOption,
                    language: context.language,
                    address: context.address,
                    distanceToAirport: context.distanceToAirport,
                    durationToAirport: context.durationToAirport,
                    distanceFromAirport: context.distanceFromAirport,
                    durationFromAirport: context.durationFromAirport,
                    price: price,
                    rebooking: true,
                    name: context.name
                });
            } else if (context.selectedOption === 'From airport') {
                newSelectedOption = 'To airport';
                const price = await getPrice(context.distanceToAirport, context.distanceFromAirport, newSelectedOption);
                let addressMessage = `Vous avez saisi l'adresse suivante: 
*${context.address}*
Notre prix est ${price}€
Voulez-vous continuer ou arrêter?`;
                if (price === null) {
                    addressMessage = `Vous avez saisi l'adresse suivante: 
*${context.address}*
Nous n'avons pas de prix pour le moment, la distance étant supérieure à 600 km. Nous vous contacterons ultérieurement. 
Voulez-vous continuer ou arrêter?`;
                }
                await whatsappService.sendInteractiveMessageWith2ReplyButtons(phoneNumber, addressMessage, `1. Continuer`, `2. Arrêter`);
                // Store the entered address and transition to CHOOSING_PROCEED state
                await conversationModel.updateConversationState(phoneNumber, STATES.CHOOSING_PROCEED_REBOOKING, {
                    selectedOption: newSelectedOption,
                    language: context.language,
                    address: context.address,
                    distanceToAirport: context.distanceToAirport,
                    durationToAirport: context.durationToAirport,
                    distanceFromAirport: context.distanceFromAirport,
                    durationFromAirport: context.durationFromAirport,
                    price: price,
                    rebooking: true,
                    name: context.name
                });
            }
        } else if (buttonReply === '3') {
            await conversationModel.updateConversationState(phoneNumber, STATES.SELECTING_ARRIVAL_OR_DEPARTURE, {language: context.language})
            await whatsappService.sendInteractiveMessageWith3ReplyButtons(phoneNumber, messageTexts.selectionMessageShortFrench, `1. De Zaventem 🛬`, `2. Vers Zaventem 🛫`, `3. Service client 💬`);
        } else {
            await whatsappService.sendMessage(phoneNumber, messageTexts.incorrectSelectionMessageFrench);
        }
    } else if (context.language === 'dutch') {
        if (buttonReply === '1') {
            const addressMessage = `U hebt dit adres opgegeven: 
*${context.address}*
Onze prijs is ${price}€
Wil u verdergaan of stoppen?`;
            await whatsappService.sendInteractiveMessageWith2ReplyButtons(phoneNumber, addressMessage, `1. Verdergaan`, `2. Stoppen`);
            // Store the entered address and transition to CHOOSING_PROCEED state
            await conversationModel.updateConversationState(phoneNumber, STATES.CHOOSING_PROCEED_REBOOKING, {
                selectedOption: context.selectedOption,
                language: context.language,
                address: context.address,
                distanceToAirport: context.distanceToAirport,
                durationToAirport: context.durationToAirport,
                distanceFromAirport: context.distanceFromAirport,
                durationFromAirport: context.durationFromAirport,
                price: context.price,
                rebooking: true,
                name: context.name
            });
        } else if (buttonReply === '2') {
            if (context.selectedOption === 'To airport') {
                newSelectedOption = 'From airport';
                const price = await getPrice(context.distanceToAirport, context.distanceFromAirport, newSelectedOption);
                let addressMessage = `U hebt dit adres opgegeven: 
*${context.address}*
Onze prijs is ${price}€
Wil u verdergaan of stoppen?`;
                if (price === null) {
                    addressMessage = `U hebt dit adres opgegeven: 
*${context.address}*
We hebben geen prijs hiervoor omdat de afstand hoger is dan 600km. We contacteren u hiervoor later. 
Wil u verdergaan of stoppen?`;
                }
                await whatsappService.sendInteractiveMessageWith2ReplyButtons(phoneNumber, addressMessage, `1. Verdergaan`, `2. Stoppen`);
                // Store the entered address and transition to CHOOSING_PROCEED state
                await conversationModel.updateConversationState(phoneNumber, STATES.CHOOSING_PROCEED_REBOOKING, {
                    selectedOption: newSelectedOption,
                    language: context.language,
                    address: context.address,
                    distanceToAirport: context.distanceToAirport,
                    durationToAirport: context.durationToAirport,
                    distanceFromAirport: context.distanceFromAirport,
                    durationFromAirport: context.durationFromAirport,
                    price: price,
                    rebooking: true,
                    name: context.name
                });
            } else if (context.selectedOption === 'From airport') {
                newSelectedOption = 'To airport';
                const price = await getPrice(context.distanceToAirport, context.distanceFromAirport, newSelectedOption);
                let addressMessage = `U hebt dit adres opgegeven: 
*${context.address}*
Onze prijs is ${price}€
Wil u verdergaan of stoppen?`;
                if (price === null) {
                    addressMessage = `U hebt dit adres opgegeven: 
*${context.address}*
We hebben geen prijs hiervoor omdat de afstand hoger is dan 600km. We contacteren u hiervoor later. 
Wil u verdergaan of stoppen?`;
                }
                await whatsappService.sendInteractiveMessageWith2ReplyButtons(phoneNumber, addressMessage, `1. Verdergaan`, `2. Stoppen`);
                // Store the entered address and transition to CHOOSING_PROCEED state
                await conversationModel.updateConversationState(phoneNumber, STATES.CHOOSING_PROCEED_REBOOKING, {
                    selectedOption: newSelectedOption,
                    language: context.language,
                    address: context.address,
                    distanceToAirport: context.distanceToAirport,
                    durationToAirport: context.durationToAirport,
                    distanceFromAirport: context.distanceFromAirport,
                    durationFromAirport: context.durationFromAirport,
                    price: price,
                    rebooking: true,
                    name: context.name
                });
            }
        } else if (buttonReply === '3') {
            await conversationModel.updateConversationState(phoneNumber, STATES.SELECTING_ARRIVAL_OR_DEPARTURE, {language: context.language})
            await whatsappService.sendInteractiveMessageWith3ReplyButtons(phoneNumber, messageTexts.selectionMessageShortDutch, `1. Vanaf Zaventem 🛬`, `2. Naar Zaventem 🛫`, `3. CustomerService 💬`);
        } else {
            await whatsappService.sendMessage(phoneNumber, messageTexts.incorrectSelectionMessageDutch);
        }
    }
}


/**
 * Handles the ENTERING_ADDRESS state: verifies the entered address and returns it, with a prompt to enter further booking details.
 * @param {string} phoneNumber - The user's phone number.
 * @param {string} message - The user's entered address.
 * @param buttonReply
 * @param {Object} context - The current conversation context.
 */
async function handleEnteringAddress(phoneNumber, message, buttonReply, context) {
    // Validate the entered address
    const verifiedAddress = await verifyAddress(message);
    console.log('Address verified successfully:', verifiedAddress);
    const toAirport = await getDistanceToAirport(message);
    const fromAirport = await getDistanceFromAirport(message);
    if (context.language === 'english') {
        if (message.toLowerCase() === '0') {
            const currentContext = context
            await whatsappService.sendInteractiveMessageWith3ReplyButtons(phoneNumber, messageTexts.selectionMessageShortEnglish, `1. From Zaventem 🛬`, `2. To Zaventem 🛫`, `3. CustomerService 💬`);
            await conversationModel.updateConversationState(phoneNumber, STATES.SELECTING_ARRIVAL_OR_DEPARTURE, currentContext);
        } else if (verifiedAddress.verdict != true) {
            console.log('Address not verified: ', message);
            await whatsappService.sendMessage(phoneNumber, messageTexts.addressErrorMessageEnglish);
        } else {
            const price = await getPrice(toAirport.distance, fromAirport.distance, context.selectedOption);
            let addressMessage = `You entered this address: 
*${context.address}*
Our price is ${price}€.
Do you want to continue or stop?`;
            if (price === null) {
                addressMessage = `You entered this address: 
*${context.address}*
We do not have a price as this distance is above 600km. We will contact you later. 
Do you want to continue or stop?`;
            }
            await whatsappService.sendInteractiveMessageWith2ReplyButtons(phoneNumber, addressMessage, `1. Continue`, `2. Stop`);
            // Store the entered address and transition to CHOOSING_PROCEED state
            await conversationModel.updateConversationState(phoneNumber, STATES.CHOOSING_PROCEED, {
                selectedOption: context.selectedOption,
                language: context.language,
                address: verifiedAddress.formattedAddress,
                distanceToAirport: toAirport.distance,
                durationToAirport: toAirport.duration,
                distanceFromAirport: fromAirport.distance,
                durationFromAirport: fromAirport.duration,
                price: price
            });
        }
    } else if (context.language === 'french') {
        if (message.toLowerCase() === '0') {
            const currentContext = context
            await whatsappService.sendInteractiveMessageWith3ReplyButtons(phoneNumber, messageTexts.selectionMessageShortFrench, `1. De Zaventem 🛬`, `2. Vers Zaventem 🛫`, `3. Service client 💬`);
            await conversationModel.updateConversationState(phoneNumber, STATES.SELECTING_ARRIVAL_OR_DEPARTURE, currentContext);
        } else if (verifiedAddress.verdict != true) {
            console.log('Address not verified: ', message);
            await whatsappService.sendMessage(phoneNumber, messageTexts.addressErrorMessageFrench);
        } else {
            const price = await getPrice(toAirport.distance, fromAirport.distance, context.selectedOption);
            let addressMessage = `Vous avez saisi l'adresse suivante: 
*${context.address}*
Notre prix est ${price}€
Voulez-vous continuer ou arrêter?`;
            if (price === null) {
                addressMessage = `Vous avez saisi l'adresse suivante: 
*${context.address}*
Nous n'avons pas de prix pour le moment, la distance étant supérieure à 600 km. Nous vous contacterons ultérieurement. 
Voulez-vous continuer ou arrêter?`;
            }
            await whatsappService.sendInteractiveMessageWith2ReplyButtons(phoneNumber, addressMessage, `1. Continuer`, `2. Arrêter`);
            // Store the entered address and transition to CHOOSING_PROCEED state
            await conversationModel.updateConversationState(phoneNumber, STATES.CHOOSING_PROCEED, {
                selectedOption: context.selectedOption,
                language: context.language,
                address: verifiedAddress.formattedAddress,
                distanceToAirport: toAirport.distance,
                durationToAirport: toAirport.duration,
                distanceFromAirport: fromAirport.distance,
                durationFromAirport: fromAirport.duration,
                price: price
            });
        }
    } else if (context.language === 'dutch') {
        if (message.toLowerCase() === '0') {
            const currentContext = context
            await whatsappService.sendInteractiveMessageWith3ReplyButtons(phoneNumber, messageTexts.selectionMessageShortDutch, `1. Vanaf Zaventem 🛬`, `2. Naar Zaventem 🛫`, `3. CustomerService 💬`);
            await conversationModel.updateConversationState(phoneNumber, STATES.SELECTING_ARRIVAL_OR_DEPARTURE, currentContext);
        } else if (verifiedAddress.verdict != true) {
            console.log('Address not verified: ', message);
            await whatsappService.sendMessage(phoneNumber, messageTexts.addressErrorMessageDutch);
        } else {
            const price = await getPrice(toAirport.distance, fromAirport.distance, context.selectedOption);
            let addressMessage = `U hebt dit adres opgegeven: 
*${context.address}*
Onze prijs is ${price}€
Wil u verdergaan of stoppen?`;
            if (price === null) {
                addressMessage = `U hebt dit adres opgegeven: 
*${context.address}*
We hebben geen prijs hiervoor omdat de afstand hoger is dan 600km. We contacteren u hiervoor later. 
Wil u verdergaan of stoppen?`;
            }
            await whatsappService.sendInteractiveMessageWith2ReplyButtons(phoneNumber, addressMessage, `1. Verdergaan`, `2. Stoppen`);
            // Store the entered address and transition to CHOOSING_PROCEED state
            await conversationModel.updateConversationState(phoneNumber, STATES.CHOOSING_PROCEED, {
                selectedOption: context.selectedOption,
                language: context.language,
                address: verifiedAddress.formattedAddress,
                distanceToAirport: toAirport.distance,
                durationToAirport: toAirport.duration,
                distanceFromAirport: fromAirport.distance,
                durationFromAirport: fromAirport.duration,
                price: price
            });
        }
    }
}

/**
 * Handles the CHOOSING_PROCEED state: asks whether to proceed.
 * @param {string} phoneNumber - The user's phone number.
 * @param {string} message - The user's reply (arrival, departure or contact CS).
 * @param buttonReply
 * @param {Object} context - The current conversation context, including the 'step' (english/french/dutch).
 */
async function handleSelectingToProceed(phoneNumber, message, buttonReply, context) {
    if (context.language === 'english') {
        if (message.toLowerCase() === '0') {
            if (context.selectedOption === 'From airport') {
                await whatsappService.sendMessage(phoneNumber, messageTexts.arrivalMessageEnglish);
            } else if ((context.selectedOption === 'To airport')) {
                await whatsappService.sendMessage(phoneNumber, messageTexts.departureMessageEnglish);
            }
            await conversationModel.updateConversationState(phoneNumber, STATES.ENTERING_ADDRESS, context);
        } else {
            if (message === '1' || buttonReply === '1') {
                await whatsappService.sendFlowEnglish(phoneNumber);
                await conversationModel.updateConversationState(phoneNumber, STATES.ENTERING_BOOKING_DETAILS, context);
            } else if (message === '2' || buttonReply === '2') {
                await whatsappService.sendMessage(phoneNumber, messageTexts.stopMessageEnglish);
                await conversationModel.updateConversationState(phoneNumber, STATES.CHOSE_STOP, context);
                await sendStopToAdmin(phoneNumber, context);
            } else {
                // Should not happen if state transitions are managed correctly
                await whatsappService.sendMessage(phoneNumber, messageTexts.incorrectSelectionMessageEnglish);
            }
        }
    } else if (context.language === 'french') {
        if (message.toLowerCase() === '0') {
            if (context.selectedOption === 'From airport') {
                await whatsappService.sendMessage(phoneNumber, messageTexts.arrivalMessageFrench);
            } else if ((context.selectedOption === 'To airport')) {
                await whatsappService.sendMessage(phoneNumber, messageTexts.departureMessageFrench);
            }
            await conversationModel.updateConversationState(phoneNumber, STATES.ENTERING_ADDRESS, context);
        } else {
            if (message === '1' || buttonReply === '1') {
                await whatsappService.sendFlowFrench(phoneNumber);
                await conversationModel.updateConversationState(phoneNumber, STATES.ENTERING_BOOKING_DETAILS, context);
            } else if (message === '2' || buttonReply === '2') {
                await whatsappService.sendMessage(phoneNumber, messageTexts.stopMessageFrench);
                await conversationModel.updateConversationState(phoneNumber, STATES.CHOSE_STOP, context);
                await sendStopToAdmin(phoneNumber, context);
            } else {
                // Should not happen if state transitions are managed correctly
                await whatsappService.sendMessage(phoneNumber, messageTexts.incorrectSelectionMessageFrench);
            }
        }
    } else if (context.language === 'dutch') {
        if (message.toLowerCase() === '0') {
            if (context.selectedOption === 'From airport') {
                await whatsappService.sendMessage(phoneNumber, messageTexts.arrivalMessageDutch);
            } else if ((context.selectedOption === 'To airport')) {
                await whatsappService.sendMessage(phoneNumber, messageTexts.departureMessageDutch);
            }
            await conversationModel.updateConversationState(phoneNumber, STATES.ENTERING_ADDRESS, context);
        } else {
            if (message === '1' || buttonReply === '1') {
                await whatsappService.sendFlowDutch(phoneNumber);
                await conversationModel.updateConversationState(phoneNumber, STATES.ENTERING_BOOKING_DETAILS, context);
            } else if (message === '2' || buttonReply === '2') {
                await whatsappService.sendMessage(phoneNumber, messageTexts.stopMessageDutch);
                await conversationModel.updateConversationState(phoneNumber, STATES.CHOSE_STOP, context);
                await sendStopToAdmin(phoneNumber, context);
            } else {
                // Should not happen if state transitions are managed correctly
                await whatsappService.sendMessage(phoneNumber, messageTexts.incorrectSelectionMessageDutch);
            }
        }
    }
}


/**
 * Handles the ENTERING_BOOKING_DETAILS state: parses date, time, nr of passengers, name and extra info.
 *                 Date: 2026/08/15
 *                 Time: 14:30
 *                 Nr of passengers: 2
 *                 Name: John Doe
 *                 Extra info: ...`
 * @param {string} phoneNumber - The user's phone number.
 * @param {string} message - The user's message containing booking details.
 * @param buttonReply
 * @param {Object} context - The current conversation context.
 * @param {string} interactiveType - The current conversation context.
 * @param {Object} flowReply - The current conversation context.
 */
async function handleEnteringBookingDetails(phoneNumber, message, buttonReply, context, interactiveType, flowReply) {
    const bookingDetails = parseBookingDetails(message, interactiveType, flowReply); // Parse details using the utility function
    if (context.language === 'english' && message.toLowerCase() === '0') {
        if (context.selectedOption.toLowerCase() === 'from airport') {
            const currentContext = context
            await whatsappService.sendMessage(phoneNumber, messageTexts.arrivalMessageEnglish);
            await conversationModel.updateConversationState(phoneNumber, STATES.ENTERING_ADDRESS, currentContext);
        } else if (context.selectedOption.toLowerCase() === 'to airport') {
            const currentContext = context
            await whatsappService.sendMessage(phoneNumber, messageTexts.departureMessageEnglish);
            await conversationModel.updateConversationState(phoneNumber, STATES.ENTERING_ADDRESS, currentContext);
        }
    } else if (context.language === 'french' && (message.toLowerCase() === '0')) {
        if (context.selectedOption.toLowerCase() === 'from airport') {
            const currentContext = context
            await whatsappService.sendMessage(phoneNumber, messageTexts.arrivalMessageFrench);
            await conversationModel.updateConversationState(phoneNumber, STATES.ENTERING_ADDRESS, currentContext);
        }
        if (context.selectedOption.toLowerCase() === 'to airport') {
            const currentContext = context
            await whatsappService.sendMessage(phoneNumber, messageTexts.departureMessageFrench);
            await conversationModel.updateConversationState(phoneNumber, STATES.ENTERING_ADDRESS, currentContext);
        }
    } else if (context.language === 'dutch' && message.toLowerCase() === '0') {
        if (context.selectedOption.toLowerCase() === 'from airport') {
            const currentContext = context
            await whatsappService.sendMessage(phoneNumber, messageTexts.arrivalMessageDutch);
            await conversationModel.updateConversationState(phoneNumber, STATES.ENTERING_ADDRESS, currentContext);
        }
        if (context.selectedOption.toLowerCase() === 'to airport') {
            const currentContext = context
            await whatsappService.sendMessage(phoneNumber, messageTexts.departureMessageDutch);
            await conversationModel.updateConversationState(phoneNumber, STATES.ENTERING_ADDRESS, currentContext);
        }
    } else if (bookingDetails.valid) {
        if (context.language === 'english') {
            if (context.selectedOption.toLowerCase() === 'from airport') {
                // Store all booking details in context, then transition to PENDING state
                const newContext = {
                    language: context.language,
                    selectedOption: context.selectedOption,
                    address: context.address,
                    distanceToAirport: context.distanceToAirport,
                    durationToAirport: context.durationToAirport,
                    distanceFromAirport: context.distanceFromAirport,
                    durationFromAirport: context.durationFromAirport,
                    price: context.price,
                    date: bookingDetails.date,
                    time: bookingDetails.time,
                    passengers: bookingDetails.passengers,
                    name: bookingDetails.name
                        .split(' ') // split on white space, so you have an array of words
                        .map(word => word[0].toUpperCase() + word.slice(1)) // map each word, capitalizing the first letter
                        .join(' ') // join it all back together with a space
                    ,
                    info: bookingDetails.info,
                    alternativePhone: bookingDetails.alternativePhone,
                    luggage: bookingDetails.luggage,
                    flightNr: bookingDetails.flightNr
                };
                let conversation = await conversationModel.getConversation(phoneNumber);
                let bookingReference = '';
                if (conversation.booking_reference === null) {
                    let bookingRef = await bookingModel.createBooking(phoneNumber, newContext);
                    bookingReference = bookingRef;
                    await conversationModel.updateConversationState(phoneNumber, STATES.PENDING, newContext);
                    await conversationModel.addBookingRefToConversation(phoneNumber, JSON.parse(bookingRef));
                } else {
                    bookingReference = conversation.booking_reference;
                    await bookingModel.updateBooking(phoneNumber, newContext, conversation.booking_reference);
                    await conversationModel.updateConversationState(phoneNumber, STATES.PENDING, newContext);
                }
                const confirmationMessage = `Booking Summary:

Booking reference: ${bookingReference}
From Zaventem airport to ${context.address}
Date: ${bookingDetails.date}
Time: ${bookingDetails.time}
Guests: ${bookingDetails.passengers}
Name: ${bookingDetails.name.split(' ').map(word => word[0].toUpperCase() + word.slice(1)).join(' ')}
Alternative phone: ${bookingDetails.alternativePhone}
Flight number: ${bookingDetails.flightNr}
Luggage: ${bookingDetails.luggage}
Additional info: ${bookingDetails.info}
                    
When your booking is reviewed you will be contacted. You can still send additional info, or use 0 to go back to the last step, or CANCEL to start over.`;

                await whatsappService.sendMessage(phoneNumber, confirmationMessage);
            } else if (context.selectedOption.toLowerCase() === 'to airport') {
                // Store all booking details in context, then transition to PENDING state
                const newContext = {
                    language: context.language,
                    selectedOption: context.selectedOption,
                    address: context.address,
                    distanceToAirport: context.distanceToAirport,
                    durationToAirport: context.durationToAirport,
                    distanceFromAirport: context.distanceFromAirport,
                    durationFromAirport: context.durationFromAirport,
                    price: context.price,
                    date: bookingDetails.date,
                    time: bookingDetails.time,
                    passengers: bookingDetails.passengers,
                    name: bookingDetails.name.split(' ').map(word => word[0].toUpperCase() + word.slice(1)).join(' '),
                    info: bookingDetails.info,
                    alternativePhone: bookingDetails.alternativePhone,
                    luggage: bookingDetails.luggage,
                    flightNr: bookingDetails.flightNr
                };
                let conversation = await conversationModel.getConversation(phoneNumber);
                let bookingReference = '';
                if (conversation.booking_reference === null) {
                    let bookingRef = await bookingModel.createBooking(phoneNumber, newContext);
                    bookingReference = bookingRef;
                    await conversationModel.updateConversationState(phoneNumber, STATES.PENDING, newContext);
                    await conversationModel.addBookingRefToConversation(phoneNumber, JSON.parse(bookingRef));
                } else {
                    bookingReference = conversation.booking_reference;
                    await bookingModel.updateBooking(phoneNumber, newContext, conversation.booking_reference);
                    await conversationModel.updateConversationState(phoneNumber, STATES.PENDING, newContext);
                }
                const confirmationMessage = `Booking Summary:

Booking reference: ${bookingReference}
From ${context.address} to Zaventem airport
Date: ${bookingDetails.date}
Time: ${bookingDetails.time}
Guests: ${bookingDetails.passengers}
Name: ${bookingDetails.name.split(' ').map(word => word[0].toUpperCase() + word.slice(1)).join(' ')}
Alternative phone: ${bookingDetails.alternativePhone}
Flight number: ${bookingDetails.flightNr}
Luggage: ${bookingDetails.luggage}
Additional info: ${bookingDetails.info}
                    
When your booking is reviewed you will be contacted. You can still send additional info, or use 0 to go back to the last step, or CANCEL to start over.`;

                await whatsappService.sendMessage(phoneNumber, confirmationMessage);
            } else {
                await whatsappService.sendMessage(phoneNumber, messageTexts.couldNotParseBookingDetailsEnglish);
                await whatsappService.sendFlowEnglish(phoneNumber);

                // Stay in CONFIRM_BOOKING state with the same context to allow re-entry
            }
        } else if (context.language === 'french') {
            if (context.selectedOption.toLowerCase() === 'from airport') {
                // Store all booking details in context, then transition to PENDING state
                const newContext = {
                    language: context.language,
                    selectedOption: context.selectedOption,
                    address: context.address,
                    distanceToAirport: context.distanceToAirport,
                    durationToAirport: context.durationToAirport,
                    distanceFromAirport: context.distanceFromAirport,
                    durationFromAirport: context.durationFromAirport,
                    price: context.price,
                    date: bookingDetails.date,
                    time: bookingDetails.time,
                    passengers: bookingDetails.passengers,
                    name: bookingDetails.name.split(' ').map(word => word[0].toUpperCase() + word.slice(1)).join(' '),
                    info: bookingDetails.info,
                    alternativePhone: bookingDetails.alternativePhone,
                    luggage: bookingDetails.luggage,
                    flightNr: bookingDetails.flightNr
                };
                let conversation = await conversationModel.getConversation(phoneNumber);
                let bookingReference = '';
                if (conversation.booking_reference === null) {
                    let bookingRef = await bookingModel.createBooking(phoneNumber, newContext);
                    bookingReference = bookingRef;
                    await conversationModel.updateConversationState(phoneNumber, STATES.PENDING, newContext);
                    await conversationModel.addBookingRefToConversation(phoneNumber, JSON.parse(bookingRef));
                } else {
                    bookingReference = conversation.booking_reference;
                    await bookingModel.updateBooking(phoneNumber, newContext, conversation.booking_reference);
                    await conversationModel.updateConversationState(phoneNumber, STATES.PENDING, newContext);
                }
                const confirmationMessage = `Résumé de réservation:

Référence de réservation: ${bookingReference}
Depuis Zaventem vers ${context.address}
Date: ${bookingDetails.date}
Heure: ${bookingDetails.time}
Passagers: ${bookingDetails.passengers}
Nom: ${bookingDetails.name.split(' ').map(word => word[0].toUpperCase() + word.slice(1)).join(' ')}
Numéro de téléphone alternatif: ${bookingDetails.alternativePhone}
Numéro de vol : ${bookingDetails.flightNr}
Bagages : ${bookingDetails.luggage}
Informations complémentaires: ${bookingDetails.info}

Lorsque votre réservation sera examinée, vous serez contacté. Vous pouvez encore envoyer des informations supplémentaires, utiliser 0 pour revenir à l'étape précédente ou ANNULER pour recommencer.`;

                await whatsappService.sendMessage(phoneNumber, confirmationMessage);
            } else if (context.selectedOption.toLowerCase() === 'to airport') {
                // Store all booking details in context, then transition to PENDING state
                const newContext = {
                    language: context.language,
                    selectedOption: context.selectedOption,
                    address: context.address,
                    distanceToAirport: context.distanceToAirport,
                    durationToAirport: context.durationToAirport,
                    distanceFromAirport: context.distanceFromAirport,
                    durationFromAirport: context.durationFromAirport,
                    price: context.price,
                    date: bookingDetails.date,
                    time: bookingDetails.time,
                    passengers: bookingDetails.passengers,
                    name: bookingDetails.name.split(' ').map(word => word[0].toUpperCase() + word.slice(1)).join(' '),
                    info: bookingDetails.info,
                    alternativePhone: bookingDetails.alternativePhone,
                    luggage: bookingDetails.luggage,
                    flightNr: bookingDetails.flightNr
                };
                let conversation = await conversationModel.getConversation(phoneNumber);
                let bookingReference = '';
                if (conversation.booking_reference === null) {
                    let bookingRef = await bookingModel.createBooking(phoneNumber, newContext);
                    await conversationModel.updateConversationState(phoneNumber, STATES.PENDING, newContext);
                    await conversationModel.addBookingRefToConversation(phoneNumber, JSON.parse(bookingRef));
                    bookingReference = bookingRef;
                } else {
                    bookingReference = conversation.booking_reference;
                    await bookingModel.updateBooking(phoneNumber, newContext, bookingReference);
                    await conversationModel.updateConversationState(phoneNumber, STATES.PENDING, newContext);
                }
                const confirmationMessage = `Résumé de réservation:

Référence de réservation: ${bookingReference}
Depuis ${context.address} vers Zaventem
Date: ${bookingDetails.date}
Heure: ${bookingDetails.time}
Passagers: ${bookingDetails.passengers}
Nom: ${bookingDetails.name.split(' ').map(word => word[0].toUpperCase() + word.slice(1)).join(' ')}
Numéro de téléphone alternatif: ${bookingDetails.alternativePhone}
Numéro de vol : ${bookingDetails.flightNr}
Bagages : ${bookingDetails.luggage}
Informations complémentaires: ${bookingDetails.info}                    

Lorsque votre réservation sera examinée, vous serez contacté. Vous pouvez encore envoyer des informations supplémentaires, utiliser 0 pour revenir à l'étape précédente ou ANNULER pour recommencer.`;

                await whatsappService.sendMessage(phoneNumber, confirmationMessage);
            } else {
                await whatsappService.sendMessage(phoneNumber, messageTexts.couldNotParseBookingDetailsFrench);
                await whatsappService.sendFlowFrench(phoneNumber);
                // Stay in CONFIRM_BOOKING state with the same context to allow re-entry
            }
        } else if (context.language === 'dutch') {
            if (context.selectedOption.toLowerCase() === 'from airport') {
                // Store all booking details in context, then transition to PENDING state
                const newContext = {
                    language: context.language,
                    selectedOption: context.selectedOption,
                    address: context.address,
                    distanceToAirport: context.distanceToAirport,
                    durationToAirport: context.durationToAirport,
                    distanceFromAirport: context.distanceFromAirport,
                    durationFromAirport: context.durationFromAirport,
                    price: context.price,
                    date: bookingDetails.date,
                    time: bookingDetails.time,
                    passengers: bookingDetails.passengers,
                    name: bookingDetails.name.split(' ').map(word => word[0].toUpperCase() + word.slice(1)).join(' '),
                    info: bookingDetails.info,
                    alternativePhone: bookingDetails.alternativePhone,
                    luggage: bookingDetails.luggage,
                    flightNr: bookingDetails.flightNr
                };
                let conversation = await conversationModel.getConversation(phoneNumber);
                let bookingReference = '';
                if (conversation.booking_reference === null) {
                    let bookingRef = await bookingModel.createBooking(phoneNumber, newContext);
                    bookingReference = bookingRef;
                    await conversationModel.updateConversationState(phoneNumber, STATES.PENDING, newContext);
                    await conversationModel.addBookingRefToConversation(phoneNumber, JSON.parse(bookingRef));
                } else {
                    bookingReference = conversation.booking_reference;
                    await bookingModel.updateBooking(phoneNumber, newContext, conversation.booking_reference);
                    await conversationModel.updateConversationState(phoneNumber, STATES.PENDING, newContext);
                }
                const confirmationMessage = `Samenvatting reservatie:

Boeking referentie: ${bookingReference}
Van luchthaven Zaventem naar ${context.address}
Datum: ${bookingDetails.date}
Tijdstip: ${bookingDetails.time}
Passagiers: ${bookingDetails.passengers}
Naam: ${bookingDetails.name.split(' ').map(word => word[0].toUpperCase() + word.slice(1)).join(' ')}
Alternatief telefoonnummer: ${bookingDetails.alternativePhone}
Vluchtnummer: ${bookingDetails.flightNr}
Baggage: ${bookingDetails.luggage}
Extra info: ${bookingDetails.info}

Als je boeking is nagekeken zal je worden gecontacteerd. Je kan nog steeds extra info sturen, of 0 gebruiken om naar de vorige stap terug te keren, of 'ANNULEER' om opnieuw te beginnen.`;

                await whatsappService.sendMessage(phoneNumber, confirmationMessage);
            } else if (context.selectedOption.toLowerCase() === 'to airport') {
                // Store all booking details in context, then transition to PENDING state
                const newContext = {
                    language: context.language,
                    selectedOption: context.selectedOption,
                    address: context.address,
                    distanceToAirport: context.distanceToAirport,
                    durationToAirport: context.durationToAirport,
                    distanceFromAirport: context.distanceFromAirport,
                    durationFromAirport: context.durationFromAirport,
                    price: context.price,
                    date: bookingDetails.date,
                    time: bookingDetails.time,
                    passengers: bookingDetails.passengers,
                    name: bookingDetails.name.split(' ').map(word => word[0].toUpperCase() + word.slice(1)).join(' '),
                    info: bookingDetails.info,
                    alternativePhone: bookingDetails.alternativePhone,
                    luggage: bookingDetails.luggage,
                    flightNr: bookingDetails.flightNr
                };
                let conversation = await conversationModel.getConversation(phoneNumber);
                let bookingReference = '';
                if (conversation.booking_reference === null) {
                    let bookingRef = await bookingModel.createBooking(phoneNumber, newContext);
                    bookingReference = bookingRef;
                    await conversationModel.updateConversationState(phoneNumber, STATES.PENDING, newContext);
                    await conversationModel.addBookingRefToConversation(phoneNumber, JSON.parse(bookingRef));
                } else {
                    bookingReference = conversation.booking_reference;
                    await bookingModel.updateBooking(phoneNumber, newContext, conversation.booking_reference);
                    await conversationModel.updateConversationState(phoneNumber, STATES.PENDING, newContext);
                }
                const confirmationMessage = `Samenvatting reservatie:

Boeking referentie: ${bookingReference}
Van ${context.address} naar luchthaven Zaventem
Datum: ${bookingDetails.date}
Tijdstip: ${bookingDetails.time}
Passagiers: ${bookingDetails.passengers}
Naam: ${bookingDetails.name.split(' ').map(word => word[0].toUpperCase() + word.slice(1)).join(' ')}
Alternatief telefoonnummer: ${bookingDetails.alternativePhone}
Vluchtnummer: ${bookingDetails.flightNr}
Baggage: ${bookingDetails.luggage}
Extra info: ${bookingDetails.info}

Als je boeking is nagekeken zal je worden gecontacteerd. Je kan nog steeds extra info sturen, of 0 gebruiken om naar de vorige stap terug te keren, of 'ANNULEER' om opnieuw te beginnen.`;

                await whatsappService.sendMessage(phoneNumber, confirmationMessage);
            } else {
                await whatsappService.sendMessage(phoneNumber, messageTexts.couldNotParseBookingDetailsDutch);
                await whatsappService.sendFlowDutch(phoneNumber);
                // Stay in CONFIRM_BOOKING state with the same context to allow re-entry
            }

        }
    } else {
        if (context.language === 'english') {
            await whatsappService.sendMessage(phoneNumber, messageTexts.couldNotParseBookingDetailsEnglish);
            await whatsappService.sendFlowEnglish(phoneNumber);
            // Stay in state with the same context to allow re-entry
        } else if (context.language === 'french') {
            await whatsappService.sendMessage(phoneNumber, messageTexts.couldNotParseBookingDetailsFrench);
            await whatsappService.sendFlowFrench(phoneNumber);
            // Stay in state with the same context to allow re-entry
        } else if (context.language === 'dutch') {
            await whatsappService.sendMessage(phoneNumber, messageTexts.couldNotParseBookingDetailsDutch);
            await whatsappService.sendFlowDutch(phoneNumber);
            // Stay in state with the same context to allow re-entry
        }
    }
}

/**
 * Handles the CHOOSING_PROCEED_REBOOKING state: asks whether to proceed.
 * @param {string} phoneNumber - The user's phone number.
 * @param {string} message - The user's reply (arrival, departure or contact CS).
 * @param buttonReply
 * @param {Object} context - The current conversation context, including the 'step' (english/french/dutch).
 */
async function handleSelectingToProceedRebooking(phoneNumber, message, buttonReply, context) {
    if (context.language === 'english') {
        if (message.toLowerCase() === '0') {
            if (context.selectedOption === 'From airport') {
                await whatsappService.sendMessage(phoneNumber, messageTexts.arrivalMessageEnglish);
            } else if ((context.selectedOption === 'To airport')) {
                await whatsappService.sendMessage(phoneNumber, messageTexts.departureMessageEnglish);
            }
            await conversationModel.updateConversationState(phoneNumber, STATES.ENTERING_ADDRESS, context);
        } else {
            if (message === '1' || buttonReply === '1') {
                await whatsappService.sendFlowEnglish(phoneNumber);
                await conversationModel.updateConversationState(phoneNumber, STATES.ENTERING_REBOOKING_DETAILS, context);
            } else if (message === '2' || buttonReply === '2') {
                await whatsappService.sendMessage(phoneNumber, messageTexts.stopMessageEnglish);
                await conversationModel.updateConversationState(phoneNumber, STATES.CHOSE_STOP, context);
                await sendStopToAdmin(phoneNumber, context);
            } else {
                // Should not happen if state transitions are managed correctly
                await whatsappService.sendMessage(phoneNumber, messageTexts.incorrectSelectionMessageEnglish);
            }
        }
    } else if (context.language === 'french') {
        if (message.toLowerCase() === '0') {
            if (context.selectedOption === 'From airport') {
                await whatsappService.sendMessage(phoneNumber, messageTexts.arrivalMessageFrench);
            } else if ((context.selectedOption === 'To airport')) {
                await whatsappService.sendMessage(phoneNumber, messageTexts.departureMessageFrench);
            }
            await conversationModel.updateConversationState(phoneNumber, STATES.ENTERING_ADDRESS, context);
        } else {
            if (message === '1' || buttonReply === '1') {
                await whatsappService.sendFlowFrench(phoneNumber);
                await conversationModel.updateConversationState(phoneNumber, STATES.ENTERING_REBOOKING_DETAILS, context);
            } else if (message === '2' || buttonReply === '2') {
                await whatsappService.sendMessage(phoneNumber, messageTexts.stopMessageFrench);
                await conversationModel.updateConversationState(phoneNumber, STATES.CHOSE_STOP, context);
                await sendStopToAdmin(phoneNumber, context);
            } else {
                // Should not happen if state transitions are managed correctly
                await whatsappService.sendMessage(phoneNumber, messageTexts.incorrectSelectionMessageFrench);
            }
        }
    } else if (context.language === 'dutch') {
        if (message.toLowerCase() === '0') {
            if (context.selectedOption === 'From airport') {
                await whatsappService.sendMessage(phoneNumber, messageTexts.arrivalMessageDutch);
            } else if ((context.selectedOption === 'To airport')) {
                await whatsappService.sendMessage(phoneNumber, messageTexts.departureMessageDutch);
            }
            await conversationModel.updateConversationState(phoneNumber, STATES.ENTERING_ADDRESS, context);
        } else {
            if (message === '1' || buttonReply === '1') {
                await whatsappService.sendFlowDutch(phoneNumber);
                await conversationModel.updateConversationState(phoneNumber, STATES.ENTERING_REBOOKING_DETAILS, context);
            } else if (message === '2' || buttonReply === '2') {
                await whatsappService.sendMessage(phoneNumber, messageTexts.stopMessageDutch);
                await conversationModel.updateConversationState(phoneNumber, STATES.CHOSE_STOP, context);
                await sendStopToAdmin(phoneNumber, context);
            } else {
                // Should not happen if state transitions are managed correctly
                await whatsappService.sendMessage(phoneNumber, messageTexts.incorrectSelectionMessageDutch);
            }
        }
    }
}

/**
 * Handles the ENTERING_REBOOKING_DETAILS state: parses date, time, nr of passengers, name and extra info.
 *                 Date: 2026/08/15
 *                 Time: 14:30
 *                 Nr of passengers: 2
 *                 Extra info: ...`
 * @param {string} phoneNumber - The user's phone number.
 * @param {string} message - The user's message containing booking details.
 * @param {string} buttonReply
 * @param {Object} context - The current conversation context.
 * @param {string} interactiveType - Type of interactive message.
 * @param {Object} flowReply - The reply via flow.
 */
async function handleEnteringRebookingDetails(phoneNumber, message, buttonReply, context, interactiveType, flowReply) {
    const bookingDetails = parseBookingDetailsForRebooking(message, context, interactiveType, flowReply); // Parse details using the utility function
    console.log(bookingDetails);
    if (bookingDetails.valid) {
        if (context.language === 'english') {
            if (context.selectedOption.toLowerCase() === 'from airport') {
                // Store all booking details in context, then transition to PENDING state
                const newContext = {
                    language: context.language,
                    selectedOption: context.selectedOption,
                    address: context.address,
                    distanceToAirport: context.distanceToAirport,
                    durationToAirport: context.durationToAirport,
                    distanceFromAirport: context.distanceFromAirport,
                    durationFromAirport: context.durationFromAirport,
                    price: context.price,
                    date: bookingDetails.date,
                    time: bookingDetails.time,
                    passengers: bookingDetails.passengers,
                    name: bookingDetails.name
                        .split(' ') // split on white space, so you have an array of words
                        .map(word => word[0].toUpperCase() + word.slice(1)) // map each word, capitalizing the first letter
                        .join(' ') // join it all back together with a space
                    ,
                    info: bookingDetails.info,
                    alternativePhone: bookingDetails.alternativePhone,
                    luggage: bookingDetails.luggage,
                    flightNr: bookingDetails.flightNr
                };
                let conversation = await conversationModel.getConversation(phoneNumber);
                let bookingReference = '';
                if (conversation.booking_reference === null) {
                    let bookingRef = await bookingModel.createBooking(phoneNumber, newContext);
                    bookingReference = bookingRef;
                    await conversationModel.updateConversationState(phoneNumber, STATES.PENDING, newContext);
                    await conversationModel.addBookingRefToConversation(phoneNumber, JSON.parse(bookingRef));
                } else {
                    bookingReference = conversation.booking_reference;
                    await bookingModel.updateBooking(phoneNumber, newContext, conversation.booking_reference);
                    await conversationModel.updateConversationState(phoneNumber, STATES.PENDING, newContext);
                }
                const confirmationMessage = `Booking Summary:

Booking reference: ${bookingReference}
From Zaventem airport to ${context.address}
Date: ${bookingDetails.date}
Time: ${bookingDetails.time}
Guests: ${bookingDetails.passengers}
Name: ${bookingDetails.name.split(' ').map(word => word[0].toUpperCase() + word.slice(1)).join(' ')}
Alternative phone: ${bookingDetails.alternativePhone}
Flight number: ${bookingDetails.flightNr}
Luggage: ${bookingDetails.luggage}
Additional info: ${bookingDetails.info}
                    
When your booking is reviewed you will be contacted. You can still send additional info, or use 0 to go back to the last step, or CANCEL to start over.`;

                await whatsappService.sendMessage(phoneNumber, confirmationMessage);
            } else if (context.selectedOption.toLowerCase() === 'to airport') {
                // Store all booking details in context, then transition to PENDING state
                const newContext = {
                    language: context.language,
                    selectedOption: context.selectedOption,
                    address: context.address,
                    distanceToAirport: context.distanceToAirport,
                    durationToAirport: context.durationToAirport,
                    distanceFromAirport: context.distanceFromAirport,
                    durationFromAirport: context.durationFromAirport,
                    price: context.price,
                    date: bookingDetails.date,
                    time: bookingDetails.time,
                    passengers: bookingDetails.passengers,
                    name: bookingDetails.name.split(' ').map(word => word[0].toUpperCase() + word.slice(1)).join(' '),
                    info: bookingDetails.info,
                    alternativePhone: bookingDetails.alternativePhone,
                    luggage: bookingDetails.luggage,
                    flightNr: bookingDetails.flightNr
                };
                let conversation = await conversationModel.getConversation(phoneNumber);
                let bookingReference = '';
                if (conversation.booking_reference === null) {
                    let bookingRef = await bookingModel.createBooking(phoneNumber, newContext);
                    bookingReference = bookingRef;
                    await conversationModel.updateConversationState(phoneNumber, STATES.PENDING, newContext);
                    await conversationModel.addBookingRefToConversation(phoneNumber, JSON.parse(bookingRef));
                } else {
                    bookingReference = conversation.booking_reference;
                    await bookingModel.updateBooking(phoneNumber, newContext, conversation.booking_reference);
                    await conversationModel.updateConversationState(phoneNumber, STATES.PENDING, newContext);
                }
                const confirmationMessage = `Booking Summary:

Booking reference: ${bookingReference}
From ${context.address} to Zaventem airport
Date: ${bookingDetails.date}
Time: ${bookingDetails.time}
Guests: ${bookingDetails.passengers}
Name: ${bookingDetails.name.split(' ').map(word => word[0].toUpperCase() + word.slice(1)).join(' ')}
Alternative phone: ${bookingDetails.alternativePhone}
Flight number: ${bookingDetails.flightNr}
Luggage: ${bookingDetails.luggage}
Additional info: ${bookingDetails.info}
                    
When your booking is reviewed you will be contacted. You can still send additional info, or use 0 to go back to the last step, or CANCEL to start over.`;

                await whatsappService.sendMessage(phoneNumber, confirmationMessage);
            } else {
                await whatsappService.sendMessage(phoneNumber, messageTexts.couldNotParseBookingDetailsEnglish);
                await whatsappService.sendFlowEnglish(phoneNumber);

                // Stay in CONFIRM_BOOKING state with the same context to allow re-entry
            }
        } else if (context.language === 'french') {
            if (context.selectedOption.toLowerCase() === 'from airport') {
                // Store all booking details in context, then transition to PENDING state
                const newContext = {
                    language: context.language,
                    selectedOption: context.selectedOption,
                    address: context.address,
                    distanceToAirport: context.distanceToAirport,
                    durationToAirport: context.durationToAirport,
                    distanceFromAirport: context.distanceFromAirport,
                    durationFromAirport: context.durationFromAirport,
                    price: context.price,
                    date: bookingDetails.date,
                    time: bookingDetails.time,
                    passengers: bookingDetails.passengers,
                    name: bookingDetails.name.split(' ').map(word => word[0].toUpperCase() + word.slice(1)).join(' '),
                    info: bookingDetails.info,
                    alternativePhone: bookingDetails.alternativePhone,
                    luggage: bookingDetails.luggage,
                    flightNr: bookingDetails.flightNr
                };
                let conversation = await conversationModel.getConversation(phoneNumber);
                let bookingReference = '';
                if (conversation.booking_reference === null) {
                    let bookingRef = await bookingModel.createBooking(phoneNumber, newContext);
                    bookingReference = bookingRef;
                    await conversationModel.updateConversationState(phoneNumber, STATES.PENDING, newContext);
                    await conversationModel.addBookingRefToConversation(phoneNumber, JSON.parse(bookingRef));
                } else {
                    bookingReference = conversation.booking_reference;
                    await bookingModel.updateBooking(phoneNumber, newContext, conversation.booking_reference);
                    await conversationModel.updateConversationState(phoneNumber, STATES.PENDING, newContext);
                }
                const confirmationMessage = `Résumé de réservation:

Référence de réservation: ${bookingReference}
Depuis Zaventem vers ${context.address}
Date: ${bookingDetails.date}
Heure: ${bookingDetails.time}
Passagers: ${bookingDetails.passengers}
Nom: ${bookingDetails.name.split(' ').map(word => word[0].toUpperCase() + word.slice(1)).join(' ')}
Numéro de téléphone alternatif: ${bookingDetails.alternativePhone}
Numéro de vol : ${bookingDetails.flightNr}
Bagages : ${bookingDetails.luggage}
Informations complémentaires: ${bookingDetails.info}

Lorsque votre réservation sera examinée, vous serez contacté. Vous pouvez encore envoyer des informations supplémentaires, utiliser 0 pour revenir à l'étape précédente ou ANNULER pour recommencer.`;

                await whatsappService.sendMessage(phoneNumber, confirmationMessage);
            } else if (context.selectedOption.toLowerCase() === 'to airport') {
                // Store all booking details in context, then transition to PENDING state
                const newContext = {
                    language: context.language,
                    selectedOption: context.selectedOption,
                    address: context.address,
                    distanceToAirport: context.distanceToAirport,
                    durationToAirport: context.durationToAirport,
                    distanceFromAirport: context.distanceFromAirport,
                    durationFromAirport: context.durationFromAirport,
                    price: context.price,
                    date: bookingDetails.date,
                    time: bookingDetails.time,
                    passengers: bookingDetails.passengers,
                    name: bookingDetails.name.split(' ').map(word => word[0].toUpperCase() + word.slice(1)).join(' '),
                    info: bookingDetails.info,
                    alternativePhone: bookingDetails.alternativePhone,
                    luggage: bookingDetails.luggage,
                    flightNr: bookingDetails.flightNr
                };
                let conversation = await conversationModel.getConversation(phoneNumber);
                let bookingReference = '';
                if (conversation.booking_reference === null) {
                    let bookingRef = await bookingModel.createBooking(phoneNumber, newContext);
                    await conversationModel.updateConversationState(phoneNumber, STATES.PENDING, newContext);
                    await conversationModel.addBookingRefToConversation(phoneNumber, JSON.parse(bookingRef));
                    bookingReference = bookingRef;
                } else {
                    bookingReference = conversation.booking_reference;
                    await bookingModel.updateBooking(phoneNumber, newContext, bookingReference);
                    await conversationModel.updateConversationState(phoneNumber, STATES.PENDING, newContext);
                }
                const confirmationMessage = `Résumé de réservation:

Référence de réservation: ${bookingReference}
Depuis ${context.address} vers Zaventem
Date: ${bookingDetails.date}
Heure: ${bookingDetails.time}
Passagers: ${bookingDetails.passengers}
Nom: ${bookingDetails.name.split(' ').map(word => word[0].toUpperCase() + word.slice(1)).join(' ')}
Numéro de téléphone alternatif: ${bookingDetails.alternativePhone}
Numéro de vol : ${bookingDetails.flightNr}
Bagages : ${bookingDetails.luggage}
Informations complémentaires: ${bookingDetails.info}                    

Lorsque votre réservation sera examinée, vous serez contacté. Vous pouvez encore envoyer des informations supplémentaires, utiliser 0 pour revenir à l'étape précédente ou ANNULER pour recommencer.`;

                await whatsappService.sendMessage(phoneNumber, confirmationMessage);
            } else {
                await whatsappService.sendMessage(phoneNumber, messageTexts.couldNotParseBookingDetailsFrench);
                await whatsappService.sendFlowFrench(phoneNumber);
                // Stay in CONFIRM_BOOKING state with the same context to allow re-entry
            }
        } else if (context.language === 'dutch') {
            if (context.selectedOption.toLowerCase() === 'from airport') {
                // Store all booking details in context, then transition to PENDING state
                const newContext = {
                    language: context.language,
                    selectedOption: context.selectedOption,
                    address: context.address,
                    distanceToAirport: context.distanceToAirport,
                    durationToAirport: context.durationToAirport,
                    distanceFromAirport: context.distanceFromAirport,
                    durationFromAirport: context.durationFromAirport,
                    price: context.price,
                    date: bookingDetails.date,
                    time: bookingDetails.time,
                    passengers: bookingDetails.passengers,
                    name: bookingDetails.name.split(' ').map(word => word[0].toUpperCase() + word.slice(1)).join(' '),
                    info: bookingDetails.info,
                    alternativePhone: bookingDetails.alternativePhone,
                    luggage: bookingDetails.luggage,
                    flightNr: bookingDetails.flightNr
                };
                let conversation = await conversationModel.getConversation(phoneNumber);
                let bookingReference = '';
                if (conversation.booking_reference === null) {
                    let bookingRef = await bookingModel.createBooking(phoneNumber, newContext);
                    bookingReference = bookingRef;
                    await conversationModel.updateConversationState(phoneNumber, STATES.PENDING, newContext);
                    await conversationModel.addBookingRefToConversation(phoneNumber, JSON.parse(bookingRef));
                } else {
                    bookingReference = conversation.booking_reference;
                    await bookingModel.updateBooking(phoneNumber, newContext, conversation.booking_reference);
                    await conversationModel.updateConversationState(phoneNumber, STATES.PENDING, newContext);
                }
                const confirmationMessage = `Samenvatting reservatie:

Boeking referentie: ${bookingReference}
Van luchthaven Zaventem naar ${context.address}
Datum: ${bookingDetails.date}
Tijdstip: ${bookingDetails.time}
Passagiers: ${bookingDetails.passengers}
Naam: ${bookingDetails.name.split(' ').map(word => word[0].toUpperCase() + word.slice(1)).join(' ')}
Alternatief telefoonnummer: ${bookingDetails.alternativePhone}
Vluchtnummer: ${bookingDetails.flightNr}
Baggage: ${bookingDetails.luggage}
Extra info: ${bookingDetails.info}

Als je boeking is nagekeken zal je worden gecontacteerd. Je kan nog steeds extra info sturen, of 0 gebruiken om naar de vorige stap terug te keren, of 'ANNULEER' om opnieuw te beginnen.`;

                await whatsappService.sendMessage(phoneNumber, confirmationMessage);
            } else if (context.selectedOption.toLowerCase() === 'to airport') {
                // Store all booking details in context, then transition to PENDING state
                const newContext = {
                    language: context.language,
                    selectedOption: context.selectedOption,
                    address: context.address,
                    distanceToAirport: context.distanceToAirport,
                    durationToAirport: context.durationToAirport,
                    distanceFromAirport: context.distanceFromAirport,
                    durationFromAirport: context.durationFromAirport,
                    price: context.price,
                    date: bookingDetails.date,
                    time: bookingDetails.time,
                    passengers: bookingDetails.passengers,
                    name: bookingDetails.name.split(' ').map(word => word[0].toUpperCase() + word.slice(1)).join(' '),
                    info: bookingDetails.info,
                    alternativePhone: bookingDetails.alternativePhone,
                    luggage: bookingDetails.luggage,
                    flightNr: bookingDetails.flightNr
                };
                let conversation = await conversationModel.getConversation(phoneNumber);
                let bookingReference = '';
                if (conversation.booking_reference === null) {
                    let bookingRef = await bookingModel.createBooking(phoneNumber, newContext);
                    bookingReference = bookingRef;
                    await conversationModel.updateConversationState(phoneNumber, STATES.PENDING, newContext);
                    await conversationModel.addBookingRefToConversation(phoneNumber, JSON.parse(bookingRef));
                } else {
                    bookingReference = conversation.booking_reference;
                    await bookingModel.updateBooking(phoneNumber, newContext, conversation.booking_reference);
                    await conversationModel.updateConversationState(phoneNumber, STATES.PENDING, newContext);
                }
                const confirmationMessage = `Samenvatting reservatie:

Boeking referentie: ${bookingReference}
Van ${context.address} naar luchthaven Zaventem
Datum: ${bookingDetails.date}
Tijdstip: ${bookingDetails.time}
Passagiers: ${bookingDetails.passengers}
Naam: ${bookingDetails.name.split(' ').map(word => word[0].toUpperCase() + word.slice(1)).join(' ')}
Alternatief telefoonnummer: ${bookingDetails.alternativePhone}
Vluchtnummer: ${bookingDetails.flightNr}
Baggage: ${bookingDetails.luggage}
Extra info: ${bookingDetails.info}

Als je boeking is nagekeken zal je worden gecontacteerd. Je kan nog steeds extra info sturen, of 0 gebruiken om naar de vorige stap terug te keren, of 'ANNULEER' om opnieuw te beginnen.`;

                await whatsappService.sendMessage(phoneNumber, confirmationMessage);
            } else {
                await whatsappService.sendMessage(phoneNumber, messageTexts.couldNotParseBookingDetailsDutch);
                await whatsappService.sendFlowDutch(phoneNumber);
                // Stay in CONFIRM_BOOKING state with the same context to allow re-entry
            }
        }
    } else {
        if (context.language === 'english') {
            await whatsappService.sendMessage(phoneNumber, messageTexts.couldNotParseBookingDetailsEnglish);
            await whatsappService.sendFlowEnglish(phoneNumber);
            // Stay in state with the same context to allow re-entry
        } else if (context.language === 'french') {
            await whatsappService.sendMessage(phoneNumber, messageTexts.couldNotParseBookingDetailsFrench);
            await whatsappService.sendFlowFrench(phoneNumber);
            // Stay in state with the same context to allow re-entry
        } else if (context.language === 'dutch') {
            await whatsappService.sendMessage(phoneNumber, messageTexts.couldNotParseBookingDetailsDutch);
            await whatsappService.sendFlowDutch(phoneNumber);
            // Stay in state with the same context to allow re-entry
        }
    }
}


/**
 * Handles the PENDING state: sends an update of the status if a client asks when the booking has not yet been verified.
 * @param {string} phoneNumber - The user's phone number.
 * @param {string} message - The incoming message (not directly used here, but passed for consistency).
 * @param buttonReply
 * @param context
 */
async function handlePending(phoneNumber, message, buttonReply, context) {
    if (context.language === 'english') {
        if (message.toLowerCase() === '0') {
            if (context.rebooking) {
                await whatsappService.sendFlowEnglish(phoneNumber);
                await conversationModel.updateConversationState(phoneNumber, STATES.ENTERING_REBOOKING_DETAILS, context);
            } else {
                await whatsappService.sendFlowEnglish(phoneNumber);
                await conversationModel.updateConversationState(phoneNumber, STATES.ENTERING_BOOKING_DETAILS, context);
            }
        } else if (message.toLowerCase() === 'cancel') {
            // get the booking and set status canceled
            const conversation = await conversationModel.getConversation(phoneNumber);
            await bookingModel.cancelBooking(conversation.booking_reference);
            await whatsappService.sendInteractiveMessageWithImage_3ReplyButtons(phoneNumber, messageTexts.welcomeMessageShort, `1. English`, `2. Français`, `3. Nederlands`);
            await conversationModel.updateConversationState(phoneNumber, STATES.SELECTING_LANGUAGE, {});
        } else {
            const conversation = await conversationModel.getConversation(phoneNumber);
            await bookingModel.updateInfoForBooking(phoneNumber, message, conversation);
            await whatsappService.sendMessage(phoneNumber, messageTexts.pendingMessageEnglish);
        }
    } else if (context.language === 'french') {
        if (message.toLowerCase() === '0') {
            if (context.rebooking) {
                await whatsappService.sendFlowFrench(phoneNumber);
                await conversationModel.updateConversationState(phoneNumber, STATES.ENTERING_REBOOKING_DETAILS, context);
            } else {
                await whatsappService.sendFlowFrench(phoneNumber);
                await conversationModel.updateConversationState(phoneNumber, STATES.ENTERING_BOOKING_DETAILS, context);
            }
        } else if (message.toLowerCase() === 'annuler') {
            // get the booking and set status canceled
            const conversation = await conversationModel.getConversation(phoneNumber);
            await bookingModel.cancelBooking(conversation.booking_reference);
            await whatsappService.sendInteractiveMessageWithImage_3ReplyButtons(phoneNumber, messageTexts.welcomeMessageShort, `1. English`, `2. Français`, `3. Nederlands`);
            await conversationModel.updateConversationState(phoneNumber, STATES.SELECTING_LANGUAGE, {});
        } else {
            const conversation = await conversationModel.getConversation(phoneNumber);
            await bookingModel.updateInfoForBooking(phoneNumber, message, conversation);
            await whatsappService.sendMessage(phoneNumber, messageTexts.pendingMessageFrench);
        }
    } else if (context.language === 'dutch') {
        if (message.toLowerCase() === '0') {
            if (context.rebooking) {
                await whatsappService.sendFlowDutch(phoneNumber);
                await conversationModel.updateConversationState(phoneNumber, STATES.ENTERING_REBOOKING_DETAILS, context);
            } else {
                await whatsappService.sendFlowDutch(phoneNumber);
                await conversationModel.updateConversationState(phoneNumber, STATES.ENTERING_BOOKING_DETAILS, context);
            }
        } else if (message.toLowerCase() === 'annuleer') {
            // get the booking and set status canceled
            const conversation = await conversationModel.getConversation(phoneNumber);
            await bookingModel.cancelBooking(conversation.booking_reference);
            await whatsappService.sendInteractiveMessageWithImage_3ReplyButtons(phoneNumber, messageTexts.welcomeMessageShort, `1. English`, `2. Français`, `3. Nederlands`);
            await conversationModel.updateConversationState(phoneNumber, STATES.SELECTING_LANGUAGE, {});
        } else {
            const conversation = await conversationModel.getConversation(phoneNumber);
            await bookingModel.updateInfoForBooking(phoneNumber, message, conversation);
            await whatsappService.sendMessage(phoneNumber, messageTexts.pendingMessageDutch);
        }
    }
}


/**
 * Handles the admin options.
 * @param {string} phoneNumber - The user's phone number.
 * @param {string} message - The incoming message (not directly used here, but passed for consistency).
 * @param buttonReply
 */
async function handleAdmin(phoneNumber, message, buttonReply) {
    if (message === 'admin') {
        await whatsappService.sendInteractiveMessageWith3ReplyButtonsAdmin(phoneNumber, messageTexts.adminOverviewMessage, `1. Bookings`, `2. Context CS`, `3. Incomplete status`);
    } else if (message === 'allbookings' || buttonReply === '1. Bookings') {
        await whatsappService.sendInteractiveMessageWith3ReplyButtonsAdmin(phoneNumber, messageTexts.adminBookingsOverviewMessage, `1. Bookings pending`, `2. Confirmed today`, `3. Confirmed future`);
    } else if (message === 'mailtables') {
        await whatsappService.sendMessage(phoneNumber, messageTexts.adminMailMessage);
        const allBookings = await getAllBookingsAdmin();
        const allConversations = await getAllConversations();
        const allCustomers = await getCustomers();
        const allPrices = await getAllPrices();
        await mailToAdmin(allBookings, allConversations, allCustomers, allPrices);
    } else if (message === 'allcs' || buttonReply === '2. Context CS') {
        let allCs = await conversationModel.getAllCS();
        if (allCs[0] != null) {
            await allCs.forEach((csConversation) => {
                const csMessage = `Phone: ${csConversation.phone_number}
Language: ${csConversation.context.language}
ID: ${csConversation.id}
Status= ${csConversation.current_state}`;
                whatsappService.sendMessage(phoneNumber, csMessage);
            })
            await whatsappService.sendMessage(phoneNumber, messageTexts.adminCompleteMessage);
// send a bunch of messages, one for each conversation with status cs
// also sends instructions to completes these conversations
        } else {
            await whatsappService.sendMessage(phoneNumber, messageTexts.adminNoResultsMessage);
        }
    } else if (message === 'incomplete' || buttonReply === '3. Incomplete status') {
        let allIncomplete = await conversationModel.getAllIncomplete();
        if (allIncomplete[0] == null) {
            await whatsappService.sendMessage(phoneNumber, messageTexts.adminNoResultsMessage);
        } else {
            await allIncomplete.forEach((conversation) => {
                const inCompleteMessage = `Phone: ${conversation.phone_number}
Language: ${conversation.context.language}
Booking reference: ${conversation.booking_reference}
Name: ${conversation.context.name}
Date: ${conversation.context.date}
Time: ${conversation.context.time}
Passengers: ${conversation.context.passengers}
Extra info: ${conversation.context.info}
Option: ${conversation.context.selectedOption}
Address: ${conversation.context.address}
Distance to airport: ${conversation.context.distanceToAirport} (in meters)
Duration to airport: ${conversation.context.durationToAirport} (in seconds)
Distance from airport: ${conversation.context.distanceFromAirport} (in meters)
Duration from airport: ${conversation.context.durationFromAirport} (in seconds)
Price: ${conversation.context.price}
ID: ${conversation.id}`;
                whatsappService.sendMessage(phoneNumber, inCompleteMessage);
            })
            console.log(allIncomplete);
            await whatsappService.sendMessage(phoneNumber, messageTexts.adminCompleteMessage);
// send a bunch of messages, one for each conversation with incomplete status
// also sends instructions to completes these conversations
        }
    } else if (message === 'pendingbookings' || buttonReply === '1. Bookings pending') {
        let allBookings = await bookingModel.getBookingsAdmin();
        if (allBookings[0] == null) {
            await whatsappService.sendMessage(phoneNumber, messageTexts.adminNoResultsMessage);
        } else {
            allBookings.forEach((booking) => {
                const bookingMessage = `Booking reference: ${booking.booking_reference}
Phone: ${booking.phone_number}
Alternative phone: ${booking.alternative_phone_number}
Name: ${booking.customer_name}
Date: ${booking.date}
Time: ${booking.time}
Passengers: ${booking.passengers}
Flight number: ${booking.flight_nr}
Luggage: ${booking.luggage}
Extra info: ${booking.extra_info}
Option: ${booking.selected_option}
Address: ${booking.address}
Language: ${booking.language}
Distance to airport: ${booking.distance_to_airport} (in meters)
Duration to airport: ${booking.duration_to_airport} (in seconds)
Distance from airport: ${booking.distance_from_airport} (in meters)
Duration from airport: ${booking.duration_from_airport} (in seconds)
Price: ${booking.price}
`;
                whatsappService.sendMessage(phoneNumber, bookingMessage);
            })
            await whatsappService.sendMessage(phoneNumber, messageTexts.adminConfirmInstructionsMessage);
// send a bunch of messages, one for each booking with pending status
// also sends instructions to confirm a booking (which also updates the conversation with the same booking ref)
        }
    } else if (message === 'bookingstoday' || buttonReply === '2. Confirmed today') {
        let bookings = await bookingModel.getBookingsToday();
        if (bookings[0] == null) {
            await whatsappService.sendMessage(phoneNumber, messageTexts.adminNoResultsMessage);
        } else {
            bookings.forEach((booking) => {
                const bookingMessage = `Booking reference: ${booking.booking_reference}
Phone: ${booking.phone_number}
Alternative phone: ${booking.alternative_phone_number}
Name: ${booking.customer_name}
Date: ${booking.date}
Time: ${booking.time}
Passengers: ${booking.passengers}
Flight number: ${booking.flight_nr}
Luggage: ${booking.luggage}
Extra info: ${booking.extra_info}
Option: ${booking.selected_option}
Address: ${booking.address}
Language: ${booking.language}
Distance to airport: ${booking.distance_to_airport} (in meters)
Duration to airport: ${booking.duration_to_airport} (in seconds)
Distance from airport: ${booking.distance_from_airport} (in meters)
Duration from airport: ${booking.duration_from_airport} (in seconds)
Price: ${booking.price}
`;
                whatsappService.sendMessage(phoneNumber, bookingMessage);
            })
        }
// send a bunch of messages, one for each booking today and/or tomorrow
    } else if (message === 'bookingsfuture' || buttonReply === '3. Confirmed future') {
        let bookings = await bookingModel.getBookingsFuture();
        console.log(bookings);
        if (bookings[0] == null) {
            await whatsappService.sendMessage(phoneNumber, messageTexts.adminNoResultsMessage);
        } else {
            bookings.forEach((booking) => {
                const bookingMessage = `Booking reference: ${booking.booking_reference}
Phone: ${booking.phone_number}
Alternative phone: ${booking.alternative_phone_number}
Name: ${booking.customer_name}
Date: ${booking.date}
Time: ${booking.time}
Passengers: ${booking.passengers}
Flight number: ${booking.flight_nr}
Luggage: ${booking.luggage}
Extra info: ${booking.extra_info}
Option: ${booking.selected_option}
Address: ${booking.address}
Language: ${booking.language}
Distance to airport: ${booking.distance_to_airport} (in meters)
Duration to airport: ${booking.duration_to_airport} (in seconds)
Distance from airport: ${booking.distance_from_airport} (in meters)
Duration from airport: ${booking.duration_from_airport} (in seconds)
Price: ${booking.price}
`;
                whatsappService.sendMessage(phoneNumber, bookingMessage);
            })
        }
// send a bunch of messages, one for each booking in the future (after tomorrow)
    } else if (message.toLowerCase().includes('confirm:')) {
// finds the booking reference and sets its booking to confirmed
// finds the conversation and sets it to completed
// informs the client that the booking (with reference) has been confirmed
// informs the admin that the booking has been confirmed
        let bookingRef = '';
        bookingRef = message.split(':')[1]?.trim().toUpperCase(); // Extract and trim the booking reference
        const booking = await getBookingByBookingReference(bookingRef);
        if (booking === null) {
            await whatsappService.sendMessage(phoneNumber, messageTexts.adminNoBookingFoundMessage);
        } else {
            await bookingModel.confirmBooking(bookingRef, booking.phone_number, phoneNumber, booking.language);
        }
    } else if (message.toLowerCase().includes('update:')) {
// finds the booking reference and sets its booking to confirmed
// finds the conversation and sets it to completed
// DOES NOT inform the client that (to be used for maintenance after the booking)
// informs the admin that the booking has been confirmed
        let bookingRef = '';
        bookingRef = message.split(':')[1]?.trim().toUpperCase(); // Extract and trim the booking reference
        const booking = await getBookingByBookingReference(bookingRef);
        if (booking === null) {
            await whatsappService.sendMessage(phoneNumber, messageTexts.adminNoBookingFoundMessage);
        } else {
            await bookingModel.confirmBookingSilent(bookingRef, phoneNumber);
        }

    } else if (message.toLowerCase().includes('deleteb:')) {
// finds the booking reference and deletes the booking
// informs the admin that the booking has been deleted
        let bookingRef = '';
        bookingRef = message.split(':')[1]?.trim().toUpperCase(); // Extract and trim the booking reference
        const booking = await getBookingByBookingReference(bookingRef);
        if (booking === null) {
            await whatsappService.sendMessage(phoneNumber, messageTexts.adminNoBookingFoundMessage);
        } else {
            await bookingModel.deleteBooking(bookingRef, phoneNumber);
        }
    } else if (message.toLowerCase().includes('complete:')) {
// finds the conversation and sets its status to completed
// informs the admin that the conversation has been updated
        let id = '';
        id = message.split(':')[1]?.trim().toUpperCase(); // Extract and trim the booking reference
        const conversation = await getConversationById(id);
        if (conversation === null) {
            await whatsappService.sendMessage(phoneNumber, messageTexts.adminNoCsConversationFoundMessage);
        } else {
            await conversationModel.completeCsConversation(id);
            await whatsappService.sendMessage(phoneNumber, messageTexts.adminCsUpdatedMessage);
        }
    } else if (message.toLowerCase().includes('deletec:')) {
// finds the conversation and deletes it
// informs the admin that the conversation has been deleted
        let id = '';
        id = message.split(':')[1]?.trim().toUpperCase(); // Extract and trim the booking reference
        const conversation = await getConversationById(id);
        if (conversation === null) {
            await whatsappService.sendMessage(phoneNumber, messageTexts.adminNoCsConversationFoundMessage);
        } else {
            await conversationModel.deleteCsConversation(id);
            await whatsappService.sendMessage(phoneNumber, messageTexts.adminCsDeletedMessage);
        }
    }
}


module.exports = {
    processMessage,
    handleStart,
    handleSelectingLanguage,
    handleIncomingRebooking,
    handleSelectingRebooking,
    handleSelectingArrivalOrDeparture,
    handleEnteringAddress,
    handleSelectingToProceed,
    handleSelectingToProceedRebooking,
    handleEnteringBookingDetails,
    handleEnteringRebookingDetails,
    handlePending,
    handleAdmin
};