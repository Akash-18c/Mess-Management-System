const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { sendWelcomeEmail, sendResetEmail } = require('../utils/mailer');

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const GENERIC_MSG = 'If an account with this email exists, a password reset link has been sent.';

// ── Me (for approval poll) — returns fresh DB data + new token ──
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'No token' });
    const raw = authHeader.split(' ')[1];
    const decoded = jwt.verify(raw, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('name email role isApproved isActive room').lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    // Issue a fresh token so isApproved/role changes are reflected immediately
    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name, isApproved: user.isApproved },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ user, token });
  } catch { res.status(401).json({ message: 'Invalid token' }); }
});

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

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
    user.resetPasswordExpiry = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL || 'https://themessykitchen.online'}/reset-password?token=${token}`;

    await sendResetEmail({ name: user.name, email: user.email, resetUrl });

    res.json({ message: GENERIC_MSG });
  } catch (err) {
    console.error('forgot-password error:', err.message || err);
    res.status(500).json({ message: 'Failed to send reset email. Please try again.' });
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

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (verifyErr) {
      console.error('google verifyIdToken failed:', verifyErr.message);
      return res.status(401).json({ message: 'Google token verification failed. Please try again.' });
    }

    const { email, name, sub: googleId } = payload;
    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // New user — create with pending approval
      const randomPw = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10);
      user = await User.create({
        name, email: email.toLowerCase(), password: randomPw,
        role: 'member', isActive: true, isApproved: false, googleId,
      });
      // Fire welcome email with plain object
      sendWelcomeEmail({ name: user.name, email: user.email }).catch(e => console.error('welcome email err:', e.message));
    } else {
      if (!user.isActive)
        return res.status(403).json({ message: 'Your account is inactive. Contact admin.' });
      // Sync googleId if missing
      if (!user.googleId) {
        await User.findByIdAndUpdate(user._id, { googleId });
        user.googleId = googleId;
      }
      // If not yet approved — return pending state (not an error, just pending)
      if (!user.isApproved) {
        const pendingToken = jwt.sign(
          { id: user._id, role: user.role, name: user.name, isApproved: false },
          process.env.JWT_SECRET, { expiresIn: '7d' }
        );
        return res.json({
          token: pendingToken,
          user: { id: user._id, name: user.name, email: user.email, role: user.role, room: user.room, isApproved: false },
        });
      }
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name, isApproved: user.isApproved },
      process.env.JWT_SECRET, { expiresIn: '7d' }
    );
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, room: user.room, isApproved: user.isApproved },
    });
  } catch (err) {
    console.error('google-auth error:', err.message);
    res.status(500).json({ message: 'Google sign-in failed. Please try again.' });
  }
});

module.exports = router;
