const express = require('express');
const Notification = require('../models/Notification');
const { auth } = require('../middleware/auth');

const router = express.Router();
router.use(auth);

// GET current month's notifications only, with unread flag for current user
router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year  = now.getFullYear();
    const notes = await Notification.find({ month, year })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    const uid = req.user._id.toString();
    res.json(notes.map(n => ({ ...n, isRead: n.readBy.map(String).includes(uid) })));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Mark all as read — MUST be before /:id/read to avoid 'read-all' matching :id
router.patch('/read-all', async (req, res) => {
  try {
    const now = new Date();
    await Notification.updateMany(
      { month: now.getMonth() + 1, year: now.getFullYear() },
      { $addToSet: { readBy: req.user._id } }
    );
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Mark one as read
router.patch('/:id/read', async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { $addToSet: { readBy: req.user._id } });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
