// routes/pages.js
const express = require('express');
const router = express.Router();
const transporter = require('../config/email');
const rateLimit = require('express-rate-limit');

// Configure rate limiting for messages
const messageLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 message attempts per window
    handler: (req, res) => {
        res.status(429).render('message', {
            message: {
                type: 'error',
                text: 'Too many attempts! Please try again later.'
            }
        });
    }
});

router.get('/', (req, res) => res.render('home'));
router.get('/about', (req, res) => res.render('about'));
router.get('/contact', (req, res) => res.render('contact'));

// Message Page with notifications
router.get('/message', (req, res) => {
    const success = req.query.success;
    let message = null;
    
    if (success === 'true') {
        message = { type: 'success', text: 'Message sent successfully!' };
    } else if (success === 'false') {
        message = { type: 'error', text: 'Failed to send message. Please try again.' };
    }
    
    res.render('message', { message });
});

// Protected message submission with rate limiting
router.post('/message', messageLimiter, async (req, res) => {
    try {
        const { message } = req.body;

        await transporter.sendMail({
            from: `"Website Contact" <${process.env.EMAIL_USER}>`,
            to: 'omas7th@gmail.com',
            subject: 'New Message from Website',
            text: message,
            html: `<p>${message}</p>`
        });

        res.redirect('/message?success=true');
    } catch (error) {
        console.error('Email send error:', error);
        res.redirect('/message?success=false');
    }
});

module.exports = router;