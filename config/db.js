const { Pool } = require('pg'); 
const config = require('./vars'); // Import application configuration

let pool; // Declare the connection pool globally within this module

/**
 * Asynchronously initializes and connects to the PostgreSQL database pool.
 * Performs an initial connection test to ensure connectivity.
 * @returns {Pool} The initialized PostgreSQL connection pool.
 * @throws {Error} If the database connection fails.
 */
async function connectDB() {
    if (pool) {
        // If pool already exists, return it to prevent re-initialization
        return pool;
    }

    pool = new Pool({
        user: config.DB_USER,
        host: config.DB_HOST,
        database: config.DB_NAME,
        password: config.DB_PASS,
        port: config.DB_PORT,
        connectionTimeoutMillis: 5000, // 5 seconds connection timeout
    });

    // Event listener for successful database connection
    pool.on('connect', () => {
        console.log('Successfully connected to PostgreSQL database!');
    });

    // Event listener for database errors
    pool.on('error', (err) => {
        console.error('Unexpected error on idle client:', err);
        // For a critical error like this, exiting might be appropriate.
        process.exit(1);
    });

    try {
        // Test the connection by acquiring and releasing a client
        const client = await pool.connect();
        client.release(); // Release the client immediately after testing
        console.log('PostgreSQL database connection tested successfully!');
        return pool; // Return the initialized pool
    } catch (err) {
        console.error('Failed to connect to PostgreSQL database:', err.message);
        // Rethrow the error to be caught by the calling function (e.g., in index.js)
        throw err;
    }
}

/**
 * Returns the initialized postgresSQL connection pool.
 * This function should only be called after `connectDB()` has successfully completed.
 * @returns {pg.Pool} The postgreSQL connection pool.
 * @throws {Error} If the database pool has not been initialized yet.
 */
function getPool() {
    if (!pool) {
        throw new Error('Database pool has not been initialized. Call connectDB() first.');
    }
    return pool;
}

// Export the async function to initialize the database and a helper to get the pool
module.exports = {
    connectDB,
    getPool
};