const mongoose = require('mongoose');

const mealSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  breakfast: { type: Boolean, default: false },
  lunch: { type: Boolean, default: false },
  dinner: { type: Boolean, default: false },
  isOff: { type: Boolean, default: false },
  guestMeals: { type: Number, default: 0 },
}, { timestamps: true });

mealSchema.index({ date: 1, memberId: 1 }, { unique: true });

module.exports = mongoose.model('Meal', mealSchema);
