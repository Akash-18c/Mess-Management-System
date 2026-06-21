const express = require('express');
const Meal = require('../models/Meal');
const Bill = require('../models/Bill');
const Payment = require('../models/Payment');
const MonthlySummary = require('../models/MonthlySummary');
const GroceryExpense = require('../models/GroceryExpense');
const OtherExpense = require('../models/OtherExpense');
const OtherCharge = require('../models/OtherCharge');
const User = require('../models/User');
const MasiSalary = require('../models/MasiSalary');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(auth, requireRole('member', 'manager', 'admin'));

const rn = (name) => { const m = name?.match(/^\w+\s*\((.+)\)$/); return m ? m[1] : (name || ''); };

router.get('/dashboard', async (req, res) => {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const today = now.toISOString().slice(0, 10);

    const [meals, payments, summary, allMeals, allPayments, groceries, others, members, bills, masiRec, allOtherCharges] = await Promise.all([
      Meal.find({ memberId: req.user._id, month, year }),
      Payment.find({ memberId: req.user._id, month, year }),
      MonthlySummary.findOne({ month, year }),
      Meal.find({ month, year }).populate('memberId', 'name'),
      Payment.find({ month, year }),
      GroceryExpense.find({ month, year }),
      OtherExpense.find({ month, year }),
      User.find({ isActive: true }, 'name _id role'),
      Bill.find({ month, year }).populate('memberId', 'name room'),
      MasiSalary.findOne({ month, year }),
      OtherCharge.find({ month, year }),
    ]);

    let lunch = 0, dinner = 0, guestMeals = 0;
    meals.filter(m => !m.isOff).forEach(m => {
      if (m.lunch) lunch++;
      if (m.dinner) dinner++;
      guestMeals += m.guestMeals || 0;
    });
    const advance = parseFloat(payments.reduce((s, p) => s + p.amount, 0).toFixed(2));
    const mealRate = summary?.mealRate || 0;
    const masiPerMember = masiRec?.perMemberAmount || 0;
    // other shared charge = paid other expenses ÷ active members (from summary)
    const otherSharedCharge = summary?.otherPaidPerMember || 0;
    const gasCharge  = summary?.gasPerMember  || 0;
    const riceCharge = summary?.ricePerMember || 0;

    const estimatedBill = parseFloat(((lunch + dinner + guestMeals) * mealRate).toFixed(2));

    const todayGrocery = groceries.filter(g => g.date?.toISOString().slice(0,10) === today).reduce((s, g) => s + g.total, 0);
    const todayOther   = others.filter(o => o.date?.toISOString().slice(0,10) === today && o.status === 'Paid').reduce((s, o) => s + o.amount, 0);
    const todayExpense = parseFloat((todayGrocery + todayOther).toFixed(2));
    const totalCollected = parseFloat(allPayments.reduce((s, p) => s + p.amount, 0).toFixed(2));

    const memberMealCounts = members.map(m => {
      const mMeals = allMeals.filter(ml => ml.memberId?._id?.toString() === m._id.toString() && !ml.isOff);
      const lunch  = mMeals.filter(ml => ml.lunch).length;
      const dinner = mMeals.filter(ml => ml.dinner).length;
      return { name: rn(m.name).split(' ')[0], lunch, dinner, meals: lunch + dinner };
    });

    const individualCosts = members.map(m => {
      const mMeals = allMeals.filter(ml => ml.memberId?._id?.toString() === m._id.toString() && !ml.isOff);
      const mealCount = mMeals.reduce((s, ml) => s + (ml.lunch ? 1 : 0) + (ml.dinner ? 1 : 0), 0);
      const guestCount = mMeals.reduce((s, ml) => s + (ml.guestMeals || 0), 0);
      const totalMeals = mealCount + guestCount;
      const mBill = bills.find(b => b.memberId?._id?.toString() === m._id.toString());
      const mealCost = parseFloat(((mealCount + guestCount) * mealRate).toFixed(2));
      const mGasCharge   = mBill?.gasCharge        ?? gasCharge;
      const mRiceCharge  = mBill?.riceCharge       ?? riceCharge;
      const mOtherShared = mBill?.otherSharedCharge ?? otherSharedCharge;
      const mOtherCharges = mBill
        ? (mBill.otherCharges || 0)
        : parseFloat(allOtherCharges.filter(c => c.memberId.toString() === m._id.toString()).reduce((s, c) => s + c.amount, 0).toFixed(2));
      // totalMealCost from generated bill (most accurate)
      const totalMealCost = mBill
        ? parseFloat(mBill.totalBill.toFixed(2))
        : parseFloat((mealCost + masiPerMember + mOtherShared + mGasCharge + mRiceCharge + mOtherCharges).toFixed(2));
      const mPayments = allPayments.filter(p => p.memberId?.toString() === m._id.toString());
      const moneyGiven = parseFloat(mPayments.reduce((s, p) => s + p.amount, 0).toFixed(2));
      const due = parseFloat((moneyGiven - totalMealCost).toFixed(2));
      return { _id: m._id, name: rn(m.name), role: m.role, totalMeals, perMealCost: mealRate, mealCost, otherSharedCharge: mOtherShared, gasCharge: mGasCharge, riceCharge: mRiceCharge, otherCharges: mOtherCharges, masiSalary: masiPerMember, totalMealCost, moneyGiven, due };
    }).filter(m => m.totalMeals > 0 || m.moneyGiven > 0 || m.masiSalary > 0 || m.otherSharedCharge > 0 || m.otherCharges > 0);

    const myOtherChargesTotal = parseFloat(allOtherCharges.filter(c => c.memberId.toString() === req.user._id.toString()).reduce((s, c) => s + c.amount, 0).toFixed(2));
    res.json({ lunch, dinner, guestMeals, mealRate, estimatedBill, otherSharedCharge, gasCharge, riceCharge, masiPerMember, myOtherCharges: myOtherChargesTotal, advance, todayExpense, totalCollected, memberMealCounts, summary, individualCosts });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/month-data/:month/:year', async (req, res) => {
  try {
    const { month, year } = req.params;
    const [summary, allBills, allPayments, allMembers, allMeals, masiRec, allOtherCharges] = await Promise.all([
      MonthlySummary.findOne({ month, year }),
      Bill.find({ month, year }).populate('memberId', 'name room'),
      Payment.find({ month, year }),
      User.find({}, 'name _id role'),
      Meal.find({ month, year, isOff: false }),
      MasiSalary.findOne({ month, year }),
      OtherCharge.find({ month, year }),
    ]);
    const totalCollected = parseFloat(allPayments.reduce((s, p) => s + p.amount, 0).toFixed(2));
    const mealRate = summary?.mealRate || 0;
    const masiPerMember = masiRec?.perMemberAmount || 0;
    const otherSharedCharge = summary?.otherPaidPerMember || 0;
    const gasCharge  = summary?.gasPerMember  || 0;
    const riceCharge = summary?.ricePerMember || 0;

    const individualCosts = allMembers.map(m => {
      const mMeals = allMeals.filter(ml => ml.memberId?.toString() === m._id.toString());
      const mealCount = mMeals.reduce((s, ml) => s + (ml.lunch ? 1 : 0) + (ml.dinner ? 1 : 0), 0);
      const guestCount = mMeals.reduce((s, ml) => s + (ml.guestMeals || 0), 0);
      const totalMeals = mealCount + guestCount;
      const mBill = allBills.find(b => b.memberId?._id?.toString() === m._id.toString());
      const mealCost = parseFloat(((mealCount + guestCount) * mealRate).toFixed(2));
      const mGasCharge   = mBill?.gasCharge        ?? gasCharge;
      const mRiceCharge  = mBill?.riceCharge       ?? riceCharge;
      const mOtherShared = mBill?.otherSharedCharge ?? otherSharedCharge;
      const mOtherCharges = mBill
        ? (mBill.otherCharges || 0)
        : parseFloat(allOtherCharges.filter(c => c.memberId.toString() === m._id.toString()).reduce((s, c) => s + c.amount, 0).toFixed(2));
      const totalMealCost = mBill
        ? parseFloat(mBill.totalBill.toFixed(2))
        : parseFloat((mealCost + masiPerMember + mOtherShared + mGasCharge + mRiceCharge + mOtherCharges).toFixed(2));
      const mPays = allPayments.filter(p => p.memberId?.toString() === m._id.toString());
      const moneyGiven = parseFloat(mPays.reduce((s, p) => s + p.amount, 0).toFixed(2));
      const due = parseFloat((moneyGiven - totalMealCost).toFixed(2));
      return { _id: m._id, name: rn(m.name), role: m.role, totalMeals, perMealCost: mealRate, mealCost, otherSharedCharge: mOtherShared, gasCharge: mGasCharge, riceCharge: mRiceCharge, otherCharges: mOtherCharges, masiSalary: masiPerMember, totalMealCost, moneyGiven, due };
    }).filter(m => m.totalMeals > 0 || m.moneyGiven > 0 || m.masiSalary > 0 || m.otherSharedCharge > 0 || m.otherCharges > 0);

    res.json({ summary, totalCollected, individualCosts });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/all-history', async (req, res) => {
  try {
    const [allMeals, allSummaries, allBills, allPayments, allMembers, allMasiSalaries, allOtherCharges] = await Promise.all([
      Meal.find({}).select('month year memberId lunch dinner guestMeals isOff').lean(),
      MonthlySummary.find().lean(),
      Bill.find().populate('memberId', 'name room').lean(),
      Payment.find().lean(),
      User.find({}, 'name _id role room isActive').lean(),
      MasiSalary.find().lean(),
      OtherCharge.find({}).lean(),
    ]);

    const masiMap = {};
    allMasiSalaries.forEach(s => { masiMap[`${s.year}-${s.month}`] = s.perMemberAmount || 0; });

    const monthSet = new Set();
    allMeals.forEach(m => monthSet.add(`${m.year}-${m.month}`));
    allSummaries.forEach(s => monthSet.add(`${s.year}-${s.month}`));

    const summaryMap = {};
    allSummaries.forEach(s => { summaryMap[`${s.year}-${s.month}`] = s; });

    const result = [...monthSet].map(key => {
      const [year, month] = key.split('-').map(Number);
      const summary = summaryMap[key] || null;
      const mealRate = summary?.mealRate || 0;
      const masiPerMember = masiMap[key] || 0;
      const otherSharedCharge = summary?.otherPaidPerMember || 0;
      const gasCharge  = summary?.gasPerMember  || 0;
      const riceCharge = summary?.ricePerMember || 0;

      const monthMeals    = allMeals.filter(m => m.month === month && m.year === year && !m.isOff);
      const monthPayments = allPayments.filter(p => p.month == month && p.year == year);
      const monthBills    = allBills.filter(b => b.month == month && b.year == year);

      const members = allMembers.map(m => {
        const mMeals = monthMeals.filter(ml => ml.memberId?.toString() === m._id.toString());
        const mealCount = mMeals.reduce((s, ml) => s + (ml.lunch ? 1 : 0) + (ml.dinner ? 1 : 0), 0);
        const guestCount = mMeals.reduce((s, ml) => s + (ml.guestMeals || 0), 0);
        const totalMeals = mealCount + guestCount;
        const mBill = monthBills.find(b => b.memberId?._id?.toString() === m._id.toString());
        const mealCost = parseFloat(((mealCount + guestCount) * mealRate).toFixed(2));
        const mGasCharge   = mBill?.gasCharge        ?? gasCharge;
        const mRiceCharge  = mBill?.riceCharge       ?? riceCharge;
        const billOtherShared = mBill ? (mBill.otherSharedCharge || otherSharedCharge) : otherSharedCharge;
        const mOtherCharges = mBill
          ? (mBill.otherCharges || 0)
          : parseFloat(allOtherCharges.filter(c => c.memberId.toString() === m._id.toString() && c.month === month && c.year === year).reduce((s, c) => s + c.amount, 0).toFixed(2));
        const totalBill = mBill ? mBill.totalBill : parseFloat((mealCost + masiPerMember + billOtherShared + mGasCharge + mRiceCharge + mOtherCharges).toFixed(2));
        const lunchCount  = mBill ? mBill.lunchCount  : mMeals.filter(ml => ml.lunch).length;
        const dinnerCount = mBill ? mBill.dinnerCount : mMeals.filter(ml => ml.dinner).length;
        const guestMeals  = mBill ? mBill.guestMeals  : guestCount;
        const guestCharge = mBill ? mBill.guestCharge : parseFloat((guestCount * mealRate).toFixed(2));
        const mPays = monthPayments.filter(p => p.memberId?.toString() === m._id.toString());
        const advance = parseFloat(mPays.reduce((s, p) => s + p.amount, 0).toFixed(2));
        const dueAmount = parseFloat((totalBill - advance).toFixed(2));
        if (totalMeals === 0 && advance === 0 && masiPerMember === 0 && otherSharedCharge === 0 && mGasCharge === 0 && mRiceCharge === 0 && mOtherCharges === 0) return null;
        return {
          _id: mBill?._id || m._id,
          memberId: { _id: m._id, name: rn(m.name), room: m.room },
          role: m.role, month, year,
          mealCount: totalMeals, lunchCount, dinnerCount, guestMeals, guestCharge,
          mealCost, otherSharedCharge: billOtherShared, gasCharge: mGasCharge, riceCharge: mRiceCharge, otherCharges: mOtherCharges, masiSalary: masiPerMember,
          mealRate, totalBill, advance, dueAmount,
        };
      }).filter(Boolean);

      return { month, year, summary, bills: members };
    }).filter(g => g.bills.length > 0)
      .sort((a, b) => b.year !== a.year ? b.year - a.year : b.month - a.month);

    res.json(result);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/all-payments/:month/:year', async (req, res) => {
  try {
    const payments = await Payment.find({ month: req.params.month, year: req.params.year })
      .populate('memberId', 'name').sort({ date: 1 });
    res.json(payments);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/history', async (req, res) => {
  try {
    const bills = await Bill.find({ memberId: req.user._id }).sort({ year: -1, month: -1 });
    res.json(bills);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/payments/:month/:year', async (req, res) => {
  try {
    const payments = await Payment.find({ memberId: req.user._id, month: req.params.month, year: req.params.year }).sort({ date: 1 });
    res.json(payments);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
