const express = require('express');
const Borrow = require('../models/Borrow');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(auth);

// Member: get own active borrows
router.get('/my', requireRole('member', 'manager', 'admin'), async (req, res) => {
  try {
    const borrows = await Borrow.find({ memberId: req.user._id, returned: false }).sort({ date: -1 });
    res.json(borrows);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Manager: get all borrows (optionally filter by returned)
router.get('/', requireRole('admin', 'manager'), async (req, res) => {
  try {
    const filter = {};
    if (req.query.returned !== undefined) filter.returned = req.query.returned === 'true';
    const borrows = await Borrow.find(filter)
      .populate('memberId', 'name room')
      .sort({ date: -1 });
    res.json(borrows);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Manager: add borrow
router.post('/', requireRole('admin', 'manager'), async (req, res) => {
  try {
    const borrow = await Borrow.create({ ...req.body, recordedBy: req.user._id });
    res.status(201).json(borrow);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// Manager: mark returned / edit
router.put('/:id', requireRole('admin', 'manager'), async (req, res) => {
  try {
    const borrow = await Borrow.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(borrow);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// Manager: delete
router.delete('/:id', requireRole('admin', 'manager'), async (req, res) => {
  try {
    await Borrow.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
