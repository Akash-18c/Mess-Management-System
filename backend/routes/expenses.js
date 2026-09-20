const express = require('express');
const GroceryExpense = require('../models/GroceryExpense');
const OtherExpense = require('../models/OtherExpense');
const OtherCharge = require('../models/OtherCharge');
const MessNotice = require('../models/MessNotice');
const { auth, requireRole } = require('../middleware/auth');
const { recalcSummary } = require('../controllers/summaryController');

const router = express.Router();
router.use(auth);

// Hardcoded other expense categories — no DB lookup needed
router.get('/categories', (req, res) => {
  res.json([
    { _id: 'gas', name: 'Gas Cylinder', type: 'other' },
    { _id: 'rice', name: 'Rice Bag', type: 'other' },
    { _id: 'other', name: 'Other', type: 'other' },
  ]);
});

// --- Grocery ---
router.get('/grocery/:month/:year', async (req, res) => {
  try {
    const items = await GroceryExpense.find({ month: req.params.month, year: req.params.year }).sort({ date: -1 }).lean();
    res.json(items);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/grocery', requireRole('manager', 'admin'), async (req, res) => {
  try {
    const { item, quantity, unitPrice, unit, date, buyerName, meal, month, year } = req.body;
    const qty = parseFloat(quantity);
    const price = parseFloat(unitPrice);
    const total = !isNaN(qty) ? parseFloat((qty * price).toFixed(2)) : parseFloat(price.toFixed(2));
    const expense = await GroceryExpense.create({ item, ...(qty ? { quantity: qty } : {}), unitPrice: price, unit, meal: meal || '', date, buyerName, total, month, year, addedBy: req.user._id });
    await recalcSummary(month, year);
    res.status(201).json(expense);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.put('/grocery/:id', requireRole('manager', 'admin'), async (req, res) => {
  try {
    const { quantity, unitPrice } = req.body;
    if (quantity && unitPrice) req.body.total = parseFloat((quantity * unitPrice).toFixed(2));
    const expense = await GroceryExpense.findByIdAndUpdate(req.params.id, req.body, { new: true });
    await recalcSummary(expense.month, expense.year);
    res.json(expense);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete('/grocery/:id', requireRole('manager', 'admin'), async (req, res) => {
  try {
    const expense = await GroceryExpense.findByIdAndDelete(req.params.id);
    if (expense) await recalcSummary(expense.month, expense.year);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- Other Expenses ---
router.get('/other/:month/:year', async (req, res) => {
  try {
    const items = await OtherExpense.find({ month: req.params.month, year: req.params.year }).sort({ date: -1 }).lean();
    res.json(items);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/other', requireRole('manager', 'admin'), async (req, res) => {
  try {
    const { categoryName, description, amount, date, paidBy, note, status, month, year } = req.body;
    const expense = await OtherExpense.create({ categoryName, description, amount, date, paidBy, note, status, month, year, addedBy: req.user._id });
    await recalcSummary(month, year);
    res.status(201).json(expense);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.put('/other/:id', requireRole('manager', 'admin'), async (req, res) => {
  try {
    const expense = await OtherExpense.findByIdAndUpdate(req.params.id, req.body, { new: true });
    await recalcSummary(expense.month, expense.year);
    res.json(expense);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete('/other/:id', requireRole('manager', 'admin'), async (req, res) => {
  try {
    const expense = await OtherExpense.findByIdAndDelete(req.params.id);
    if (expense) await recalcSummary(expense.month, expense.year);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- Other Charges (per-member individual charges) ---
// IMPORTANT: 'my' route MUST be before '/:month/:year' to avoid Express matching 'my' as :month
router.get('/charges/my/:month/:year', async (req, res) => {
  try {
    const items = await OtherCharge.find({ memberId: req.user._id, month: req.params.month, year: req.params.year }).sort({ date: 1 }).lean();
    res.json(items);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/charges/:month/:year', requireRole('manager', 'admin'), async (req, res) => {
  try {
    const items = await OtherCharge.find({ month: req.params.month, year: req.params.year })
      .populate('memberId', 'name room')
      .sort({ date: 1 });
    res.json(items);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/charges', requireRole('manager', 'admin'), async (req, res) => {
  try {
    const { memberId, month, year, reason, amount, date } = req.body;
    const charge = await OtherCharge.create({ memberId, month, year, reason, amount: +amount, date, addedBy: req.user._id });
    res.status(201).json(charge);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.put('/charges/:id', requireRole('manager', 'admin'), async (req, res) => {
  try {
    const charge = await OtherCharge.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(charge);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete('/charges/:id', requireRole('manager', 'admin'), async (req, res) => {
  try {
    await OtherCharge.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- Mess Notice (mandatory meal message) ---
// All roles can read
router.get('/notice/:month/:year', async (req, res) => {
  try {
    const notice = await MessNotice.findOne({ month: req.params.month, year: req.params.year }).lean();
    res.json(notice || null);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Manager/admin can set (upsert)
router.post('/notice', requireRole('manager', 'admin'), async (req, res) => {
  try {
    const { month, year, message } = req.body;
    if (!message?.trim()) return res.status(400).json({ message: 'Message is required' });
    const notice = await MessNotice.findOneAndUpdate(
      { month, year },
      { message: message.trim(), setBy: req.user._id },
      { upsert: true, new: true }
    );
    res.json(notice);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// Manager/admin can delete
router.delete('/notice/:month/:year', requireRole('manager', 'admin'), async (req, res) => {
  try {
    await MessNotice.deleteOne({ month: req.params.month, year: req.params.year });
    res.json({ message: 'Notice removed' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
