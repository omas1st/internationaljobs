// routes/dashboard.js
const express = require('express');
const router = express.Router();

function isAuthenticated(req, res, next) {
  if (req.session.user) return next();
  res.redirect('/auth/login');
}

router.get('/', isAuthenticated, (req, res) => {
  res.render('dashboard', { user: req.session.user });
});

module.exports = router;
