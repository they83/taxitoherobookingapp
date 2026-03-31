const express = require('express');
const router = express.Router(); 

// Routes for WhatsApp webhook
const webhookRoutes = require('./webhook')

// Mount the specific routers to their base paths.
// For example, all routes defined in webhookRoutes will be prefixed with '/webhook'.
router.use('/webhook', webhookRoutes);

// TODO
// You would add more route modules here as your application grows, e.g.:
// const adminRoutes = require('./admin');
// router.use('/admin', adminRoutes);

// Routes for testing purposes
// TODO: Move this to tests folder
const testRoutes = require('./test'); 

router.use('/test', testRoutes);

module.exports = router; 
