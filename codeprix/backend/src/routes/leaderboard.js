const express = require('express');
const router = express.Router();
const { leaderboard } = require('../data');

// GET /api/leaderboard — sorted standings
router.get('/', (req, res) => {
  res.json({ success: true, data: leaderboard });
});

module.exports = router;
