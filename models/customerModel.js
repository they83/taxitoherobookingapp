const {getPool} = require('../config/db');
const whatsappService = require("../services/whatsappService");
const {messageTexts} = require("../config/messageTexts");
const {sendCustomerToAdmin} = require("../services/nodemailer");


/**
 * Retrieves customers from the database.
 * @returns {Object|null} The customer object if found, otherwise null.
 */
async function getCustomers() {
    const pool = getPool(); // Get the active database pool
    const client = await pool.connect();
    const sqlstring = "SELECT * FROM customers";
    const {rows} = await client.query(sqlstring);
    client.release();
    return rows || null;
}

/**
 * Retrieves customers from the database via the phone number.
 * @param {string} phoneNumber - The phonenumber for the client's conversation.
 * @returns {Object|null} The customer object if found, otherwise null.
 */
async function getCustomerByPhone(phoneNumber) {
    const pool = getPool(); // Get the active database pool
    const client = await pool.connect();
    const sqlstring = "SELECT * FROM customers where phone_number = $1";
    const {rows} = await client.query(sqlstring, [phoneNumber]);
    client.release();
    return rows[0] || null;
}

/**
 * Retrieves customers from the database via the ID.
 * @param {string} id - The id for the customer record.
 * @returns {Object|null} The customer object if found, otherwise null.
 */
async function getCustomerById(id) {
    const pool = getPool(); // Get the active database pool
    const client = await pool.connect();
    const sqlstring = "SELECT * FROM customers where phone_number = $1";
    const {rows} = await client.query(sqlstring, [phoneNumber]);
    client.release();
    return rows[0] || null;
}

/**
 * Adds a customer record to the database.
 * @param {Object} context - The context for the client's conversation.
 * @param {string} phoneNumber - The phonenumber for the client's conversation.
 * @returns {Object} The customer record from the database.
 */
async function addCustomer(context, phoneNumber) {
    const pool = getPool(); // Get the active database pool
    const client = await pool.connect();
    console.log(context);
    console.log(phoneNumber);
// context has alternative phone nr -> search customer via this nr
    if (context.alternative_phone_number === null) {
        let customer = await getCustomerByPhone(context.alternativePhone);
        // nothing found -> create new customer
        if (customer === null) {
            const sqlstring = "INSERT INTO customers (phone_number, language, name) VALUES($1, $2, $3)";
            const {row} = await client.query(sqlstring, [context.alternativePhone, context.language, context.name]);
            client.release();
            await sendCustomerToAdmin(row);
            return JSON.stringify(row) // Return the ID of the newly created customer
        } else {
            client.release();
            return JSON.stringify(customer) // Return the ID of the existing customer
        }
    } else {
// context has no alternative phone nr -> search customer via regular phone nr
        let customer = await getCustomerByPhone(phoneNumber);
        // nothing found -> create new customer
        if (customer === null) {
            const sqlstring = "INSERT INTO customers (phone_number, language, name) VALUES($1, $2, $3)";
            const {row} = await client.query(sqlstring, [phoneNumber, context.language, context.name]);
            client.release();
            await sendCustomerToAdmin(row);
            return JSON.stringify(row) // Return the ID of the newly created customer
        } else {
            client.release();
            return JSON.stringify(cus) // Return the ID of the existing customer
        }
    }
}

/**
 * Deletes a booking record in the database.
 * @param {string} id - The customer id.
 */
async function deleteCustomer(id) {
    const pool = getPool();
    const client = await pool.connect();
    const sqlstring = "delete from customers where id = $1";
    await client.query(sqlstring, [id]);
    client.release();
}


module.exports = {
    getCustomers,
    getCustomerById,
    getCustomerByPhone,
    addCustomer,
    deleteCustomer
};
