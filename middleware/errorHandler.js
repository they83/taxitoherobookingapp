// middleware/errorHandler.js - Centralized Error Handling Middleware

/**
 * Custom Error Class for Operational Errors.
 * Use this for errors that are expected and handled gracefully,
 * like invalid input, resource not found, etc.
 */
class AppError extends Error {
    constructor(message, statusCode) {
        super(message); // Call the parent Error constructor
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true; // Mark as an operational error
        Error.captureStackTrace(this, this.constructor); // Capture stack trace
    }
}

/**
 * Global Error Handling Middleware for Express.
 * This middleware should be placed at the very end of your middleware stack
 * in `index.js`, after all other routes and middleware.
 *
 * It catches errors thrown by asynchronous functions (if using express-async-handler or similar)
 * or synchronous errors.
 *
 * @param {Error} err - The error object caught.
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The next middleware function (required for Express error handlers).
 */
const errorHandler = (err, req, res, next) => {
    // Set default status code and message
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Log the error (full stack trace in development, less verbose in production)
    if (process.env.NODE_ENV === 'development') {
        console.error('--- DEVELOPMENT ERROR ---');
        console.error(err); // Log full error object in dev
    } else {
        // In production, log only critical details or use a dedicated error logging service
        console.error('--- PRODUCTION ERROR ---');
        console.error(`Error: ${err.message}, Status: ${err.statusCode}, Operational: ${err.isOperational}`);
    }

    // Send different error responses based on environment
    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res);
    } else if (process.env.NODE_ENV === 'production') {
        sendErrorProd(err, res);
    }
};

/**
 * Sends detailed error response for development environment.
 * @param {Error} err - The error object.
 * @param {Object} res - The Express response object.
 */
const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack // Include stack trace in development
    });
};

/**
 * Sends concise error response for production environment.
 * Distinguishes between operational and programming errors.
 * @param {Error} err - The error object.
 * @param {Object} res - The Express response object.
 */
const sendErrorProd = (err, res) => {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });
    } else {
        // Programming or other unknown error: don't leak error details
        // Log the error (already done above)
        // Send a generic message
        res.status(500).json({
            status: 'error',
            message: 'Something went very wrong!'
        });
    }
};

// --- Specific Error Handling Examples (can be extended) ---

/**
 * Handles CastError (e.g., invalid MongoDB/Mongoose ID, or invalid type conversion).
 * Converts it into an operational AppError.
 * @param {Error} err - The CastError object.
 * @returns {AppError} A new AppError instance.
 */
const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}.`;
    return new AppError(message, 400); // 400 Bad Request
};

/**
 * Handles Duplicate field value errors (e.g., unique constraint violation in DB).
 * Converts it into an operational AppError.
 * @param {Error} err - The error object (e.g., from MySQL unique constraint).
 * @returns {AppError} A new AppError instance.
 */
const handleDuplicateFieldsDB = err => {
    // This example assumes a MySQL error structure where the duplicate value is in the message
    // You might need to parse `err.sqlMessage` or `err.code` for specific DB errors.
    const value = err.message.match(/(["'])(\\?.)*?\1/); // Basic regex to extract quoted value
    const message = `Duplicate field value: ${value}. Please use another value!`;
    return new AppError(message, 400); // 400 Bad Request
};

/**
 * Handles Validation errors (e.g., from Mongoose, Joi, or custom validation).
 * Converts it into an operational AppError.
 * @param {Error} err - The validation error object.
 * @returns {AppError} A new AppError instance.
 */
const handleValidationErrorDB = err => {
    // This example assumes a structure where errors are in `err.errors`
    // For Express-validator, it might be `err.array()`
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message, 400); // 400 Bad Request
};

/**
 * Handles JSON Web Token errors (e.g., invalid token, expired token).
 * Converts it into an operational AppError.
 * @returns {AppError} A new AppError instance.
 */
const handleJWTError = () => new AppError('Invalid token. Please log in again!', 401); // 401 Unauthorized

const handleJWTExpiredError = () => new AppError('Your token has expired! Please log in again.', 401); // 401 Unauthorized

// --- Export the errorHandler middleware ---
module.exports = errorHandler;
module.exports.AppError = AppError; // Also export AppError for custom error throwing in your code
