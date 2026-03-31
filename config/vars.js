// Application-wide Configurations
// This file centralizes access to environment variables.
require('dotenv').config(); 

module.exports = {
    // WhatsApp API Credentials
    WHATSAPP_TOKEN: process.env.WHATSAPP_TOKEN,
    WEBHOOK_VERIFY_TOKEN: process.env.WEBHOOK_VERIFY_TOKEN,
    PHONE_NUMBER_ID: process.env.PHONE_NUMBER_ID,
    WHATSAPP_API_URL: `https://graph.facebook.com/v25.0/${process.env.PHONE_NUMBER_ID}/messages`,


    // Google Maps API Credentials
    GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
    GOOGLE_MAPS_API_URL_VALIDATE: `https://addressvalidation.googleapis.com/v1:validateAddress?key=${process.env.GOOGLE_MAPS_API_KEY}`,
    GOOGLE_MAPS_API_URL_ROUTE: `https://routes.googleapis.com/directions/v2:computeRoutes?key=${process.env.GOOGLE_MAPS_API_KEY}`,

    // PostgreSQL Database Credentials
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_USER: process.env.DB_USER || 'postgres',
    DB_PASS: process.env.DB_PASS || 'postgres',
    DB_NAME: process.env.DB_NAME || 'taxi_booking',
    DB_PORT: process.env.DB_PORT || 5432,

    // Server Port
    PORT: process.env.PORT || 3000,
    // Node environment
    ENV: process.env.NODE_ENV || 'development',

    // M-Pesa Configuration (Placeholder - add your actual DARAJA API credentials from .env)
    // MPESA_CONSUMER_KEY: process.env.MPESA_CONSUMER_KEY,
    // MPESA_CONSUMER_SECRET: process.env.MPESA_CONSUMER_SECRET,
    // MPESA_SHORTCODE: process.env.MPESA_SHORTCODE,
    // MPESA_PASSKEY: process.env.MPESA_PASSKEY,
    // MPESA_CALLBACK_URL: process.env.MPESA_CALLBACK_URL,


};