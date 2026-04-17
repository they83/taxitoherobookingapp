// Database Operations for Conversation States
const { getPool } = require('../config/db'); // Get the initialized postgresSQL connection pool
const { STATES } = require('../config/constants'); 

/**
 * Retrieves a conversation record from the database by phone number.
 * @param {string} phoneNumber - The user's phone number.
 * @returns {Object|null} The conversation object if found, otherwise null.
 */
async function getConversation(phoneNumber) {
    const pool = getPool(); // Get the active database pool
    const client = await pool.connect();
    const sqlstring = "SELECT * FROM conversations WHERE phone_number = $1 AND current_state not in ('completed', 'cs', 'chose_stop')";
    const {rows} = await client.query(sqlstring, [phoneNumber]);
    client.release();
    return rows[0] || null; // Return the first row or null if no record found
}

/**
 * Retrieves a conversation record from the database by ID.
 * @param {string} id - The conversation ID.
 * @returns {Object|null} The conversation object if found, otherwise null.
 */
async function getConversationById(id) {
    const pool = getPool(); // Get the active database pool
    const client = await pool.connect();
    const sqlstring = "SELECT * FROM conversations WHERE id = $1";
    const {rows} = await client.query(sqlstring, [id]);
    client.release();
    return rows[0] || null; // Return the first row or null if no record found
}

/**
 * Creates a new conversation record in the database for a given phone number.
 * Initializes the conversation with the WELCOME state and an empty context.
 * @param {string} phoneNumber - The user's phone number.
 * @returns {Object} The newly created conversation object.
 */
async function createConversation(phoneNumber) {
    const pool = getPool();
    const client = await pool.connect();
    const sqlstring = "INSERT INTO conversations (phone_number, current_state, context) VALUES ($1, $2, $3)";
    await client.query(sqlstring, [phoneNumber, STATES.START, {}]);
    client.release();
    return getConversation(phoneNumber);
}


/**
 * Creates a new conversation record in the database for a given phone number when a previous booking is found.
 * @param {string} phoneNumber - The user's phone number.
 * @param {string} context - The new context object for the conversation. This will be stringified to JSON.
 * @returns {Object} The newly created conversation object.
 */
async function createRebookingConversation(phoneNumber, context) {
    const pool = getPool();
    const client = await pool.connect();
    const sqlstring = "INSERT INTO conversations (phone_number, current_state, context) VALUES ($1, $2, $3)";
    await client.query(sqlstring, [phoneNumber, STATES.INCOMING_REBOOKING, context]);
    client.release();
    return getConversation(phoneNumber);
}


/**
 * Updates the state and context of an existing conversation.
 * Also updates the `last_activity` timestamp.
 * @param {string} phoneNumber - The user's phone number.
 * @param {string} state - The new state of the conversation (e.g., 'selecting_language').
 * @param {string} context - The new context object for the conversation. This will be stringified to JSON.
 */
async function updateConversationState(phoneNumber, state, context) {
    const pool = getPool();
    const client = await pool.connect();
    const sqlstring = "UPDATE conversations SET current_state = $1, context = $2, last_activity = NOW() WHERE phone_number = $3 and current_state not in ('completed', 'cs', 'chose_stop')";
    await client.query(sqlstring, [state, JSON.stringify(context), phoneNumber]);
    client.release();
}

/**
 * Updates the state and context of an existing conversation.
 * Also updates the `last_activity` timestamp.
 * @param {string} phoneNumber - The user's phone number.
 * @param {string} bookingRef - The booking reference.
 */
async function addBookingRefToConversation(phoneNumber, bookingRef) {
    const pool = getPool();
    const client = await pool.connect();
    const sqlstring = "UPDATE conversations SET booking_reference = $1 WHERE phone_number = $2 and current_state = 'pending'";
    await client.query(sqlstring, [bookingRef, phoneNumber]);
    client.release();
}

/**
 * Gets all conversations with context CS.
 * @returns {Object|null} The conversation object if found, otherwise null.
 */
async function getAllCS() {
    const pool = getPool();
    const client = await pool.connect();
    const sqlstring = "select * from conversations where current_state in ('cs')";
    const {rows} = await client.query(sqlstring);
    client.release();
    return rows || null; // Returns all rows or null if no record found
}


/**
 * Gets all incomplete conversations.
 * @returns {Object|null} The conversation object if found, otherwise null.
 */
async function getAllIncomplete() {
    const pool = getPool();
    const client = await pool.connect();
    const sqlstring = "select * from conversations where current_state not in ('pending', 'completed', 'cs')";
    const {rows} = await client.query(sqlstring);
    client.release();
    return rows || null; // Returns all rows or null if no record found
}

/**
 * Gets all conversations with context CS.
 * @returns {Object|null} The conversation object if found, otherwise null.
 */
async function getAllConversations() {
    const pool = getPool();
    const client = await pool.connect();
    const sqlstring = "select * from conversations";
    const {rows} = await client.query(sqlstring);
    client.release();
    return rows || null; // Returns all rows or null if no record found
}


/**
 * Updates a CS conversation in the database.
 * @param {string} id - The conversation ID.
 */
async function completeCsConversation(id) {
    const pool = getPool();
    const client = await pool.connect();
    const sqlstring = "update conversations set current_state = 'completed' where id = $1";
    await client.query(sqlstring, [id]);
    client.release();
}

/**
 * Deletes a CS conversation in the database.
 * @param {string} id - The conversation ID.
 */
async function deleteCsConversation(id) {
    const pool = getPool();
    const client = await pool.connect();
    const sqlstring = "delete from conversations where id = $1";
    await client.query(sqlstring, [id]);
    client.release();
}

/**
 * Calculates a price using the distance, the context (from or to) and a price mapping in the database.
 * @param {integer} toAirport - The distance to the airport.
 * @param {integer} fromAirport - The distance from the airport.
 * @param {string} option - Whether the client chose from or to the airport.
 * @returns {Object|null} The price if found, otherwise null.
 */
async function getPrice(toAirport, fromAirport, option) {
    const pool = getPool();
    const client = await pool.connect();
    let distanceToUse;
    if (option === 'From airport') {
        distanceToUse = Math.floor(fromAirport/1000);
        console.log('distanceToUse from airport: ', distanceToUse);
    } else if (option === 'To airport') {
        distanceToUse = Math.floor(toAirport/1000);
        console.log('distanceToUse to airport: ', distanceToUse);
    }
    const sqlstring = "select price from prices where distance = $1";
    let {rows} = await client.query(sqlstring, [distanceToUse]);
    console.log('rows[0]', rows[0]);
    console.log('rows', rows);
    console.log('price', rows[0].price);
    client.release();
    return rows[0].price || null;
}

/**
 * Gets all prices from the db.
 * @returns {Object|null} The price if found, otherwise null.
 */
async function getAllPrices() {
    const pool = getPool();
    const client = await pool.connect();
    const sqlstring = "select * from prices";
    let {rows} = await client.query(sqlstring);
    client.release();
    return rows || null;
}



module.exports = {
    getConversation,
    getConversationById,
    createConversation,
    createRebookingConversation,
    updateConversationState,
    addBookingRefToConversation,
    getAllCS,
    getAllIncomplete,
    getAllConversations,
    completeCsConversation,
    deleteCsConversation,
    getPrice,
    getAllPrices
};
