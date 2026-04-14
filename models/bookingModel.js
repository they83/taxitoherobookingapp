const {getPool} = require('../config/db');
const whatsappService = require("../services/whatsappService");
const {messageTexts} = require("../config/messageTexts");
const {sendBookingToAdmin, sendUpdatedBookingToAdmin, sendCanceledBookingToAdmin} = require("../services/nodemailer");


/**
 * Retrieves a booking record from the database by phone number.
 * @param {string} phoneNumber - The user's phone number.
 * @returns {Object|null} The booking object if found, otherwise null.
 */
async function getBookingByPhoneNumber(phoneNumber) {
    const pool = getPool(); // Get the active database pool
    const client = await pool.connect();
    const sqlstring = "SELECT * FROM bookings WHERE phone_number = $1 order by id desc limit(1)";
    const {rows} = await client.query(sqlstring, [phoneNumber]);
    client.release();
    return rows[0] || null; // Return the first row or null if no record found
}


/**
 * Retrieves a booking record from the database by booking reference.
 * @param {string} bookingRef - The booking reference.
 * @returns {Object|null} The booking object if found, otherwise null.
 */
async function getBookingByBookingReference(bookingRef) {
    const pool = getPool(); // Get the active database pool
    const client = await pool.connect();
    const sqlstring = "SELECT * FROM bookings WHERE booking_reference = $1";
    const {rows} = await client.query(sqlstring, [bookingRef]);
    client.release();
    return rows[0] || null; // Return the first row or null if no record found
}

/**
 * Creates a new booking record in the database.
 * @param {string} phoneNumber - The user's phone number.
 * @param {Object} context - The conversation context containing selected language, address, booking details, ...
 * @returns {number} The `insertId` (ID of the newly created booking) from the database.
 */
async function createBooking(phoneNumber, context) {
    const pool = getPool();
    const client = await pool.connect();
    const {
        language,
        selectedOption,
        address,
        date,
        time,
        passengers,
        name,
        info,
        distanceToAirport,
        durationToAirport,
        distanceFromAirport,
        durationFromAirport,
        price,
        alternativePhone,
        flightNr,
        luggage
    } = context;
    const sqlstring = "INSERT INTO bookings (phone_number, date, time, passengers, status, extra_info, distance_to_airport, duration_to_airport, distance_from_airport, duration_from_airport, address, selected_option, language, customer_name, price, alternative_phone_number, flight_nr, luggage) VALUES($1, $2, $3, $4, 'pending', $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)";
    await client.query(sqlstring, [phoneNumber, context.date, context.time, context.passengers, context.info, context.distanceToAirport, context.durationToAirport, context.distanceFromAirport, context.durationFromAirport, context.address, context.selectedOption, context.language, context.name, context.price, context.alternativePhone, context.flightNr, context.luggage]);
    let booking = await getBookingByPhoneNumber(phoneNumber);
    await sendBookingToAdmin(booking);
    client.release();
    return JSON.stringify(booking.booking_reference) // Return the booking reference of the newly created booking
}

/**
 * Updates a booking record in the database.
 * @param {string} phoneNumber - The user's phone number.
 * @param {Object} context - The conversation context containing selected language, address, booking details, ...
 * @param {Object} bookingRef - The conversation booking reference
 */
async function updateBooking(phoneNumber, context, bookingRef) {
    const pool = getPool();
    const client = await pool.connect();
    const {
        language,
        selectedOption,
        address,
        date,
        time,
        passengers,
        name,
        info,
        distanceToAirport,
        durationToAirport,
        distanceFromAirport,
        durationFromAirport,
        price,
        alternativePhone,
        flightNr,
        luggage
    } = context;
    const sqlstring = "UPDATE bookings SET phone_number = $1, date = $2, time = $3, passengers = $4, extra_info = $5, distance_to_airport = $6, duration_to_airport = $7, distance_from_airport = $8, duration_from_airport = $9, address = $10, selected_option = $12, language = $13, customer_name = $14, price = $15, status = 'pending', alternative_phone_number = $16, flight_nr = $17, luggage = $18 where booking_reference = $11";
    await client.query(sqlstring, [phoneNumber, context.date, context.time, context.passengers, context.info, context.distanceToAirport, context.durationToAirport, context.distanceFromAirport, context.durationFromAirport, context.address, bookingRef, context.selectedOption, context.language, context.name, context.price, context.alternativePhone, context.flightNr, context.luggage]);
    let booking = await getBookingByBookingReference(bookingRef);
    await sendUpdatedBookingToAdmin(booking);
    client.release();
}

