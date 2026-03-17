const express = require('express');
const router = express.Router();
const { getQuestions, getQuestionsByCategory, createQuestion, updateQuestion, deleteQuestion } = require('../controllers/questionController');

router.route('/')
  .get(getQuestions)
  .post(createQuestion);

router.route('/cat/:category')
  .get(getQuestionsByCategory);

router.route('/:id')
  .put(updateQuestion)
  .delete(deleteQuestion);

module.exports = router;
