const express = require('express');
const Meal = require('../models/Meal');
const User = require('../models/User');
const { auth, requireRole } = require('../middleware/auth');
const { recalcSummary } = require('../controllers/summaryController');
const { pushNotification } = require('../utils/notify');

const router = express.Router();
router.use(auth);

router.get('/:month/:year', async (req, res) => {
  try {
    const meals = await Meal.find({ month: req.params.month, year: req.params.year })
      .select('date memberId lunch dinner isOff guestMeals month year')
      .sort({ date: 1 })
      .lean();
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
    const marks = [];
    if (lunch) marks.push('Lunch');
    if (dinner) marks.push('Dinner');
    if (isOff) marks.push('Off day');
    if (marks.length) await pushNotification({ user: req.user, message: `Marked meals for a member (${marks.join(' + ')})`, category: 'meal', month, year });
    res.json(meal);, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { date, memberId, guestMeals, month, year } = req.body;
    const meal = await Meal.findOneAndUpdate(
      { date: new Date(date), memberId },
      { guestMeals, month, year },
      { upsert: true, new: true }
    );
    await recalcSummary(month, year);
    if (guestMeals > 0) await pushNotification({ user: req.user, message: `Added ${guestMeals} guest meal(s)`, category: 'meal', month, year });
    res.json(meal);
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
