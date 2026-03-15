const express = require('express');
const router = express.Router();
const { teams } = require('../data');

// GET /api/teams — all teams
router.get('/', (req, res) => {
  res.json({ success: true, data: teams });
});

module.exports = router;
