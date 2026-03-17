const Question = require('../models/Question');

const getQuestions = async (req, res) => {
  try {
    const questions = await Question.find({});
    res.json({ success: true, data: questions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getQuestionsByCategory = async (req, res) => {
  try {
    const catSearch = req.params.category.replace(/-/g, ' ');
    const regex = new RegExp(`^${catSearch}$`, 'i');
    const questions = await Question.find({ category: regex });
    res.json({ success: true, data: questions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createQuestion = async (req, res) => {
  try {
    const question = await Question.create(req.body);
    res.status(201).json({ success: true, data: question });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateQuestion = async (req, res) => {
  try {
    const question = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: question });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteQuestion = async (req, res) => {
  try {
    await Question.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Question removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getQuestions, getQuestionsByCategory, createQuestion, updateQuestion, deleteQuestion };
