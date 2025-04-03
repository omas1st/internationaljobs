const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    jobId: {
      type: String,
      required: true
    },
    jobTitle: {
      type: String,
      required: true
    },
    company: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['Applied', 'Pending', 'Declined'],
      default: 'Pending'
    },
    appliedDate: {
      type: Date,
      default: Date.now
    }
  });

module.exports = mongoose.model('Application', applicationSchema);