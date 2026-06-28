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

  const paidOthers = allOthers.filter(o => o.status === 'Paid');
  const paidGas  = paidOthers.filter(o => o.categoryName === 'Gas Cylinder');
  const paidRice = paidOthers.filter(o => o.categoryName === 'Rice Bag');
  const paidOtherOnly = paidOthers.filter(o => o.categoryName !== 'Gas Cylinder' && o.categoryName !== 'Rice Bag');

  const groceryTotal    = parseFloat(groceries.reduce((s, e) => s + e.total, 0).toFixed(2));
  const otherTotal      = parseFloat(allOthers.reduce((s, e) => s + e.amount, 0).toFixed(2));
  const otherPaidTotal  = parseFloat(paidOthers.reduce((s, e) => s + e.amount, 0).toFixed(2));
  const gasPaidTotal    = parseFloat(paidGas.reduce((s, e) => s + e.amount, 0).toFixed(2));
  const ricePaidTotal   = parseFloat(paidRice.reduce((s, e) => s + e.amount, 0).toFixed(2));
  const otherOnlyPaid   = parseFloat(paidOtherOnly.reduce((s, e) => s + e.amount, 0).toFixed(2));

  // mealRate includes grocery + paid rice bag — rice bag folded into grocery pool
  const grandTotal = parseFloat((groceryTotal + ricePaidTotal).toFixed(2));

  let totalMeals = 0;
  meals.forEach((m) => {
    if (m.lunch)  totalMeals++;
    if (m.dinner) totalMeals++;
    totalMeals += m.guestMeals || 0;
  });

  const mealRate = totalMeals > 0 ? parseFloat((grandTotal / totalMeals).toFixed(2)) : 0;
  const gasPerMember        = activeMembers > 0 ? parseFloat((gasPaidTotal  / activeMembers).toFixed(2)) : 0;
  const ricePerMember       = 0; // folded into mealRate via grandTotal
  const otherPaidPerMember  = activeMembers > 0 ? parseFloat((otherOnlyPaid / activeMembers).toFixed(2)) : 0;

  const totalCollected = parseFloat(payments.reduce((s, p) => s + p.amount, 0).toFixed(2));
  const messBalance = parseFloat((totalCollected - groceryTotal - otherPaidTotal).toFixed(2));

  await MonthlySummary.findOneAndUpdate(
    { month, year },
    { groceryTotal, otherTotal, otherPaidTotal, otherPaidPerMember, gasPaidTotal, gasPerMember, ricePaidTotal, ricePerMember, grandTotal, totalMeals, mealRate, totalCollected, messBalance },
    { upsert: true, new: true }
  );
}

module.exports = { recalcSummary };
