// Utility for Parsing User Input

const {check24h} = require("./dateUtils");
const {json} = require("express");

/**
 * Parses booking details from a WhatsApp message.
 * Expected message format (can be on separate lines, just using the text + ':' in front of each element, or everything simply separates by a ;)
 * Using flow instead with 8 fields on 3 screens
 * Date: YYYY/MM/DD
 * Time: hhmm
 * Number of passengers: X
 * Name: John Doe
 * Extra info:
 * @param {string} message - The raw message text from the user.
 * @param {string} interactiveType - Type of message (detecting flow).
 * @param {Object} flowReply - The flow reply from the user.
 * @returns {Object} An object containing parsed details (`date`, `time`, `passengers`)
 * and a `valid` boolean flag indicating successful parsing.
 */
function parseBookingDetails(message, interactiveType, flowReply) {
    const lines = message.split('\n'); // Split the message into individual lines
    const semicolons = message.split(';'); // Split the message into individual lines
    const details = {valid: false, date: null, time: null, passengers: null, name: null, info: null, alternativePhone: null, flightNr: null, luggage: null};

    if (interactiveType === 'nfm_reply') {
        try {

            console.log(JSON.parse(flowReply));

            details.date = JSON.parse(flowReply).screen_0_Date_0;
            details.time = JSON.parse(flowReply).screen_0_hhmm_1.replace(/\D/g, "");
            details.passengers = JSON.parse(flowReply).screen_0_18_2;
            details.name = JSON.parse(flowReply).screen_1_Name_0.trim();
            details.alternativePhone = JSON.parse(flowReply).screen_1_Phone_number_1;
            details.flightNr = JSON.parse(flowReply).screen_1_Flight_Nr_2;
            details.luggage = JSON.parse(flowReply).screen_2_Luggage_0;
            details.info = JSON.parse(flowReply).screen_2_Extra_info_1;
            if (details.date && details.time && check24h(details.date, details.time) && !isNaN(details.passengers) && details.passengers > 0 && details.passengers < 9 && details.name) {
                // TODO: Add further validation for date/time formats
                // Check date format validation (e.g., regex for DD/MM/YYYY) or date validity
                // (e.g., check-in before check-out).
                details.valid = true;
            }
        } catch (error) {
            console.error('Error parsing booking details:', error);
            details.valid = false; // Mark as invalid if any parsing error occurs
        }
    } else {
        try {
            lines.forEach(line => {
                // Check for date
                if (line.toLowerCase().includes('date:') || line.toLowerCase().includes('datum:')) {
                    details.date = line.split(':')[1]?.trim(); // Extract and trim the date part
                }
                // Check for time
                else if (line.toLowerCase().includes('time:') || line.toLowerCase().includes('tijdstip:') || line.toLowerCase().includes('heure:')) {
                    details.time = line.split(':')[1]?.trim(); // Extract and trim the time part
                }
                // Check for number of guests
                else if (line.toLowerCase().includes('passengers:') || line.toLowerCase().includes('passagers:') || line.toLowerCase().includes('passagiers:')) {
                    const guestsStr = line.split(':')[1]?.trim();
                    details.passengers = parseInt(guestsStr, 10); // Parse guests as an integer
                }
                // Check for name
                else if (line.toLowerCase().includes('name:') || line.toLowerCase().includes('nom:') || line.toLowerCase().includes('naam:')) {
                    details.name = line.split(':')[1]?.trim(); // Extract and trim the name part
                }
                // Check for additional info
                else if (line.toLowerCase().includes('info:') || line.toLowerCase().includes('complémentaires:')) {
                    details.info = line.split(':')[1]?.trim(); // Extract and trim the info part
                }
            });

            // Basic validation: ensure all required fields are present, passengers is a valid number between 1 and 8 and the date/time is 24h in the future
            if (details.date && details.time && check24h(details.date, details.time) && !isNaN(details.passengers) && details.passengers > 0 && details.passengers < 9 && details.name) {
                // TODO: Add further validation for date/time formats
                // Check date format validation (e.g., regex for DD/MM/YYYY) or date validity
                // (e.g., check-in before check-out).
                details.valid = true;
            } else try {
                semicolons.forEach(semicolon => {
                    // Check for date
                    if (semicolon.toLowerCase().includes('date:') || semicolon.toLowerCase().includes('datum:')) {
                        details.date = semicolon.split(':')[1]?.trim(); // Extract and trim the date part
                    }
                    // Check for time
                    else if (semicolon.toLowerCase().includes('time:') || semicolon.toLowerCase().includes('tijdstip:') || semicolon.toLowerCase().includes('heure:')) {
                        details.time = semicolon.split(':')[1]?.trim(); // Extract and trim the time part
                    }
                    // Check for number of guests
                    else if (semicolon.toLowerCase().includes('passengers:') || semicolon.toLowerCase().includes('passagers:') || semicolon.toLowerCase().includes('passagiers:')) {
                        const guestsStr = semicolon.split(':')[1]?.trim();
                        details.passengers = parseInt(guestsStr, 10); // Parse guests as an integer
                    }
                    // Check for name
                    else if (semicolon.toLowerCase().includes('name:') || semicolon.toLowerCase().includes('nom:') || semicolon.toLowerCase().includes('naam:')) {
                        details.name = semicolon.split(':')[1]?.trim(); // Extract and trim the name part
                    }
                    // Check for additional info
                    else if (semicolon.toLowerCase().includes('info:') || semicolon.toLowerCase().includes('complémentaires:')) {
                        details.info = semicolon.split(':')[1]?.trim(); // Extract and trim the info part
                    }
                });
                if (details.date && details.time && check24h(details.date, details.time) && !isNaN(details.passengers) && details.passengers > 0 && details.passengers < 9 && details.name) {
                    // TODO: Add further validation for date/time formats
                    // Check date format validation (e.g., regex for DD/MM/YYYY) or date validity
                    // (e.g., check-in before check-out).
                    details.valid = true;
                } else try {
                    details.date = semicolons[0].trim();
                    details.time = semicolons[1].trim();
                    details.passengers = semicolons[2].trim();
                    details.name = semicolons[3].trim();
                    details.info = semicolons[4].trim();
                    if (details.date && details.time && check24h(details.date, details.time) && !isNaN(details.passengers) && details.passengers > 0 && details.passengers < 9 && details.name) {
                        // TODO: Add further validation for date/time formats
                        // Check date format validation (e.g., regex for DD/MM/YYYY) or date validity
                        // (e.g., check-in before check-out).
                        details.valid = true;
                    }
                } catch (error) {
                    console.error('Error parsing booking details:', error);
                    details.valid = false; // Mark as invalid if any parsing error occurs
                }
            } catch (error) {
                console.error('Error parsing booking details:', error);
                details.valid = false; // Mark as invalid if any parsing error occurs
            }
        } catch (error) {
            console.error('Error parsing booking details:', error);
            details.valid = false; // Mark as invalid if any parsing error occurs
        }
    }
    return details;
}


