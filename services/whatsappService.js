const axios = require('axios');
const config = require('../config/vars');

/**
 * Sends a text message to a specified phone number via the WhatsApp Business API.
 * @param {string} phoneNumber - The recipient's phone number (e.g., '2547xxxxxxxx').
 * @param {string} message - The text message content to send.
 */
async function sendMessage(phoneNumber, message) {
    try {
        const response = await axios.post(config.WHATSAPP_API_URL, {
            messaging_product: 'whatsapp', to: phoneNumber, text: {body: message}
        }, {
            headers: {
                'Authorization': `Bearer ${config.WHATSAPP_TOKEN}`, 'Content-Type': 'application/json'
            }
        });

        console.log('Message sent successfully:', response.data);
    } catch (error) {
        // Log detailed error information, especially from Axios response
        console.error('Error sending message:', error.response?.data || error.message);
    }
}


async function sendInteractiveMessageWithImage_3ReplyButtons(phoneNumber, message, button1, button2, button3) {
    try {
        const response = await axios.post(config.WHATSAPP_API_URL, {
            messaging_product: 'whatsapp', to: phoneNumber, type: 'interactive', interactive: {
                type: 'button', header: {
                    type: 'image', image: {
                        id: '778808051560594'
                    }
                }, body: {
                    text: message
                }, // footer: {
                //     text: "Lucky Shrub: Your gateway to succulents!™"
                // },
                action: {
                    buttons: [{
                        type: 'reply', reply: {
                            id: `1`, title: `${button1}`
                        }
                    }, {
                        type: 'reply', reply: {
                            id: `2`, title: `${button2}`
                        }
                    }, {
                        type: 'reply', reply: {
                            id: `3`, title: `${button3}`
                        }
                    }]
                }
            }
        }, {
            headers: {
                'Authorization': `Bearer ${config.WHATSAPP_TOKEN}`, 'Content-Type': 'application/json'
            }
        });

        console.log('Message sent successfully:', response.data);
    } catch (error) {
        // Log detailed error information, especially from Axios response
        console.error('Error sending message:', error.response?.data || error.message);
    }
}


async function sendInteractiveMessageWith3ReplyButtons(phoneNumber, message, button1, button2, button3) {
    try {
        const response = await axios.post(config.WHATSAPP_API_URL, {
            messaging_product: 'whatsapp', to: phoneNumber, type: 'interactive', interactive: {
                type: 'button', body: {
                    text: message
                }, // footer: {
                //     text: "Lucky Shrub: Your gateway to succulents!™"
                // },
                action: {
                    buttons: [{
                        type: 'reply', reply: {
                            id: `1`, title: `${button1}`
                        }
                    }, {
                        type: 'reply', reply: {
                            id: `2`, title: `${button2}`
                        }
                    }, {
                        type: 'reply', reply: {
                            id: `3`, title: `${button3}`
                        }
                    }]
                }
            }
        }, {
            headers: {
                'Authorization': `Bearer ${config.WHATSAPP_TOKEN}`, 'Content-Type': 'application/json'
            }
        });

        console.log('Message sent successfully:', response.data);
    } catch (error) {
        // Log detailed error information, especially from Axios response
        console.error('Error sending message:', error.response?.data || error.message);
    }
}

async function sendInteractiveMessageWith2ReplyButtons(phoneNumber, message, button1, button2) {
    try {
        const response = await axios.post(config.WHATSAPP_API_URL, {
            messaging_product: 'whatsapp', to: phoneNumber, type: 'interactive', interactive: {
                type: 'button', body: {
                    text: message
                }, // footer: {
                //     text: "Lucky Shrub: Your gateway to succulents!™"
                // },
                action: {
                    buttons: [{
                        type: 'reply', reply: {
                            id: `1`, title: `${button1}`
                        }
                    }, {
                        type: 'reply', reply: {
                            id: `2`, title: `${button2}`
                        }
                    }]
                }
            }
        }, {
            headers: {
                'Authorization': `Bearer ${config.WHATSAPP_TOKEN}`, 'Content-Type': 'application/json'
            }
        });

        console.log('Message sent successfully:', response.data);
    } catch (error) {
        // Log detailed error information, especially from Axios response
        console.error('Error sending message:', error.response?.data || error.message);
    }
}

async function sendInteractiveMessageWith1ReplyButton(phoneNumber, message, button1) {
    try {
        const response = await axios.post(config.WHATSAPP_API_URL, {
            messaging_product: 'whatsapp', to: phoneNumber, type: 'interactive', interactive: {
                type: 'button', body: {
                    text: message
                }, // footer: {
                //     text: "Lucky Shrub: Your gateway to succulents!™"
                // },
                action: {
                    buttons: [{
                        type: 'reply', reply: {
                            id: `1`, title: `${button1}`
                        }
                    }]
                }
            }
        }, {
            headers: {
                'Authorization': `Bearer ${config.WHATSAPP_TOKEN}`, 'Content-Type': 'application/json'
            }
        });

        console.log('Message sent successfully:', response.data);
    } catch (error) {
        // Log detailed error information, especially from Axios response
        console.error('Error sending message:', error.response?.data || error.message);
    }
}

