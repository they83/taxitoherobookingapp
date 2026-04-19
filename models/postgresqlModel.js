const { getPool } = require('../config/db');
const {postgresStatement} = require("../config/postgresql");


/**
 * Run the SQL statement from .
 * @returns {Object|null}
 */
async function runSQL() {
    const pool = getPool();
    const client = await pool.connect();
    let {rows} = await client.query(postgresStatement);
    client.release();
    return rows || null;
}

module.exports = {
runSQL};