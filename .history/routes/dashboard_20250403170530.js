// routes/dashboard.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const Application = require('../models/Application');
const TravelLink = require('../models/TravelLink');
const nodemailer = require('nodemailer');

// Multer configuration (keep original file upload setup)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('Only images allowed!'))
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

// Enhanced auth middleware
const requireUserAuth = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'user') {
    req.flash('error', 'Please login to access dashboard');
    return res.redirect('/auth/login');
  }
  next();
};

// Dashboard route with proper error handling
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
      applicationStatus: [] // Maintain this for template compatibility
    });

  } catch (err) {
    console.error('Dashboard error:', err);
    req.flash('error', 'Error loading dashboard');
    res.redirect('/auth/login');
  }
});

// Keep all other routes from your original code with improved error handling
// ... [rest of your original routes] ...