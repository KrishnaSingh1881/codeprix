const express = require('express');
const router = express.Router();
const { getPages, getPageByName, createPage, updatePage, deletePage } = require('../controllers/pageController');

router.route('/').get(getPages).post(createPage);
router.route('/:pageName').get(getPageByName).put(updatePage).delete(deletePage);

module.exports = router;
