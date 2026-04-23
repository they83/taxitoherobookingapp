// Database Operations for Conversation States
const { getPool } = require('../config/db');
const {priceInsert} = require("../config/prices"); // Get the initialized postgresSQL connection pool

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
// TODO: adapt to correct number when all records are imported to the prices table (currently 800)
// TODO: below 30 km has no price, but is not above 800km
// TODO: also adapt all 9 usages in botcontroller with a better text

    if (distanceToUse < 801 || distanceToUse > 29) {
        const sqlstring = "select price from prices where distance = $1";
        let {rows} = await client.query(sqlstring, [distanceToUse]);
        client.release();
        return rows[0].price || null;
    } else {
        return null;
    }
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

/**
 * Gets all prices from the db.
 * @returns {Object|null} The price if found, otherwise null.
 */
async function deleteAllPrices() {
    const pool = getPool();
    const client = await pool.connect();
    const sqlstring = "truncate table prices";
    let {rows} = await client.query(sqlstring);
    client.release();
    return rows || null;
}

/**
 * Gets all prices from the db.
 * @returns {Object|null} The price if found, otherwise null.
 */
async function addPrices() {
    const pool = getPool();
    const client = await pool.connect();
    let {rows} = await client.query(priceInsert);
    client.release();
    return rows || null;
}

module.exports = {
    getPrice,
    getAllPrices,
    deleteAllPrices,
    addPrices
};