const {getPool} = require('../config/db'); // Import the database pool

/**
 * Handles the request to test the PostgreSQL database connection.
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 */
const testDbConnection = async (req, res) => {
    try {
        // Acquire a client from the connection pool
        const pool = getPool(); // Get the active database pool
        const client = await pool.connect();

        // Execute a simple query to test the connection and fetch the current database time
        const result = await client.query('SELECT NOW() as current_time');

        // Release the client back to the pool
        client.release();

        // Send a success response with the query result
        res.status(200).json({
            message: 'Successfully connected to PostgreSQL and executed a query!',
            currentTime: result.rows[0].current_time,
        });
    } catch (err) {
        // Handle any errors that occur during the database operation
        console.error('Database connection or query error:', err.message);
        res.status(500).json({
            message: 'Failed to connect to PostgreSQL or execute query.',
            error: err.message,
        });
    }
};

module.exports = {
    testDbConnection,
};