const express = require('express');
const GasCylinder = require('../models/GasCylinder');
const MonthAssignment = require('../models/MonthAssignment');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(auth);

// Anyone can view
router.get('/:month/:year', async (req, res) => {
  try {
    const entries = await GasCylinder.find({ month: req.params.month, year: req.params.year })
      .populate('addedBy', 'name')
      .sort({ date: -1 });
    res.json(entries);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Only current month manager or admin can add
router.post('/', requireRole('manager', 'admin'), async (req, res) => {
  try {
    const { month, year } = req.body;
    if (req.user.role === 'manager') {
      const assignment = await MonthAssignment.findOne({ month, year, managerId: req.user._id });
      if (!assignment) return res.status(403).json({ message: 'You are not the manager for this month' });
    }
    const entry = await GasCylinder.create({ ...req.body, addedBy: req.user._id });
    res.status(201).json(entry);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// Manager or admin can update status
router.put('/:id', requireRole('manager', 'admin'), async (req, res) => {
  try {
    const entry = await GasCylinder.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(entry);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete('/:id', requireRole('manager', 'admin'), async (req, res) => {
  try {
    await GasCylinder.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
