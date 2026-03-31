const express = require('express');
const router = express.Router(); 
const testController = require('../controllers/testController'); 

// Define the route for testing the database connection
// When a GET request comes to '/test-db-connection', it will call testController.testDbConnection
router.get('/test-db-connection', testController.testDbConnection);

module.exports = router; 