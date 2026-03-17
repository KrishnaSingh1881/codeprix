const express = require('express');
const router = express.Router();
const { getUsers, registerUser, loginUser } = require('../controllers/userController');

router.route('/').get(getUsers);
router.route('/register').post(registerUser);
router.route('/login').post(loginUser);

module.exports = router;
