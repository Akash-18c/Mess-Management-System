const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  mealCount: { type: Number, default: 0 },
  breakfastCount: { type: Number, default: 0 },
  lunchCount: { type: Number, default: 0 },
  dinnerCount: { type: Number, default: 0 },
  mealRate: { type: Number, default: 0 },
  guestMeals: { type: Number, default: 0 },
  guestCharge: { type: Number, default: 0 },
  otherCharges: { type: Number, default: 0 },
  advance: { type: Number, default: 0 },
  masiSalary: { type: Number, default: 0 },
  totalBill: { type: Number, default: 0 },
  dueAmount: { type: Number, default: 0 },
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

billSchema.index({ memberId: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Bill', billSchema);
