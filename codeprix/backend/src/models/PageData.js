const mongoose = require('mongoose');

const pageDataSchema = new mongoose.Schema({
  pageName: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  content: {
    type: Object,
    required: true
  },
  metadata: {
    title: String,
    description: String
  }
}, { timestamps: true });

module.exports = mongoose.model('PageData', pageDataSchema);
