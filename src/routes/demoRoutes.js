const router = require('express').Router();
const { seedData, resetData } = require('../controllers/demoController');

// Open routes for demo purposes, or can protect with admin check
router.post('/seed-data', seedData);
router.post('/reset', resetData);

module.exports = router;
