const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const Application = require('../models/Application');
const TravelLink = require('../models/TravelLink');
const nodemailer = require('nodemailer');

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

// Configure multer with proper error handling
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Email transporter configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Enhanced authentication middleware
const requireUserAuth = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'user') {
    return res.redirect('/auth/login');
  }
  next();
};

// Dashboard main route
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

// Edit Profile - GET with proper error handling
router.get('/edit', requireUserAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id).lean();
    
    if (!user) {
      req.session.destroy();
      return res.redirect('/auth/login');
    }

    res.render('edit-profile', {
      user: {
        ...user,
        degrees: user.degrees ? user.degrees.join(', ') : '',
        languages: user.languages ? user.languages.join(', ') : ''
      }
    });
  } catch (err) {
    console.error('Edit profile error:', err);
    res.redirect('/dashboard');
  }
});

// Update Profile - POST with enhanced error handling
router.post('/edit', 
  requireUserAuth,
  (req, res, next) => {
    upload.single('profilePicture')(req, res, (err) => {
      if (err) {
        console.error('File upload error:', err);
        req.flash('error', err.message);
        return res.redirect('/dashboard/edit');
      }
      next();
    });
  },
  async (req, res) => {
    try {
      const updates = {
        fullName: req.body.fullName || '',
        country: req.body.country || '',
        address: req.body.address || '',
        sex: req.body.sex || '',
        age: req.body.age ? parseInt(req.body.age) : null,
        phoneNumber: req.body.phoneNumber || '',
        whatsappNumber: req.body.whatsappNumber || '',
        gmail: req.body.gmail || '',
        degrees: req.body.degrees ? 
          req.body.degrees.split(',').map(d => d.trim()).filter(d => d) : [],
        languages: req.body.languages ? 
          req.body.languages.split(',').map(l => l.trim()).filter(l => l) : []
      };

      if (req.file) {
        updates.profilePicture = `/uploads/${req.file.filename}`;
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.session.user._id,
        updates,
        { new: true, runValidators: true }
      );

      if (!updatedUser) {
        req.session.destroy();
        return res.redirect('/auth/login');
      }

      req.session.user = updatedUser.toObject();
      res.redirect('/dashboard');
    } catch (err) {
      console.error('Profile update error:', err);
      req.flash('error', 'Failed to update profile. Please check your inputs.');
      res.redirect('/dashboard/edit');
    }
  }
);

// Prepare Travel Documents route
router.get('/prepare-travel-docs', requireUserAuth, async (req, res) => {
  try {
    const travelDocs = await TravelLink.find().lean();
    res.render('prepare-travel-docs', { travelDocs });
  } catch (err) {
    console.error('Travel docs error:', err);
    res.redirect('/dashboard');
  }
});

// Application History route
router.get('/applications/history', requireUserAuth, async (req, res) => {
  try {
    const applications = await Application.find({ user: req.session.user._id })
      .sort('-appliedDate')
      .lean();

    res.render('applications-history', {
      applications: applications.map(app => ({
        ...app,
        appliedDate: new Date(app.appliedDate)
      }))
    });
  } catch (err) {
    console.error('Applications history error:', err);
    res.redirect('/dashboard');
  }
});

// Job Application routes
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

router.post('/apply-job/:jobId', requireUserAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);
    const jobId = req.params.jobId;

    const newApplication = new Application({
      user: user._id,
      jobId,
      jobTitle: `Job ${jobId}`,
      company: "Hiring Company",
      status: "Pending",
      appliedDate: new Date()
    });
    await newApplication.save();

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

    res.redirect(`/dashboard/apply-job/${jobId}?success=true`);
  } catch (err) {
    console.error('Application error:', err);
    res.redirect(`/dashboard/apply-job/${jobId}?success=false`);
  }
});

module.exports = router;