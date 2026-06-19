const GroceryExpense = require('../models/GroceryExpense');
const OtherExpense = require('../models/OtherExpense');
const Meal = require('../models/Meal');
const MonthlySummary = require('../models/MonthlySummary');
const Payment = require('../models/Payment');

async function recalcSummary(month, year) {
  const groceries = await GroceryExpense.find({ month, year });
  const others = await OtherExpense.find({ month, year, status: 'Paid' }); // Only PAID other expenses affect balance
  const allOthers = await OtherExpense.find({ month, year });               // All for otherTotal display
  const meals = await Meal.find({ month, year, isOff: false });
  const payments = await Payment.find({ month, year });

  const groceryTotal = parseFloat(groceries.reduce((s, e) => s + e.total, 0).toFixed(2));
  const otherPaidTotal = parseFloat(others.reduce((s, e) => s + e.amount, 0).toFixed(2));
  const otherTotal = parseFloat(allOthers.reduce((s, e) => s + e.amount, 0).toFixed(2)); // shown in UI
  const grandTotal = parseFloat((groceryTotal + otherPaidTotal).toFixed(2)); // only paid counts toward cost

  let totalMeals = 0;
  meals.forEach((m) => {
    if (m.lunch) totalMeals++;
    if (m.dinner) totalMeals++;
    totalMeals += m.guestMeals || 0;
  });

  const mealRate = totalMeals > 0 ? parseFloat((grandTotal / totalMeals).toFixed(2)) : 0;
  const totalCollected = parseFloat(payments.reduce((s, p) => s + p.amount, 0).toFixed(2));
  const messBalance = parseFloat((totalCollected - grandTotal).toFixed(2));

  await MonthlySummary.findOneAndUpdate(
    { month, year },
    { groceryTotal, otherTotal, grandTotal, totalMeals, mealRate, totalCollected, messBalance },
    { upsert: true, new: true }
  );
}

module.exports = { recalcSummary };
