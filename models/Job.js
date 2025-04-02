// models/Job.js
const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  companyImage: { type: String }, // URL for company logo
  jobType: { type: String, required: true },
  position: { type: String, required: true },
  salary: { type: Number, required: true },
  location: { type: String, required: true },
  isDefault: { type: Boolean, default: false }
});

module.exports = mongoose.model('Job', JobSchema);
