const express = require('express');
const Bill = require('../models/Bill');
const Meal = require('../models/Meal');
const Payment = require('../models/Payment');
const MonthlySummary = require('../models/MonthlySummary');
const OtherCharge = require('../models/OtherCharge');
const User = require('../models/User');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(auth);

router.get('/:month/:year', requireRole('admin', 'manager'), async (req, res) => {
  try {
    const bills = await Bill.find({ month: req.params.month, year: req.params.year })
      .populate('memberId', 'name room email');
    res.json(bills);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/generate/:month/:year', requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { month, year } = req.params;
    const summary = await MonthlySummary.findOne({ month, year });
    const mealRate = summary?.mealRate || 0;

    const members = await User.find({ isActive: true });
    const bills = [];
    const masiRec = await require('../models/MasiSalary').findOne({ month, year });
    const masiPerMember = masiRec?.perMemberAmount || 0;

    for (const member of members) {
      const meals = await Meal.find({ month, year, memberId: member._id, isOff: false });
      let lunch = 0, dinner = 0, guestMeals = 0;
      meals.forEach((m) => {
        if (m.lunch) lunch++;
        if (m.dinner) dinner++;
        guestMeals += m.guestMeals || 0;
      });
      const mealCount = lunch + dinner;
      const guestCharge = parseFloat((guestMeals * mealRate).toFixed(2));

      const memberCharges = await OtherCharge.find({ memberId: member._id, month, year });
      const otherCharges = parseFloat(memberCharges.reduce((s, c) => s + c.amount, 0).toFixed(2));

      const totalBill = parseFloat(((mealCount + guestMeals) * mealRate + masiPerMember + otherCharges).toFixed(2));

      const payments = await Payment.find({ memberId: member._id, month, year });
      const advance = parseFloat(payments.reduce((s, p) => s + p.amount, 0).toFixed(2));
      const dueAmount = parseFloat((totalBill - advance).toFixed(2));

      const bill = await Bill.findOneAndUpdate(
        { memberId: member._id, month, year },
        { mealCount, breakfastCount: 0, lunchCount: lunch, dinnerCount: dinner, mealRate, guestMeals, guestCharge, masiSalary: masiPerMember, otherCharges, advance, totalBill, dueAmount, generatedBy: req.user._id },
        { upsert: true, new: true }
      );
      bills.push(bill);
    }
    res.json(bills);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/member/:memberId/:month/:year', async (req, res) => {
  try {
    const { memberId, month, year } = req.params;
    if (req.user.role === 'member' && req.user._id.toString() !== memberId) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const bill = await Bill.findOne({ memberId, month, year }).populate('memberId', 'name room email');
    res.json(bill);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
