const express = require('express');
const router = express.Router();
const { questions } = require('../data');

// GET /api/questions — all questions
router.get('/', (req, res) => {
  res.json({ success: true, data: questions });
});

// GET /api/questions/:category — filtered by category
router.get('/:category', (req, res) => {
  const cat = req.params.category.toLowerCase().replace(/-/g, ' ');
  const filtered = questions.filter(
    (q) => q.category.toLowerCase() === cat
  );
  res.json({ success: true, data: filtered });
});

module.exports = router;
