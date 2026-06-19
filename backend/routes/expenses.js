const express = require('express');
const GroceryExpense = require('../models/GroceryExpense');
const OtherExpense = require('../models/OtherExpense');
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
    const items = await GroceryExpense.find({ month: req.params.month, year: req.params.year }).sort({ date: -1 });
    res.json(items);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/grocery', requireRole('manager', 'admin'), async (req, res) => {
  try {
    const { item, quantity, unitPrice, unit, date, buyerName, month, year } = req.body;
    const total = parseFloat((quantity * unitPrice).toFixed(2));
    const expense = await GroceryExpense.create({ item, quantity, unitPrice, unit, date, buyerName, total, month, year, addedBy: req.user._id });
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
    const items = await OtherExpense.find({ month: req.params.month, year: req.params.year }).sort({ date: -1 });
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

module.exports = router;
