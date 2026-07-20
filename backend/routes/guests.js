const express = require('express');
const GuestMember = require('../models/GuestMember');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(auth, requireRole('admin', 'manager'));

// List guests for a month
router.get('/:month/:year', async (req, res) => {
  try {
    const guests = await GuestMember.find({ month: req.params.month, year: req.params.year })
      .sort({ createdAt: -1 });
    res.json(guests);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Create guest
router.post('/', async (req, res) => {
  try {
    const guest = await GuestMember.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json(guest);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// Update guest (name, phone, note, mealRate, meals)
router.put('/:id', async (req, res) => {
  try {
    const guest = await GuestMember.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!guest) return res.status(404).json({ message: 'Not found' });
    res.json(guest);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// Delete guest (admin only)
router.delete('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    await GuestMember.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