async function sendInteractiveMessageWith1CTAButton(phoneNumber, message, button1) {
    try {
        const response = await axios.post(config.WHATSAPP_API_URL, {
            messaging_product: 'whatsapp', to: phoneNumber, type: 'interactive', interactive: {
                type: 'cta_url', body: {
                    text: message
                }, // footer: {
                //     text: "Lucky Shrub: Your gateway to succulents!™"
                // },
                action: {
                    name: 'cta_url', parameters: {
                        display_text: button1, url: 'https://www.tohero.be'
                    }
                }
            }
        }, {
            headers: {
                'Authorization': `Bearer ${config.WHATSAPP_TOKEN}`, 'Content-Type': 'application/json'
            }
        });

        console.log('Message sent successfully:', response.data);
    } catch (error) {
        // Log detailed error information, especially from Axios response
        console.error('Error sending message:', error.response?.data || error.message);
    }
}

async function sendInteractiveMessageWithList(phoneNumber) {
    try {
        const response = await axios.post(config.WHATSAPP_API_URL, {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: phoneNumber,
            type: "interactive",
            interactive: {
                type: "list", header: {
                    type: "text", text: "Choose Shipping Option"
                }, body: {
                    text: "Which shipping option do you prefer?"
                }, footer: {
                    text: "Lucky Shrub: Your gateway to succulents™"
                }, action: {
                    button: "Shipping Options", sections: [{
                        title: "I want it ASAP!", rows: [{
                            id: "priority_express", title: "Priority Mail Express", description: "Next Day to 2 Days"
                        }, {
                            id: "priority_mail", title: "Priority Mail", description: "1–3 Days"
                        }]
                    }, {
                        title: "I can wait a bit", rows: [{
                            id: "usps_ground_advantage", title: "USPS Ground Advantage", description: "2–5 Days"
                        }, {
                            id: "media_mail", title: "Media Mail", description: "2–8 Days"
                        }]
                    }]
                }
            }
        });

        console.log('Message sent successfully:', response.data);
    } catch (error) {
        // Log detailed error information, especially from Axios response
        console.error('Error sending message:', error.response?.data || error.message);
    }
}


async function sendInteractiveMessageWith3ReplyButtonsAdmin(phoneNumber, message, button1, button2, button3) {
    try {
        const response = await axios.post(config.WHATSAPP_API_URL, {
            messaging_product: 'whatsapp', to: phoneNumber, type: 'interactive', interactive: {
                type: 'button', body: {
                    text: message
                }, // footer: {
                //     text: "Lucky Shrub: Your gateway to succulents!™"
                // },
                action: {
                    buttons: [{
                        type: 'reply', reply: {
                            id: `${button1}`, title: `${button1}`
                        }
                    }, {
                        type: 'reply', reply: {
                            id: `${button2}`, title: `${button2}`
                        }
                    }, {
                        type: 'reply', reply: {
                            id: `${button3}`, title: `${button3}`
                        }
                    }]
                }
            }
        }, {
            headers: {
                'Authorization': `Bearer ${config.WHATSAPP_TOKEN}`, 'Content-Type': 'application/json'
            }
        });

        console.log('Message sent successfully:', response.data);
    } catch (error) {
        // Log detailed error information, especially from Axios response
        console.error('Error sending message:', error.response?.data || error.message);
    }
}

/**
 * Sends a text message to a specified phone number via the WhatsApp Business API.
 * @param {string} phoneNumber - The recipient's phone number (e.g., '2547xxxxxxxx').
 */
async function sendFlowEnglish(phoneNumber) {
    try {
        const response = await axios.post(config.WHATSAPP_API_URL, {
            messaging_product: 'whatsapp', to: phoneNumber, type: 'interactive', interactive: {
                type: 'flow', header: {
                    type: 'text',
//                    text: 'Header text - Not shown in draft mode'
                    text: 'Book your taxi'
                }, body: {
//                    text: 'Body text - Not shown in draft mode'
                    text: 'Enter your remaining booking details in the next screens'
                }, footer: {
//                    text: 'Footer text - Not shown in draft mode'
                    text: 'Submit your booking details'
                }, action: {
                    name: 'flow', parameters: {
                        flow_message_version: '3',
                        flow_action: 'navigate',
//                        flow_token: '<FLOW_TOKEN>',
                        flow_token: 'flowBookingDetailsEnglish',
// flow ID van test account
                        flow_id: 4370993453226332,
// flow ID van echte account
//                        flow_id: 887400394385913,
//                        flow_cta: 'CTA button text - Not shown in draft mode',
                        flow_cta: 'Enter booking details',
                        mode: 'draft',
//                        mode: 'published',
                        flow_action_payload: {
                            screen: 'ONE', data: {
//                                "<CUSTOM_KEY>": "<CUSTOM_VALUE>"
                                "<CUSTOM_KEY>": "screenOne"
                            }
                        }
                    }
                }
            }
        }, {
            headers: {
                'Authorization': `Bearer ${config.WHATSAPP_TOKEN}`, 'Content-Type': 'application/json'
            }
        });
        console.log('Message sent successfully:', response.data);
    } catch (error) {
        // Log detailed error information, especially from Axios response
        console.error('Error sending message:', error.response?.data || error.message);
    }
}

