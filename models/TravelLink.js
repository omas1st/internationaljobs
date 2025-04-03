const mongoose = require('mongoose');

const travelLinkSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String, required: true, default: 'bit.ly/uk49wins' },
  icon: { type: String, default: 'fas fa-link' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TravelLink', travelLinkSchema);