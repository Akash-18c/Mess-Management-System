const express = require('express');
const Meal = require('../models/Meal');
const User = require('../models/User');
const { auth, requireRole } = require('../middleware/auth');
const { recalcSummary } = require('../controllers/summaryController');

const router = express.Router();
router.use(auth);

router.get('/:month/:year', async (req, res) => {
  try {
    const meals = await Meal.find({ month: req.params.month, year: req.params.year })
      .populate('memberId', 'name room')
      .sort({ date: 1 });
    res.json(meals);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/mark', requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { date, memberId, lunch, dinner, isOff, month, year } = req.body;
    const meal = await Meal.findOneAndUpdate(
      { date: new Date(date), memberId },
      { breakfast: false, lunch, dinner, isOff, month, year },
      { upsert: true, new: true }
    );
    await recalcSummary(month, year);
    res.json(meal);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.post('/guest', requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { date, memberId, guestMeals, month, year } = req.body;
    const meal = await Meal.findOneAndUpdate(
      { date: new Date(date), memberId },
      { guestMeals, month, year },
      { upsert: true, new: true }
    );
    await recalcSummary(month, year);
    res.json(meal);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// Member marks own off day
router.post('/leave', requireRole('member', 'manager', 'admin'), async (req, res) => {
  try {
    const { date, month, year } = req.body;
    const meal = await Meal.findOneAndUpdate(
      { date: new Date(date), memberId: req.user._id },
      { isOff: true, breakfast: false, lunch: false, dinner: false, month, year },
      { upsert: true, new: true }
    );
    res.json(meal);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

module.exports = router;
