// routes/jobs.js
const express = require('express');
const router = express.Router();
const Job = require('../models/Job');

router.get('/', async (req, res) => {
  try {
    const defaultJobs = await Job.find({ isDefault: true });
    const adminJobs = await Job.find({ isDefault: false });
    const jobs = [...defaultJobs, ...adminJobs];
    res.render('jobs', { jobs });
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
});

// Apply for a job (redirect to login if not authenticated)
router.get('/apply/:id', (req, res) => {
  if (!req.session.user) return res.redirect('/auth/login');
  // Additional application logic here
  res.redirect('/dashboard');
});

module.exports = router;
