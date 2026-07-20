const express = require('express');
const MonthlySummary = require('../models/MonthlySummary');
const { auth } = require('../middleware/auth');

const router = express.Router();
router.use(auth);

router.get('/list', async (req, res) => {
  try {
    const summaries = await MonthlySummary.find().sort({ year: -1, month: -1 }).lean();
    const now = new Date();
    const curMonth = now.getMonth() + 1;
    const curYear  = now.getFullYear();
    const hasCurrent = summaries.some(s => s.month === curMonth && s.year === curYear);
    if (!hasCurrent) {
      summaries.unshift({ month: curMonth, year: curYear, isClosed: false, mealRate: 0, grandTotal: 0, totalMeals: 0 });
    }
    res.json(summaries);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/:month/:year', async (req, res) => {
  try {
    const summary = await MonthlySummary.findOne({ month: req.params.month, year: req.params.year }).lean();
    res.json(summary || { groceryTotal: 0, otherTotal: 0, grandTotal: 0, totalMeals: 0, mealRate: 0, isClosed: false });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
