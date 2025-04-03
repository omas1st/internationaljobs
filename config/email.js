const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

module.exports = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});