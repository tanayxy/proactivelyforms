const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const formRoutes = require('./forms');

router.use('/auth', authRoutes);
router.use('/forms', formRoutes);

module.exports = router; 