/**
 * Updates the status of a booking.
 @param {string} bookingRef - The booking reference.
 */
async function cancelBooking(bookingRef) {
    const pool = getPool();
    const client = await pool.connect();
    const sqlstring = "UPDATE bookings SET status = 'cancelled' WHERE booking_reference = $1";
    await client.query(sqlstring, [bookingRef]);
    let booking = await getBookingByBookingReference(bookingRef);
    await sendCanceledBookingToAdmin(booking);
    client.release();
}


/**
 * Updates a booking record in the database.
 * @param {string} phoneNumber - The user's phone number.
 * @param {string} message - The text message received.
 * @param {string} conversation - The conversation received.
 */
async function updateInfoForBooking(phoneNumber, message, conversation) {
    const pool = getPool();
    const client = await pool.connect();
    const booking = await getBookingByBookingReference(conversation.booking_reference);
    if (booking.extra_info === null) {
        const sqlstring = "update bookings set extra_info = $1 where booking_reference = $2";
        await client.query(sqlstring, [message, conversation.booking_reference]);
    }
    else {
        const sqlstring = "update bookings set extra_info = (extra_info || '; ' || $1) where booking_reference = $2";
        await client.query(sqlstring, [message, conversation.booking_reference]);
    }
    const updatedBooking = await getBookingByBookingReference(conversation.booking_reference);
    await sendUpdatedBookingToAdmin(updatedBooking);
    client.release();
}


// /**
//  * Updates the payment status and M-Pesa transaction ID for a booking.
//  * This function would typically be called by the M-Pesa callback endpoint
//  * once payment confirmation is received.
//  * @param {number} bookingId - The ID of the booking to update.
//  * @param {string} status - The new status (e.g., 'paid', 'failed', 'cancelled').
//  * @param {string|null} mpesaTransactionId - The M-Pesa transaction ID, or null if not applicable.
//  */
// async function updateBookingPaymentStatus(bookingId, status, mpesaTransactionId) {
//     const pool = getPool();
//     await pool.execute(
//         'UPDATE bookings SET status = ?, mpesa_transaction_id = ?, updated_at = NOW() WHERE id = ?',
//         [status, mpesaTransactionId, bookingId]
//     );
// }


/**
 * Retrieves a booking record from the database by phone number.
 * @returns {Object|null} The booking object if found, otherwise null.
 */
async function getBookingsAdmin() {
    const pool = getPool(); // Get the active database pool
    const client = await pool.connect();
    const sqlstring = "SELECT * FROM bookings WHERE status = 'pending' order by id desc";
    const {rows} = await client.query(sqlstring);
    client.release();
    return rows || null; // Returns all rows or null if no record found
}


/**
 * Retrieves booking records from the database for today (and tomorrow).
 * @returns {Object|null} The booking object if found, otherwise null.
 */
async function getBookingsToday() {
    const pool = getPool(); // Get the active database pool
    const today = new Date();
    let dateStringToday = today.getFullYear() + "/" + (today.getMonth() + 1).toLocaleString('en-US', {
        minimumIntegerDigits: 2, useGrouping: false
    }) + "/" + today.getDate();
    let dateStringTomorrow = today.getFullYear() + "/" + (today.getMonth() + 1).toLocaleString('en-US', {
        minimumIntegerDigits: 2, useGrouping: false
    }) + "/" + (today.getDate() + 1);
    const client = await pool.connect();
    const sqlstring = "SELECT * FROM bookings WHERE date in ($1, $2) and status = 'confirmed' order by id desc";
    const {rows} = await client.query(sqlstring, [dateStringToday, dateStringTomorrow]);
    client.release();
    return rows || null; // Returns all rows or null if no record found
}


/**
 * Retrieves booking records from the database for today (and tomorrow).
 * @returns {Object|null} The booking object if found, otherwise null.
 */