/**
 * Sends a text message to a specified phone number via the WhatsApp Business API.
 * @param {string} phoneNumber - The recipient's phone number (e.g., '2547xxxxxxxx').
 */
async function sendFlowFrench(phoneNumber) {
    try {
        const response = await axios.post(config.WHATSAPP_API_URL, {
            messaging_product: 'whatsapp', to: phoneNumber, type: 'interactive', interactive: {
                type: 'flow', header: {
                    type: 'text',
//                    text: 'Header text - Not shown in draft mode'
                    text: 'Reservez un taxi'
                }, body: {
//                    text: 'Body text - Not shown in draft mode'
                    text: 'Entrez les détails restants de votre réservation dans les écrans suivants'
                }, footer: {
//                    text: 'Footer text - Not shown in draft mode'
                    text: 'Soumettre les détails de votre réservation'
                }, action: {
                    name: 'flow', parameters: {
                        flow_message_version: '3',
                        flow_action: 'navigate',
//                        flow_token: '<FLOW_TOKEN>',
                        flow_token: 'flowBookingDetailsFrench',
// flow ID van test account
                        flow_id: 2686488961749887,
// flow ID van echte account
//                        flow_id: 1615232906346605,
//                        flow_cta: 'CTA button text - Not shown in draft mode',
                        flow_cta: 'Entrez les détails de la réservation',
                        mode: 'draft',
//                        mode: 'published',
                        flow_action_payload: {
                            screen: 'ONE', data: {
//                                "<CUSTOM_KEY>": "<CUSTOM_VALUE>"
                                "<CUSTOM_KEY>": "screenOne"
                            }
                        }
                    }
                }
            }
        }, {
            headers: {
                'Authorization': `Bearer ${config.WHATSAPP_TOKEN}`, 'Content-Type': 'application/json'
            }
        });
        console.log('Message sent successfully:', response.data);
    } catch (error) {
        // Log detailed error information, especially from Axios response
        console.error('Error sending message:', error.response?.data || error.message);
    }
}

/**
 * Sends a text message to a specified phone number via the WhatsApp Business API.
 * @param {string} phoneNumber - The recipient's phone number (e.g., '2547xxxxxxxx').
 */
async function sendFlowDutch(phoneNumber) {
    try {
        const response = await axios.post(config.WHATSAPP_API_URL, {
            messaging_product: 'whatsapp', to: phoneNumber, type: 'interactive', interactive: {
                type: 'flow', header: {
                    type: 'text',
//                    text: 'Header text - Not shown in draft mode'
                    text: 'Boek je taxi'
                }, body: {
//                    text: 'Body text - Not shown in draft mode'
                    text: 'Vul de resterende boeking details in via de volgende schermen'
                }, footer: {
//                    text: 'Footer text - Not shown in draft mode'
                    text: 'Dien je boeking details in'
                }, action: {
                    name: 'flow', parameters: {
                        flow_message_version: '3',
                        flow_action: 'navigate',
//                        flow_token: '<FLOW_TOKEN>',
                        flow_token: 'flowBookingDetailsDutch',
// flow ID van test account
                        flow_id: 860859213645292,
// flow ID van echte account
//                        flow_id: 4303059503294231,
//                        flow_cta: 'CTA button text - Not shown in draft mode',
                        flow_cta: 'Dien boeking details in',
                        mode: 'draft',
//                        mode: 'published',
                        flow_action_payload: {
                            screen: 'ONE', data: {
//                                "<CUSTOM_KEY>": "<CUSTOM_VALUE>"
                                "<CUSTOM_KEY>": "screenOne"
                            }
                        }
                    }
                }
            }
        }, {
            headers: {
                'Authorization': `Bearer ${config.WHATSAPP_TOKEN}`, 'Content-Type': 'application/json'
            }
        });
        console.log('Message sent successfully:', response.data);
    } catch (error) {
        // Log detailed error information, especially from Axios response
        console.error('Error sending message:', error.response?.data || error.message);
    }
}


module.exports = {
    sendMessage,
    sendInteractiveMessageWith3ReplyButtons,
    sendInteractiveMessageWith2ReplyButtons,
    sendInteractiveMessageWith1ReplyButton,
    sendInteractiveMessageWithList,
    sendInteractiveMessageWith1CTAButton,
    sendInteractiveMessageWithImage_3ReplyButtons,
    sendInteractiveMessageWith3ReplyButtonsAdmin,
    sendFlowEnglish,
    sendFlowFrench,
    sendFlowDutch
};