// routes/pages.js
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => res.render('home'));
router.get('/about', (req, res) => res.render('about'));
router.get('/contact', (req, res) => res.render('contact'));
router.get('/message', (req, res) => res.render('message'));

module.exports = router;
