const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, userController.getUser);

module.exports = router;
