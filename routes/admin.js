// routes/admin.js
const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Middleware to check for admin access
function isAdmin(req, res, next) {
  if (req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  res.redirect('/auth/login');
}

// Admin Dashboard Route - returns live statistics
// In the admin dashboard route
router.get('/', isAdmin, async (req, res) => {
  try {
    const [totalJobs, totalUsers] = await Promise.all([
      Job.countDocuments(),
      User.countDocuments()
    ]);
    
    res.render('admin_dashboard', {
      user: req.session.user,
      totalJobs,
      totalUsers,
      trafficToday: 1500, // Replace with actual data
      activeUsers: 45     // Replace with actual data
    });
  } catch (err) {
    console.error(err);
    res.render('admin_dashboard', {
      user: req.session.user,
      totalJobs: 0,
      totalUsers: 0,
      trafficToday: 0,
      activeUsers: 0
    });
  }
});
// Travel Links Management
router.get('/travel-links', isAdmin, async (req, res) => {
  try {
    const travelLinks = await TravelLink.find();
    res.render('admin_travel_links', { 
      user: req.session.user,
      travelLinks,
      defaultLink: 'bit.ly/uk49wins'
    });
  } catch (err) {
    console.error(err);
    res.redirect('/admin');
  }
});

router.post('/travel-links/add', isAdmin, async (req, res) => {
  try {
    const { title, url, icon } = req.body;
    const newLink = new TravelLink({ 
      title,
      url: url || 'bit.ly/uk49wins',
      icon: icon || 'fas fa-question'
    });
    await newLink.save();
    res.redirect('/admin/travel-links');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/travel-links');
  }
});

router.post('/travel-links/edit/:id', isAdmin, async (req, res) => {
  try {
    const { title, url, icon } = req.body;
    await TravelLink.findByIdAndUpdate(req.params.id, {
      title,
      url: url || 'bit.ly/uk49wins',
      icon: icon || 'fas fa-question'
    });
    res.redirect('/admin/travel-links');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/travel-links');
  }
});

router.post('/travel-links/delete/:id', isAdmin, async (req, res) => {
  try {
    await TravelLink.findByIdAndDelete(req.params.id);
    res.redirect('/admin/travel-links');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/travel-links');
  }
});

// ----- Job Management Routes -----

// List all jobs
router.get('/jobs', isAdmin, async (req, res) => {
  try {
    const jobs = await Job.find();
    res.render('admin_jobs', { jobs });
  } catch (err) {
    console.error(err);
    res.redirect('/admin');
  }
});

// Render add job form
router.get('/jobs/add', isAdmin, (req, res) => {
  res.render('admin_add_job');
});

// Process add job form
router.post('/jobs/add', isAdmin, async (req, res) => {
  try {
    const { companyName, companyImage, jobType, position, salary, location } = req.body;
    const newJob = new Job({
      companyName,
      companyImage,
      jobType,
      position,
      salary,
      location,
      isDefault: false
    });
    await newJob.save();
    res.redirect('/admin/jobs');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/jobs');
  }
});

// Render edit job form
router.get('/jobs/edit/:id', isAdmin, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    res.render('admin_edit_job', { job });
  } catch (err) {
    console.error(err);
    res.redirect('/admin/jobs');
  }
});

// Process edit job form
router.post('/jobs/edit/:id', isAdmin, async (req, res) => {
  try {
    const { companyName, companyImage, jobType, position, salary, location } = req.body;
    await Job.findByIdAndUpdate(req.params.id, {
      companyName,
      companyImage,
      jobType,
      position,
      salary,
      location
    });
    res.redirect('/admin/jobs');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/jobs');
  }
});

// Delete job
router.get('/jobs/delete/:id', isAdmin, async (req, res) => {
  try {
    await Job.findByIdAndDelete(req.params.id);
    res.redirect('/admin/jobs');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/jobs');
  }
});

// ----- User Management Routes -----

// List all users
router.get('/users', isAdmin, async (req, res) => {
  try {
    const users = await User.find();
    res.render('admin_users', { users });
  } catch (err) {
    console.error(err);
    res.redirect('/admin');
  }
});

// Render add user form
router.get('/users/add', isAdmin, (req, res) => {
  res.render('admin_add_user');
});

// Process add user form
router.post('/users/add', isAdmin, async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    const hash = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hash, role });
    await newUser.save();
    res.redirect('/admin/users');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/users');
  }
});

// Render edit user form
router.get('/users/edit/:id', isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    res.render('admin_edit_user', { user });
  } catch (err) {
    console.error(err);
    res.redirect('/admin/users');
  }
});

// Process edit user form
router.post('/users/edit/:id', isAdmin, async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    let updateData = { username, email, role };
    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 10);
    }
    await User.findByIdAndUpdate(req.params.id, updateData);
    res.redirect('/admin/users');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/users');
  }
});

// Delete user
router.get('/users/delete/:id', isAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.redirect('/admin/users');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/users');
  }
});

// ----- Settings Management Routes -----

// Render settings page
router.get('/settings', isAdmin, (req, res) => {
  // Dummy settings; replace with a real store if needed
  res.render('admin_settings', { settings: { timezone: 'UTC', language: 'en', currency: 'USD', theme: 'default' } });
});

// Process settings update
router.post('/settings', isAdmin, (req, res) => {
  console.log('Updated settings:', req.body);
  res.redirect('/admin/settings');
});

// ----- Analytics Route (Placeholder) -----

router.get('/analytics', isAdmin, (req, res) => {
  const analytics = {
    traffic: '1500 visits/day',
    conversions: '5%',
    userBehavior: 'Average session: 3 mins'
  };
  res.render('admin_analytics', { analytics });
});

module.exports = router;
