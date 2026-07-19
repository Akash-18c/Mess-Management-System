const mongoose = require('mongoose');

const monthlySummarySchema = new mongoose.Schema({
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  groceryTotal: { type: Number, default: 0 },
  otherTotal: { type: Number, default: 0 },
  otherPaidTotal: { type: Number, default: 0 },
  otherPaidPerMember: { type: Number, default: 0 },
  gasPaidTotal: { type: Number, default: 0 },
  gasPerMember: { type: Number, default: 0 },
  ricePaidTotal: { type: Number, default: 0 },
  ricePerMember: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },
  totalMeals: { type: Number, default: 0 },
  mealRate: { type: Number, default: 0 },
  totalCollected: { type: Number, default: 0 },
  messBalance: { type: Number, default: 0 },
  startDate: { type: String, default: null },
  endDate: { type: String, default: null },
  isOpen: { type: Boolean, default: false },
  openedAt: { type: Date, default: null },
  isClosed: { type: Boolean, default: false },
  closedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  closedAt: { type: Date, default: null },
}, { timestamps: true });

monthlySummarySchema.index({ month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('MonthlySummary', monthlySummarySchema);
