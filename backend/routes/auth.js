const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Resend } = require('resend');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const GENERIC_MSG = 'If an account with this email exists, a password reset link has been sent.';

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select('name email password role room isActive').lean();
    if (!user || !user.isActive) return res.status(401).json({ message: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id, role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, room: user.room },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Forgot Password ──
router.post('/forgot-password', async (req, res) => {
  try {
    const email = (req.body.email || '').toLowerCase().trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ message: 'Invalid email address.' });

    const user = await User.findOne({ email });
    if (!user) return res.json({ message: GENERIC_MSG });

    if (!process.env.RESEND_API_KEY)
      return res.status(500).json({ message: 'Email service not configured.' });

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
    user.resetPasswordExpiry = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL || 'https://themessykitchen.online'}/reset-password?token=${token}`;

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px">
<tr><td align="center">
<table width="100%" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

  <!-- Logo header -->
  <tr><td align="center" style="padding:36px 32px 24px">
    <img src="https://themessykitchen.online/messy-logo.png" alt="The Messy Kitchen" width="72" height="72" style="display:block;margin:0 auto 16px;border-radius:50%" />
    <h1 style="margin:0;color:#111827;font-size:22px;font-weight:700">The Messy Kitchen</h1>
    <p style="margin:6px 0 0;color:#6b7280;font-size:12px;letter-spacing:2px;text-transform:uppercase">Password Reset</p>
  </td></tr>

  <!-- Divider -->
  <tr><td style="padding:0 32px"><div style="height:1px;background:#e5e7eb"></div></td></tr>

  <!-- Body -->
  <tr><td style="padding:32px">
    <p style="color:#111827;font-size:15px;margin:0 0 12px">Hello ${user.name},</p>
    <p style="color:#4b5563;font-size:14px;line-height:1.7;margin:0 0 24px">We received a request to reset your password for your Messy Kitchen account.</p>
    <p style="color:#4b5563;font-size:14px;line-height:1.7;margin:0 0 28px">Click the button below to reset your password:</p>
    <div style="text-align:center;margin-bottom:28px">
      <a href="${resetUrl}" style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:15px;font-weight:700">Reset Password</a>
    </div>
    <p style="color:#9ca3af;font-size:12px;margin:0 0 8px">⏱ This link will expire in <strong style="color:#111827">15 minutes</strong>.</p>
    <p style="color:#9ca3af;font-size:12px;margin:0">If you did not request this, you can safely ignore this email.</p>
  </td></tr>

  <!-- Footer -->
  <tr><td style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #e5e7eb">
    <p style="color:#9ca3af;font-size:12px;margin:0">Thanks, <strong style="color:#059669">Messy Kitchen Team</strong></p>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: 'Messy Kitchen <onboarding@resend.dev>',
      to: user.email,
      subject: 'Reset Your Messy Kitchen Password',
      html,
    });

    if (error) throw new Error(error.message);

    res.json({ message: GENERIC_MSG });
  } catch (err) {
    console.error('forgot-password error:', err.message || err);
    res.status(500).json({ message: err.message || 'Failed to send reset email. Please try again.' });
  }
});

// ── Reset Password ──
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ message: 'Invalid request.' });
    if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' });

    const hashed = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashed,
      resetPasswordExpiry: { $gt: new Date() },
    });

    if (!user) return res.status(400).json({ message: 'This password reset link is invalid or has expired.' });

    user.password = await bcrypt.hash(password, 12);
    user.resetPasswordToken = null;
    user.resetPasswordExpiry = null;
    await user.save();

    res.json({ message: 'Password changed successfully. Please login.' });
  } catch (err) {
    console.error('reset-password error:', err);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
});

// ── Google OAuth Login ──
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ message: 'Missing Google credential.' });

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { email, name, sub: googleId } = ticket.getPayload();

    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // New user — create as member, admin assigns role later
      const randomPw = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10);
      user = await User.create({
        name,
        email: email.toLowerCase(),
        password: randomPw,
        role: 'member',
        isActive: true,
        googleId,
      });
    } else if (!user.isActive) {
      return res.status(401).json({ message: 'Your account is inactive. Contact admin.' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, room: user.room },
    });
  } catch (err) {
    console.error('google-auth error:', err.message);
    res.status(401).json({ message: 'Google sign-in failed. Please try again.' });
  }
});

module.exports = router;
