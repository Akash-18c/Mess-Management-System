const express = require('express');
const Borrow  = require('../models/Borrow');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(auth);

// Member: get own active (not returned) borrows
router.get('/my', async (req, res) => {
  try {
    const items = await Borrow.find({ memberId: req.user._id, returned: false }).sort({ date: -1 });
    res.json(items);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Manager/Admin: get all borrows
router.get('/', requireRole('manager', 'admin'), async (req, res) => {
  try {
    const items = await Borrow.find().populate('memberId', 'name room').sort({ returned: 1, date: -1 });
    res.json(items);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Manager/Admin: add borrow
router.post('/', requireRole('manager', 'admin'), async (req, res) => {
  try {
    const { memberId, amount, reason, date } = req.body;
    const item = await Borrow.create({ memberId, amount: +amount, reason, date, addedBy: req.user._id });
    const populated = await item.populate('memberId', 'name room');
    res.status(201).json(populated);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// Manager/Admin: mark returned
router.put('/:id/return', requireRole('manager', 'admin'), async (req, res) => {
  try {
    const item = await Borrow.findByIdAndUpdate(
      req.params.id,
      { returned: true, returnedAt: new Date() },
      { new: true }
    ).populate('memberId', 'name room');
    res.json(item);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// Manager/Admin: delete
router.delete('/:id', requireRole('manager', 'admin'), async (req, res) => {
  try {
    await Borrow.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
