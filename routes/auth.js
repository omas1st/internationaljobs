const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Render login and register pages
router.get('/login', (req, res) => res.render('login'));
router.get('/register', (req, res) => res.render('register'));

// Registration
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.render('register', { 
        error: 'Username or email already exists' 
      });
    }

    // Create new user without manual hashing; the pre-save hook will hash the password
    const user = new User({ 
      username,
      email,
      password, // plain text password; will be hashed by the pre-save middleware
      role: email === process.env.ADMIN_EMAIL ? 'admin' : 'user'
    });

    await user.save();
    
    req.session.user = {
      _id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role
    };
    
    await req.session.save();
    res.redirect('/dashboard');

  } catch (err) {
    console.error('Registration error:', err);
    res.render('register', { 
      error: 'Registration failed. Please try again.' 
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user with the password field selected
    const user = await User.findOne({ username }).select('+password');
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).render('login', {
        error: 'Invalid username or password'
      });
    }

    // Set session data
    req.session.user = {
      _id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role
    };

    // Save session before redirect
    await req.session.save();

    console.log(`Login successful - Role: ${user.role}, Redirecting to: ${user.role === 'admin' ? '/admin' : '/dashboard'}`);

    // Redirect based on role
    res.redirect(user.role === 'admin' ? '/admin' : '/dashboard');

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).render('login', {
      error: 'Login failed. Please try again.'
    });
  }
});

// Logout handler (ensure POST method)
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) console.error('Logout error:', err);
    res.redirect('/auth/login'); // Redirect to login instead of "/"
  });
});


module.exports = router;
