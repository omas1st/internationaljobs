const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const Application = require('../models/Application');
const TravelLink = require('../models/TravelLink');
const nodemailer = require('nodemailer');

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('Only images allowed!'));
  }
});

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Authentication middleware
const requireUserAuth = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'user') {
    return res.redirect('/auth/login');
  }
  next();
};

// Dashboard route
router.get('/', requireUserAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id).lean();
    const applications = await Application.find({ user: user._id })
      .sort('-appliedDate')
      .limit(5)
      .lean();
    const travelLinks = await TravelLink.find().lean();

    res.render('dashboard', {
      user: {
        ...user,
        createdAt: user.createdAt,
        degrees: user.degrees || [],
        languages: user.languages || []
      },
      applications: applications.map(app => ({
        ...app,
        appliedDate: new Date(app.appliedDate)
      })),
      travelLinks,
      applicationStatus: []
    });

  } catch (err) {
    console.error('Dashboard error:', err);
    res.redirect('/auth/login');
  }
});

// Edit Profile Page (Fixed)
router.get('/edit', requireUserAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id).lean();
    res.render('edit-profile', { 
      user: {
        ...user,
        degrees: user.degrees?.join(', ') || '',
        languages: user.languages?.join(', ') || ''
      }
    });
  } catch (err) {
    console.error('Edit profile error:', err);
    res.redirect('/dashboard');
  }
});

// Update Profile (Fixed)
router.post('/edit', requireUserAuth, upload.single('profilePicture'), async (req, res) => {
  try {
    const updates = {
      fullName: req.body.fullName,
      country: req.body.country,
      address: req.body.address,
      sex: req.body.sex,
      age: req.body.age,
      phoneNumber: req.body.phoneNumber,
      whatsappNumber: req.body.whatsappNumber,
      gmail: req.body.gmail,
      degrees: req.body.degrees?.split(',').map(d => d.trim()) || [],
      languages: req.body.languages?.split(',').map(l => l.trim()) || []
    };

    if (req.file) {
      updates.profilePicture = `/uploads/${req.file.filename}`;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.session.user._id,
      updates,
      { new: true, runValidators: true }
    );

    req.session.user = updatedUser.toObject();
    res.redirect('/dashboard');
  } catch (err) {
    console.error('Profile update error:', err);
    res.redirect('/dashboard/edit');
  }
});

// Restored Travel Documents Section
router.get('/prepare-travel-docs', requireUserAuth, (req, res) => {
  res.render('prepare-travel-docs');
});

// Application Page (Fixed)
router.get('/apply-job/:jobId', requireUserAuth, async (req, res) => {
  try {
    res.render('apply-job', { 
      jobId: req.params.jobId,
      message: req.query.success ? {
        type: 'success',
        text: 'Application submitted successfully! Our team will contact you via email/WhatsApp.'
      } : null
    });
  } catch (err) {
    console.error('Apply job error:', err);
    res.redirect('/dashboard');
  }
});

// Handle Application Submission (Fixed)
router.post('/apply-job/:jobId', requireUserAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);
    const jobId = req.params.jobId;

    // Create application record
    const newApplication = new Application({
      user: user._id,
      jobId,
      jobTitle: `Job ${jobId}`,
      company: "Hiring Company",
      status: "Pending",
      appliedDate: new Date()
    });
    await newApplication.save();

    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: 'omas7th@gmail.com',
      subject: `New Application from ${user.username}`,
      text: `Profile Details:
      Name: ${user.fullName}
      Email: ${user.email}
      WhatsApp: ${user.whatsappNumber}
      Profile: ${JSON.stringify(user, null, 2)}`
    });

    res.redirect(`/apply-job/${jobId}?success=true`);
  } catch (err) {
    console.error('Application error:', err);
    res.redirect(`/apply-job/${jobId}?success=false`);
  }
});

module.exports = router;