async function getBookingsFuture() {
    const pool = getPool(); // Get the active database pool
    const today = new Date();
    let dateStringTomorrow = today.getFullYear() + "/" + (today.getMonth() + 1).toLocaleString('en-US', {
        minimumIntegerDigits: 2, useGrouping: false
    }) + "/" + (today.getDate() + 1);
    const client = await pool.connect();
    const sqlstring = "SELECT * FROM bookings WHERE date > $1 and status = 'confirmed' order by id desc";
    const {rows} = await client.query(sqlstring, [dateStringTomorrow]);
    client.release();
    return rows || null; // Returns all rows or null if no record found
}

/**
 * Retrieves a booking record from the database by phone number.
 * @returns {Object|null} The booking object if found, otherwise null.
 */
async function getAllBookingsAdmin() {
    const pool = getPool(); // Get the active database pool
    const client = await pool.connect();
    const sqlstring = "SELECT * FROM bookings order by id desc";
    const {rows} = await client.query(sqlstring);
    client.release();
    return rows || null; // Returns all rows or null if no record found
}


/**
 * Updates a booking (and conversation) record in the database.
 * @param {string} bookingRef - The booking reference.
 * @param {string} bookingPhoneNumber - The booking user's phone number.
 * @param {string} adminPhoneNumber - The booking user's phone number.
 * @param {string} language - The booking user's language.
 */
async function confirmBooking(bookingRef, bookingPhoneNumber, adminPhoneNumber, language) {
    const pool = getPool();
    const client = await pool.connect();
    const sqlstring = "update bookings set status = 'confirmed' where booking_reference = $1";
    await client.query(sqlstring, [bookingRef]);
    const sqlstring2 = "update conversations set current_state = 'completed' where booking_reference = $1";
    await client.query(sqlstring2, [bookingRef]);
    client.release();
    if (language === 'english') {
        const confirmationMessageEnglish = `Your booking ${bookingRef} has been confirmed. Thank you for your reservation.`;
        await whatsappService.sendMessage(bookingPhoneNumber, confirmationMessageEnglish);
    } else if (language === 'french') {
        const confirmationMessageFrench = `Votre réservation ${bookingRef} a été confirmée. Merci pour cette réservation.`;
        await whatsappService.sendMessage(bookingPhoneNumber, confirmationMessageFrench);
    } else if (language === 'dutch') {
        const confirmationMessageDutch = `Uw boeking ${bookingRef} werd bevestigd. Bedankt voor deze reservatie.`;
        await whatsappService.sendMessage(bookingPhoneNumber, confirmationMessageDutch);
    }
    await whatsappService.sendMessage(adminPhoneNumber, messageTexts.adminBookingConfirmedMessage)
}

/**
 * Updates a booking (and conversation) record in the database.
 * @param {string} bookingRef - The booking reference.
 * @param {string} adminPhoneNumber - The booking user's phone number.
 */
async function confirmBookingSilent(bookingRef, adminPhoneNumber) {
    const pool = getPool();
    const client = await pool.connect();
    const sqlstring = "update bookings set status = 'confirmed' where booking_reference = $1";
    await client.query(sqlstring, [bookingRef]);
    const sqlstring2 = "update conversations set current_state = 'completed' where booking_reference = $1";
    await client.query(sqlstring2, [bookingRef]);
    client.release();
    await whatsappService.sendMessage(adminPhoneNumber, messageTexts.adminBookingConfirmedSilentMessage)
}


/**
 * Deletes a booking record in the database.
 * @param {string} bookingRef - The booking reference.
 * @param {string} adminPhoneNumber - The booking user's phone number.
 */
async function deleteBooking(bookingRef, adminPhoneNumber) {
    const pool = getPool();
    const client = await pool.connect();
    const sqlstring = "delete from bookings where booking_reference = $1";
    await client.query(sqlstring, [bookingRef]);
    client.release();
    await whatsappService.sendMessage(adminPhoneNumber, messageTexts.adminBookingDeletedMessage)
}


module.exports = {
    getBookingByPhoneNumber,
    getBookingByBookingReference,
    createBooking,
    updateBooking,
    cancelBooking,
    updateInfoForBooking,
    getBookingsAdmin,
    getAllBookingsAdmin,
    confirmBooking,
    confirmBookingSilent,
    deleteBooking,
    getBookingsToday,
    getBookingsFuture
    // ,
    // updateBookingPaymentStatus
};
