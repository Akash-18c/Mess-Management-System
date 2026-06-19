const express = require('express');
const Payment = require('../models/Payment');
const { auth, requireRole } = require('../middleware/auth');
const { recalcSummary } = require('../controllers/summaryController');

const router = express.Router();
router.use(auth, requireRole('admin', 'manager'));

router.get('/:month/:year', async (req, res) => {
  try {
    const payments = await Payment.find({ month: req.params.month, year: req.params.year })
      .populate('memberId', 'name room')
      .sort({ date: -1 });
    res.json(payments);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const payment = await Payment.create({ ...req.body, recordedBy: req.user._id });
    await recalcSummary(payment.month, payment.year);
    res.status(201).json(payment);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);
    if (payment) await recalcSummary(payment.month, payment.year);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
