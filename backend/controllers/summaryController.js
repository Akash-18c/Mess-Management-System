const GroceryExpense = require('../models/GroceryExpense');
const OtherExpense = require('../models/OtherExpense');
const Meal = require('../models/Meal');
const MonthlySummary = require('../models/MonthlySummary');
const Payment = require('../models/Payment');
const User = require('../models/User');

async function recalcSummary(month, year) {
  const [groceries, allOthers, meals, payments, activeMembers] = await Promise.all([
    GroceryExpense.find({ month, year }),
    OtherExpense.find({ month, year }),
    Meal.find({ month, year, isOff: false }),
    Payment.find({ month, year }),
    User.countDocuments({ isActive: true }),
  ]);

  const paidOthers    = allOthers.filter(o => o.status === 'Paid');
  const dueOthers     = allOthers.filter(o => o.status !== 'Paid');

  const paidGas       = paidOthers.filter(o => o.categoryName === 'Gas Cylinder');
  const dueGas        = dueOthers.filter(o => o.categoryName === 'Gas Cylinder');
  const paidRice      = paidOthers.filter(o => o.categoryName === 'Rice Bag');
  const dueRice       = dueOthers.filter(o => o.categoryName === 'Rice Bag');
  const paidOtherOnly = paidOthers.filter(o => o.categoryName !== 'Gas Cylinder' && o.categoryName !== 'Rice Bag');
  const dueOtherOnly  = dueOthers.filter(o => o.categoryName !== 'Gas Cylinder' && o.categoryName !== 'Rice Bag');

  const groceryTotal   = parseFloat(groceries.reduce((s, e) => s + e.total, 0).toFixed(2));
  const otherTotal     = parseFloat(allOthers.reduce((s, e) => s + e.amount, 0).toFixed(2));
  const otherPaidTotal = parseFloat(paidOthers.reduce((s, e) => s + e.amount, 0).toFixed(2));
  const gasPaidTotal   = parseFloat(paidGas.reduce((s, e) => s + e.amount, 0).toFixed(2));
  const gasAllTotal    = parseFloat([...paidGas, ...dueGas].reduce((s, e) => s + e.amount, 0).toFixed(2));
  const ricePaidTotal  = parseFloat(paidRice.reduce((s, e) => s + e.amount, 0).toFixed(2));
  const riceDueTotal   = parseFloat(dueRice.reduce((s, e) => s + e.amount, 0).toFixed(2));
  const otherOnlyPaid  = parseFloat(paidOtherOnly.reduce((s, e) => s + e.amount, 0).toFixed(2));
  const otherOnlyDue   = parseFloat(dueOtherOnly.reduce((s, e) => s + e.amount, 0).toFixed(2));

  // grandTotal = grocery + paid gas + paid rice + paid other — Total Spent display (paid only)
  const grandTotal = parseFloat((groceryTotal + gasPaidTotal + ricePaidTotal + otherOnlyPaid).toFixed(2));

  // mealBaseTotal includes ALL rice + other (paid + due) so due expenses reflected in mealRate
  const mealBaseTotal = parseFloat((groceryTotal + ricePaidTotal + riceDueTotal + otherOnlyPaid + otherOnlyDue).toFixed(2));

  // otherAllPerMember includes due so bills reflect full cost
  const otherAllPerMember = activeMembers > 0 ? parseFloat(((otherOnlyPaid + otherOnlyDue) / activeMembers).toFixed(2)) : 0;

  let totalMeals = 0;
  meals.forEach((m) => {
    if (m.lunch)  totalMeals++;
    if (m.dinner) totalMeals++;
    totalMeals += m.guestMeals || 0;
  });

  const mealRate = totalMeals > 0 ? parseFloat((mealBaseTotal / totalMeals).toFixed(2)) : 0;
  const gasPerMember        = activeMembers > 0 ? parseFloat((gasAllTotal / activeMembers).toFixed(2)) : 0;
  const ricePerMember       = 0;
  const otherPaidPerMember  = otherAllPerMember; // includes due expenses so bills are accurate

  const totalCollected = parseFloat(payments.reduce((s, p) => s + p.amount, 0).toFixed(2));
  const messBalance = parseFloat((totalCollected - grandTotal).toFixed(2));

  await MonthlySummary.findOneAndUpdate(
    { month, year },
    { groceryTotal, otherTotal, otherPaidTotal, otherPaidPerMember, gasPaidTotal, gasPerMember, ricePaidTotal, ricePerMember, grandTotal, totalMeals, mealRate, totalCollected, messBalance },
    { upsert: true, new: true }
  );
}

module.exports = { recalcSummary };