/**
 * Parses booking details from a WhatsApp message.
 * Expected message format (can be on separate lines, just using the text + ':' in front of each element, or everything simply separates by a ;)
 * Date: YYYY/MM/DD
 * Time: hhmm
 * Number of passengers: X
 * Extra info: ...
 *
 * @param {string} message - The raw message text from the user.
 * @param {Object} context - The current conversation context.
 * @param {string} interactiveType - Type of message.
 * @param {Object} flowReply - The flow reply.
 * @returns {Object} An object containing parsed details (`date`, `time`, `passengers`)
 * and a `valid` boolean flag indicating successful parsing.
 */
function parseBookingDetailsForRebooking(message, context, interactiveType, flowReply) {
    const lines = message.split('\n'); // Split the message into individual lines
    const semicolons = message.split(';'); // Split the message into individual lines
    const details = {valid: false, date: null, time: null, passengers: null, name: context.name, info: null, alternativePhone: null, flightNr: null, luggage: null};
    if (interactiveType === 'nfm_reply') {
        try {
            details.date = JSON.parse(flowReply).screen_0_Date_0;
            details.time = JSON.parse(flowReply).screen_0_hhmm_1;
            details.passengers = JSON.parse(flowReply).screen_0_18_2;
            details.name = JSON.parse(flowReply).screen_1_Name_0.trim();
            details.alternativePhone = JSON.parse(flowReply).screen_1_Phone_number_1;
            details.flightNr = JSON.parse(flowReply).screen_1_Flight_Nr_2;
            details.luggage = JSON.parse(flowReply).screen_2_Luggage_0;
            details.info = JSON.parse(flowReply).screen_2_Extra_info_1;
            if (details.date && details.time && check24h(details.date, details.time) && !isNaN(details.passengers) && details.passengers > 0 && details.passengers < 9 && details.name) {
                // TODO: Add further validation for date/time formats
                // Check date format validation (e.g., regex for DD/MM/YYYY) or date validity
                details.valid = true;
            }
        } catch (error) {
            console.error('Error parsing booking details:', error);
            details.valid = false; // Mark as invalid if any parsing error occurs
        }
    } else {
        try {
            lines.forEach(line => {
                // Check for date
                if (line.toLowerCase().includes('date:') || line.toLowerCase().includes('datum:')) {
                    details.date = line.split(':')[1]?.trim(); // Extract and trim the date part
                }
                // Check for time
                else if (line.toLowerCase().includes('time:') || line.toLowerCase().includes('tijdstip:') || line.toLowerCase().includes('heure:')) {
                    details.time = line.split(':')[1]?.trim(); // Extract and trim the time part
                }
                // Check for number of guests
                else if (line.toLowerCase().includes('passengers:') || line.toLowerCase().includes('passagers:') || line.toLowerCase().includes('passagiers:')) {
                    const guestsStr = line.split(':')[1]?.trim();
                    details.passengers = parseInt(guestsStr, 10); // Parse guests as an integer
                }
                // Check for additional info
                else if (line.toLowerCase().includes('info:') || line.toLowerCase().includes('complémentaires:')) {
                    details.info = line.split(':')[1]?.trim(); // Extract and trim the info part
                }
            });

            // Basic validation: ensure all required fields are present, passengers is a valid number between 1 and 8 and the date/time is 24h in the future
            if (details.date && details.time && check24h(details.date, details.time) && !isNaN(details.passengers) && details.passengers > 0 && details.passengers < 9 && details.name) {
                // TODO: Add further validation for date/time formats
                // Check date format validation (e.g., regex for DD/MM/YYYY) or date validity
                // (e.g., check-in before check-out).
                details.valid = true;
            } else try {
                semicolons.forEach(semicolon => {
                    // Check for date
                    if (semicolon.toLowerCase().includes('date:') || semicolon.toLowerCase().includes('datum:')) {
                        details.date = semicolon.split(':')[1]?.trim(); // Extract and trim the date part
                    }
                    // Check for time
                    else if (semicolon.toLowerCase().includes('time:') || semicolon.toLowerCase().includes('tijdstip:') || semicolon.toLowerCase().includes('heure:')) {
                        details.time = semicolon.split(':')[1]?.trim(); // Extract and trim the time part
                    }
                    // Check for number of guests
                    else if (semicolon.toLowerCase().includes('passengers:') || semicolon.toLowerCase().includes('passagers:') || semicolon.toLowerCase().includes('passagiers:')) {
                        const guestsStr = semicolon.split(':')[1]?.trim();
                        details.passengers = parseInt(guestsStr, 10); // Parse guests as an integer
                    }
                    // Check for additional info
                    else if (semicolon.toLowerCase().includes('info:') || semicolon.toLowerCase().includes('complémentaires:')) {
                        details.info = semicolon.split(':')[1]?.trim(); // Extract and trim the info part
                    }
                });
                if (details.date && details.time && check24h(details.date, details.time) && !isNaN(details.passengers) && details.passengers > 0 && details.passengers < 9 && details.name) {
                    // TODO: Add further validation for date/time formats
                    // Check date format validation (e.g., regex for DD/MM/YYYY) or date validity
                    // (e.g., check-in before check-out).
                    details.valid = true;
                } else try {
                    details.date = semicolons[0].trim();
                    details.time = semicolons[1].trim();
                    details.passengers = semicolons[2].trim();
                    details.info = semicolons[3].trim();
                    if (details.date && details.time && check24h(details.date, details.time) && !isNaN(details.passengers) && details.passengers > 0 && details.passengers < 9 && details.name) {
                        // TODO: Add further validation for date/time formats
                        // Check date format validation (e.g., regex for DD/MM/YYYY) or date validity
                        // (e.g., check-in before check-out).
                        details.valid = true;
                    }
                } catch (error) {
                    console.error('Error parsing booking details:', error);
                    details.valid = false; // Mark as invalid if any parsing error occurs
                }
            } catch (error) {
                console.error('Error parsing booking details:', error);
                details.valid = false; // Mark as invalid if any parsing error occurs
            }
        } catch (error) {
            console.error('Error parsing booking details:', error);
            details.valid = false; // Mark as invalid if any parsing error occurs
        }
    }
    return details;
}

module.exports = {
    parseBookingDetails, parseBookingDetailsForRebooking
};
