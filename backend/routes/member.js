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

router.get('/members-list', async (req, res) => {
  try {
    const members = await User.find({ isActive: true }).select('-password').sort({ name: 1 });
    res.json(members);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Upcoming birthdays — within today + 2 days
router.get('/birthdays/upcoming', async (req, res) => {
  try {
    const members = await User.find({ isActive: true, birthday: { $nin: ['', null] } }).select('name birthday');
    const rn2 = (name) => { const m = name?.match(/^\w+\s*\((.+)\)$/); return m ? m[1] : (name || ''); };
    const today = new Date();
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const upcoming = [];
    members.forEach(m => {
      const [mm, dd] = (m.birthday || '').split('-').map(Number);
      if (!mm || !dd) return;
      let bday = new Date(today.getFullYear(), mm - 1, dd);
      if (bday < todayMidnight) bday = new Date(today.getFullYear() + 1, mm - 1, dd);
      const diffDays = Math.floor((bday - todayMidnight) / 86400000);
      if (diffDays >= 0 && diffDays <= 2)
        upcoming.push({ _id: m._id, name: rn2(m.name), birthday: m.birthday, daysLeft: diffDays });
    });
    res.json(upcoming);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/dashboard', async (req, res) => {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const today = now.toISOString().slice(0, 10);

    const [myMeals, payments, summary, allPayments, groceries, others, members, bills, masiRec, allOtherCharges] = await Promise.all([
      Meal.find({ memberId: req.user._id, month, year }).lean(),
      Payment.find({ memberId: req.user._id, month, year }).lean(),
      MonthlySummary.findOne({ month, year }).lean(),
      Payment.find({ month, year }).lean(),
      GroceryExpense.find({ month, year }).select('date total status').lean(),
      OtherExpense.find({ month, year }).select('date amount status').lean(),
      User.find({ isActive: true }, 'name _id role').lean(),
      Bill.find({ month, year }).select('memberId totalBill gasCharge riceCharge otherSharedCharge otherCharges lunchCount dinnerCount guestMeals guestCharge').lean(),
      MasiSalary.findOne({ month, year }).lean(),
      OtherCharge.find({ month, year }).lean(),
    ]);

    let allMeals;
    if (summary?.startDate && summary?.endDate) {
      allMeals = await Meal.find({
        date: { $gte: new Date(summary.startDate + 'T00:00:00.000Z'), $lte: new Date(summary.endDate + 'T23:59:59.999Z') },
      }).select('memberId lunch dinner guestMeals isOff').lean();
    } else {
      allMeals = await Meal.find({ month, year }).select('memberId lunch dinner guestMeals isOff').lean();
    }

    let lunch = 0, dinner = 0, guestMeals = 0;
    myMeals.filter(m => !m.isOff).forEach(m => {
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
      const mMeals = allMeals.filter(ml => ml.memberId?.toString() === m._id.toString() && !ml.isOff);
      const lunch  = mMeals.filter(ml => ml.lunch).length;
      const dinner = mMeals.filter(ml => ml.dinner).length;
      return { name: rn(m.name).split(' ')[0], lunch, dinner, meals: lunch + dinner };
    });

    const individualCosts = members.map(m => {
      const mMeals = allMeals.filter(ml => ml.memberId?.toString() === m._id.toString() && !ml.isOff);
      const mealCount = mMeals.reduce((s, ml) => s + (ml.lunch ? 1 : 0) + (ml.dinner ? 1 : 0), 0);
      const guestCount = mMeals.reduce((s, ml) => s + (ml.guestMeals || 0), 0);
      const totalMeals = mealCount + guestCount;
      const mBill = bills.find(b => b.memberId?.toString() === m._id.toString());
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
      return { _id: m._id, name: rn(m.name), role: m.role, totalMeals, perMealCost: mealRate, mealCost, guestMeals: guestCount, guestCharge: parseFloat((guestCount * mealRate).toFixed(2)), otherSharedCharge: mOtherShared, gasCharge: mGasCharge, riceCharge: mRiceCharge, otherCharges: mOtherCharges, masiSalary: masiPerMember, totalMealCost, moneyGiven, due };
    }).filter(m => m.totalMeals > 0 || m.moneyGiven > 0 || m.masiSalary > 0 || m.otherSharedCharge > 0 || m.otherCharges > 0);

    const myOtherChargesTotal = parseFloat(allOtherCharges.filter(c => c.memberId.toString() === req.user._id.toString()).reduce((s, c) => s + c.amount, 0).toFixed(2));
    res.json({ lunch, dinner, guestMeals, mealRate, estimatedBill, otherSharedCharge, gasCharge, riceCharge, masiPerMember, myOtherCharges: myOtherChargesTotal, advance, todayExpense, totalCollected, memberMealCounts, summary, individualCosts });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/month-data/:month/:year', async (req, res) => {
  try {
    const { month, year } = req.params;
    const [summary, allBills, allPayments, allMembers, masiRec, allOtherCharges] = await Promise.all([
      MonthlySummary.findOne({ month, year }).lean(),
      Bill.find({ month, year }).select('memberId totalBill gasCharge riceCharge otherSharedCharge otherCharges').lean(),
      Payment.find({ month, year }).lean(),
      User.find({}, 'name _id role').lean(),
      MasiSalary.findOne({ month, year }).lean(),
      OtherCharge.find({ month, year }).lean(),
    ]);

    let allMeals;
    if (summary?.startDate && summary?.endDate) {
      allMeals = await Meal.find({
        date: { $gte: new Date(summary.startDate + 'T00:00:00.000Z'), $lte: new Date(summary.endDate + 'T23:59:59.999Z') },
        isOff: false,
      }).select('memberId lunch dinner guestMeals').lean();
    } else {
      allMeals = await Meal.find({ month, year, isOff: false }).select('memberId lunch dinner guestMeals').lean();
    }
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
      const mBill = allBills.find(b => b.memberId?.toString() === m._id.toString());
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
      return { _id: m._id, name: rn(m.name), role: m.role, totalMeals, perMealCost: mealRate, mealCost, guestMeals: guestCount, guestCharge: parseFloat((guestCount * mealRate).toFixed(2)), otherSharedCharge: mOtherShared, gasCharge: mGasCharge, riceCharge: mRiceCharge, otherCharges: mOtherCharges, masiSalary: masiPerMember, totalMealCost, moneyGiven, due };
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

// Manager's own assignment (so manager can edit even without an explicit open-month record)
router.get('/my-assignment', async (req, res) => {
  try {
    const MonthAssignment = require('../models/MonthAssignment');
    const assignment = await MonthAssignment.findOne({ managerId: req.user._id }).sort({ year: -1, month: -1 });
    res.json(assignment ? { month: assignment.month, year: assignment.year } : null);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Active mess periods — readable by all roles (manager needs this to enable meal editing)
router.get('/active-months', async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const summaries = await MonthlySummary.find({ isClosed: false }).sort({ year: -1, month: -1 });
    // A period is active if explicitly opened OR today falls within its startDate–endDate
    const active = summaries.filter(s =>
      s.isOpen ||
      (s.startDate && s.endDate && today >= s.startDate && today <= s.endDate) ||
      (s.startDate && !s.endDate && today >= s.startDate)
    );
    res.json(active.map(s => ({ month: s.month, year: s.year, startDate: s.startDate || null, endDate: s.endDate || null })));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Market duty — readable by all roles
router.get('/market-duty', async (req, res) => {
  try {
    const MarketDuty = require('../models/MarketDuty');
    const duties = await MarketDuty.find({ isActive: true })
      .populate('memberId', 'name phone')
      .sort({ dayOfWeek: 1, meal: 1 });
    res.json(duties);
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
