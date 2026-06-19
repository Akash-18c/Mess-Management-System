const express = require('express');
const RiceBag = require('../models/RiceBag');
const MonthAssignment = require('../models/MonthAssignment');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(auth);

router.get('/:month/:year', async (req, res) => {
  try {
    const entries = await RiceBag.find({ month: req.params.month, year: req.params.year })
      .populate('addedBy', 'name')
      .sort({ date: -1 });
    res.json(entries);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', requireRole('manager', 'admin'), async (req, res) => {
  try {
    const { month, year } = req.body;
    if (req.user.role === 'manager') {
      const assignment = await MonthAssignment.findOne({ month, year, managerId: req.user._id });
      if (!assignment) return res.status(403).json({ message: 'You are not the manager for this month' });
    }
    const entry = await RiceBag.create({ ...req.body, addedBy: req.user._id });
    res.status(201).json(entry);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.put('/:id', requireRole('manager', 'admin'), async (req, res) => {
  try {
    const entry = await RiceBag.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(entry);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete('/:id', requireRole('manager', 'admin'), async (req, res) => {
  try {
    await RiceBag.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
