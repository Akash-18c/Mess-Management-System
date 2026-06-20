const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const MonthAssignment = require('../models/MonthAssignment');
const ExpenseCategory = require('../models/ExpenseCategory');
const MonthlySummary = require('../models/MonthlySummary');
const GroceryExpense = require('../models/GroceryExpense');
const OtherExpense = require('../models/OtherExpense');
const Bill = require('../models/Bill');
const MasiSalary = require('../models/MasiSalary');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(auth, requireRole('admin'));

// --- Masi Salary ---
router.get('/masi-salary/:month/:year', async (req, res) => {
  try {
    const rec = await MasiSalary.findOne({ month: req.params.month, year: req.params.year });
    res.json(rec || { totalAmount: 0, perMemberAmount: 0, memberCount: 0 });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/masi-salary', async (req, res) => {
  try {
    const { month, year, totalAmount } = req.body;
    const memberCount = await User.countDocuments({ isActive: true });
    // perMemberAmount = totalAmount (each member pays the full amount, not a split)
    const perMemberAmount = parseFloat(parseFloat(totalAmount).toFixed(2));
    const rec = await MasiSalary.findOneAndUpdate(
      { month, year },
      { totalAmount, perMemberAmount, memberCount, setBy: req.user._id },
      { upsert: true, new: true }
    );
    res.json(rec);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// --- Members ---
router.get('/members', async (req, res) => {
  try {
    const members = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(members);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/members', async (req, res) => {
  try {
    const { name, email, password, phone, room, joinDate } = req.body;
    const hashed = await bcrypt.hash(password || 'mess1234', 10);
    const user = await User.create({ name, email, password: hashed, phone, room, joinDate, role: 'member' });
    res.status(201).json({ ...user.toObject(), password: undefined });
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.put('/members/:id', async (req, res) => {
  try {
    const { password, ...data } = req.body;
    if (password) data.password = await bcrypt.hash(password, 10);
    const user = await User.findByIdAndUpdate(req.params.id, data, { new: true }).select('-password');
    res.json(user);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete('/members/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Member deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- Manager Assignments ---
router.get('/assignments', async (req, res) => {
  try {
    const assignments = await MonthAssignment.find()
      .populate('managerId', 'name email')
      .populate('assignedBy', 'name')
      .sort({ year: -1, month: -1 });
    res.json(assignments);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/assignments', async (req, res) => {
  try {
    const { month, year, managerId } = req.body;
    const existing = await MonthAssignment.findOne({ month, year });
    if (existing) return res.status(400).json({ message: 'Manager already assigned for this month' });
    const assignment = await MonthAssignment.create({ month, year, managerId, assignedBy: req.user._id });
    await User.findByIdAndUpdate(managerId, { role: 'manager' });
    res.status(201).json(assignment);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.put('/assignments/:id', async (req, res) => {
  try {
    const { managerId } = req.body;
    const old = await MonthAssignment.findById(req.params.id);
    if (old) await User.findByIdAndUpdate(old.managerId, { role: 'member' });
    const updated = await MonthAssignment.findByIdAndUpdate(
      req.params.id, { managerId, assignedBy: req.user._id, assignedAt: new Date() }, { new: true }
    ).populate('managerId', 'name email');
    await User.findByIdAndUpdate(managerId, { role: 'manager' });
    res.json(updated);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete('/assignments/:id', async (req, res) => {
  try {
    const assignment = await MonthAssignment.findByIdAndDelete(req.params.id);
    if (assignment) await User.findByIdAndUpdate(assignment.managerId, { role: 'member' });
    res.json({ message: 'Assignment revoked' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- Expense Categories ---
router.get('/categories', async (req, res) => {
  try {
    const cats = await ExpenseCategory.find({ isActive: true }).sort({ name: 1 });
    res.json(cats);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/categories', async (req, res) => {
  try {
    const cat = await ExpenseCategory.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json(cat);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.put('/categories/:id', async (req, res) => {
  try {
    const cat = await ExpenseCategory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(cat);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete('/categories/:id', async (req, res) => {
  try {
    await ExpenseCategory.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Category removed' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- Dashboard ---
router.get('/dashboard', async (req, res) => {
  try {
    const totalMembers = await User.countDocuments({ role: { $in: ['member', 'manager'] }, isActive: true });
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const Payment = require('../models/Payment');
    const [summary, assignment, allSummaries, allAssignments, payments] = await Promise.all([
      MonthlySummary.findOne({ month, year }),
      MonthAssignment.findOne({ month, year }).populate('managerId', 'name'),
      MonthlySummary.find().sort({ year: -1, month: -1 }).limit(12),
      MonthAssignment.find().populate('managerId', 'name').sort({ year: -1, month: -1 }),
      require('../models/Payment').find({ month, year }),
    ]);
    const totalCollected = parseFloat(payments.reduce((s, p) => s + p.amount, 0).toFixed(2));

    // Individual cost table — computed from Meal records so ALL members show even before bills generated
    const Meal = require('../models/Meal');
    const Payment2 = require('../models/Payment');
    const allMealsThisMonth = await Meal.find({ month, year, isOff: false });
    const allBills = await Bill.find({ month, year }).populate('memberId', 'name room');
    const allPayments2 = await Payment2.find({ month, year });
    const allMembers = await User.find({ isActive: true }, 'name _id role');
    const mealRate = summary?.mealRate || 0;
    const masiRec = await MasiSalary.findOne({ month, year });
    const masiPerMember = masiRec?.perMemberAmount || 0;
    const rn = (name) => { const m = name?.match(/^\w+\s*\((.+)\)$/); return m ? m[1] : (name || ''); };
    const individualCosts = allMembers.map(m => {
      const mMeals = allMealsThisMonth.filter(ml => ml.memberId?.toString() === m._id.toString());
      const mealCount = mMeals.reduce((s, ml) => s + (ml.lunch ? 1 : 0) + (ml.dinner ? 1 : 0), 0);
      const guestCount = mMeals.reduce((s, ml) => s + (ml.guestMeals || 0), 0);
      const totalMeals = mealCount + guestCount;
      const mBill = allBills.find(b => b.memberId?._id?.toString() === m._id.toString());
      const totalMealCost = mBill ? parseFloat(mBill.totalBill.toFixed(2)) : parseFloat(((mealCount + guestCount) * mealRate).toFixed(2));
      const mPays = allPayments2.filter(p => p.memberId?.toString() === m._id.toString());
      const moneyGiven = parseFloat(mPays.reduce((s, p) => s + p.amount, 0).toFixed(2));
      const totalDue = parseFloat((totalMealCost + masiPerMember).toFixed(2));
      const due = parseFloat((moneyGiven - totalDue).toFixed(2));
      return { _id: m._id, name: rn(m.name), role: m.role, totalMeals, perMealCost: mealRate, totalMealCost, masiSalary: masiPerMember, moneyGiven, due };
    }).filter(m => m.totalMeals > 0 || m.moneyGiven > 0 || m.masiSalary > 0);

    res.json({ totalMembers, currentSummary: summary, currentManager: assignment, allSummaries, allAssignments, totalCollected, individualCosts });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- Reports & Month Control ---
router.get('/reports/:month/:year', async (req, res) => {
  try {
    const { month, year } = req.params;
    const Payment = require('../models/Payment');
    const [summary, groceries, others, assignment, bills, payments] = await Promise.all([
      MonthlySummary.findOne({ month, year }),
      GroceryExpense.find({ month, year }).sort({ date: 1 }),
      OtherExpense.find({ month, year }).sort({ date: 1 }),
      MonthAssignment.findOne({ month, year }).populate('managerId', 'name email'),
      Bill.find({ month, year }).populate('memberId', 'name room email'),
      Payment.find({ month, year }).populate('memberId', 'name'),
    ]);
    res.json({ summary, groceries, others, assignment, bills, payments });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Month-wise data for dashboard dropdown
router.get('/month-data/:month/:year', async (req, res) => {
  try {
    const { month, year } = req.params;
    const Payment = require('../models/Payment');
    const Meal    = require('../models/Meal');
    const [summary, payments, allBills, allPayments2, allMembers, allMeals] = await Promise.all([
      MonthlySummary.findOne({ month, year }),
      Payment.find({ month, year }),
      Bill.find({ month, year }).populate('memberId', 'name room'),
      Payment.find({ month, year }),
      User.find({ isActive: true }, 'name _id role'),
      Meal.find({ month, year, isOff: false }),
    ]);
    const rnm = (name) => { const m = name?.match(/^\w+\s*\((.+)\)$/); return m ? m[1] : (name || ''); };
    const totalCollected = parseFloat((payments.reduce((s, p) => s + p.amount, 0)).toFixed(2));
    const mealRate = summary?.mealRate || 0;
    const masiRec2 = await MasiSalary.findOne({ month, year });
    const masiPerMember2 = masiRec2?.perMemberAmount || 0;
    const individualCosts = allMembers.map(m => {
      const mMeals = allMeals.filter(ml => ml.memberId?.toString() === m._id.toString());
      const mealCount = mMeals.reduce((s, ml) => s + (ml.lunch ? 1 : 0) + (ml.dinner ? 1 : 0), 0);
      const guestCount = mMeals.reduce((s, ml) => s + (ml.guestMeals || 0), 0);
      const totalMeals = mealCount + guestCount;
      const mBill = allBills.find(b => b.memberId?._id?.toString() === m._id.toString());
      const totalMealCost = mBill ? parseFloat(mBill.totalBill.toFixed(2)) : parseFloat(((mealCount + guestCount) * mealRate).toFixed(2));
      const mPays = allPayments2.filter(p => p.memberId?.toString() === m._id.toString());
      const moneyGiven = parseFloat(mPays.reduce((s, p) => s + p.amount, 0).toFixed(2));
      const totalDue = parseFloat((totalMealCost + masiPerMember2).toFixed(2));
      const due = parseFloat((moneyGiven - totalDue).toFixed(2));
      return { _id: m._id, name: rnm(m.name), role: m.role, totalMeals, perMealCost: mealRate, totalMealCost, masiSalary: masiPerMember2, moneyGiven, due };
    }).filter(m => m.totalMeals > 0 || m.moneyGiven > 0 || m.masiSalary > 0);
    res.json({ summary, totalCollected, individualCosts });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- Purge Month Data ---
router.delete('/purge-month/:month/:year', async (req, res) => {
  try {
    const month = parseInt(req.params.month);
    const year  = parseInt(req.params.year);
    const Meal    = require('../models/Meal');
    const Payment = require('../models/Payment');
    const RiceBag = require('../models/RiceBag');
    const GasCylinder = require('../models/GasCylinder');
    const filter = { month, year };
    const [meals, grocery, other, payments, bills, summary, assignment, gas, rice] = await Promise.all([
      Meal.deleteMany(filter),
      GroceryExpense.deleteMany(filter),
      OtherExpense.deleteMany(filter),
      Payment.deleteMany(filter),
      Bill.deleteMany(filter),
      MonthlySummary.deleteMany(filter),
      MonthAssignment.deleteMany(filter),
      GasCylinder.deleteMany(filter),
      RiceBag.deleteMany(filter),
    ]);
    // revert manager role for that month's assignment (already deleted, just ensure)
    res.json({
      message: `All data for ${month}/${year} deleted`,
      deleted: {
        meals: meals.deletedCount,
        groceries: grocery.deletedCount,
        otherExpenses: other.deletedCount,
        payments: payments.deletedCount,
        bills: bills.deletedCount,
        summary: summary.deletedCount,
        assignment: assignment.deletedCount,
        gasCylinders: gas.deletedCount,
        riceBags: rice.deletedCount,
      }
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/close-month/:month/:year', async (req, res) => {
  try {
    const { month, year } = req.params;
    const reopen = req.body?.reopen;
    const summary = await MonthlySummary.findOneAndUpdate(
      { month, year },
      reopen
        ? { isClosed: false, closedBy: null, closedAt: null }
        : { isClosed: true, isOpen: false, closedBy: req.user._id, closedAt: new Date() },
      { new: true, upsert: true }
    );
    if (!reopen) {
      const assignment = await MonthAssignment.findOne({ month, year });
      if (assignment) await User.findByIdAndUpdate(assignment.managerId, { role: 'member' });
    }
    res.json(summary);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Open a month for manager access
router.post('/open-month/:month/:year', async (req, res) => {
  try {
    const { month, year } = req.params;
    const { managerId } = req.body;
    // upsert summary with isOpen=true
    const summary = await MonthlySummary.findOneAndUpdate(
      { month, year },
      { isOpen: true, isClosed: false, openedAt: new Date() },
      { new: true, upsert: true }
    );
    // assign manager if provided
    if (managerId) {
      const existing = await MonthAssignment.findOne({ month, year });
      if (existing) {
        await User.findByIdAndUpdate(existing.managerId, { role: 'member' });
        await MonthAssignment.findByIdAndUpdate(existing._id, { managerId, assignedBy: req.user._id, assignedAt: new Date() });
      } else {
        await MonthAssignment.create({ month, year, managerId, assignedBy: req.user._id });
      }
      await User.findByIdAndUpdate(managerId, { role: 'manager' });
    }
    res.json(summary);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get all months with their status (for admin months page)
router.get('/months', async (req, res) => {
  try {
    const summaries = await MonthlySummary.find().sort({ year: -1, month: -1 });
    const assignments = await MonthAssignment.find().populate('managerId', 'name');
    const months = summaries.map(s => {
      const a = assignments.find(a => a.month === s.month && a.year === s.year);
      return { month: s.month, year: s.year, isOpen: s.isOpen, isClosed: s.isClosed, openedAt: s.openedAt, closedAt: s.closedAt, manager: a?.managerId || null };
    });
    res.json(months);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get open months for manager (used by manager to know which months they can edit)
router.get('/active-months', async (req, res) => {
  try {
    const summaries = await MonthlySummary.find({ isOpen: true, isClosed: false }).sort({ year: -1, month: -1 });
    res.json(summaries.map(s => ({ month: s.month, year: s.year })));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
