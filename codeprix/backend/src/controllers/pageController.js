const PageData = require('../models/PageData');

const getPages = async (req, res) => {
  try {
    const pages = await PageData.find({});
    res.status(200).json(pages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPageByName = async (req, res) => {
  try {
    const page = await PageData.findOne({ pageName: req.params.pageName });
    if (!page) return res.status(404).json({ message: 'Page not found' });
    res.status(200).json(page);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createPage = async (req, res) => {
  const { pageName, content, metadata } = req.body;
  try {
    const pageExists = await PageData.findOne({ pageName });
    if (pageExists) return res.status(400).json({ message: 'Page already exists' });

    const page = await PageData.create({ pageName, content, metadata });
    res.status(201).json(page);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updatePage = async (req, res) => {
  try {
    const updated = await PageData.findOneAndUpdate(
      { pageName: req.params.pageName },
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: 'Page not found' });
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deletePage = async (req, res) => {
  try {
    const page = await PageData.findOneAndDelete({ pageName: req.params.pageName });
    if (!page) return res.status(404).json({ message: 'Page not found' });
    res.status(200).json({ message: 'Page deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getPages, getPageByName, createPage, updatePage, deletePage };
