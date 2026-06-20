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

  const groceryTotal    = parseFloat(groceries.reduce((s, e) => s + e.total, 0).toFixed(2));
  const otherTotal      = parseFloat(allOthers.reduce((s, e) => s + e.amount, 0).toFixed(2));
  const otherPaidTotal  = parseFloat(paidOthers.reduce((s, e) => s + e.amount, 0).toFixed(2));

  // mealRate is based on grocery ONLY — other expenses split separately per member
  const grandTotal = groceryTotal;

  let totalMeals = 0;
  meals.forEach((m) => {
    if (m.lunch)  totalMeals++;
    if (m.dinner) totalMeals++;
    totalMeals += m.guestMeals || 0;
  });

  const mealRate = totalMeals > 0 ? parseFloat((grandTotal / totalMeals).toFixed(2)) : 0;
  const otherPaidPerMember = activeMembers > 0 ? parseFloat((otherPaidTotal / activeMembers).toFixed(2)) : 0;

  const totalCollected = parseFloat(payments.reduce((s, p) => s + p.amount, 0).toFixed(2));
  // messBalance accounts for both grocery + paid other expenses
  const messBalance = parseFloat((totalCollected - groceryTotal - otherPaidTotal).toFixed(2));

  await MonthlySummary.findOneAndUpdate(
    { month, year },
    { groceryTotal, otherTotal, otherPaidTotal, otherPaidPerMember, grandTotal, totalMeals, mealRate, totalCollected, messBalance },
    { upsert: true, new: true }
  );
}

module.exports = { recalcSummary };
