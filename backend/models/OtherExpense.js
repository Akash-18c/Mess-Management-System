const mongoose = require('mongoose');

const otherExpenseSchema = new mongoose.Schema({
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'ExpenseCategory' },
  categoryName: { type: String, default: '' },
  description: { type: String, default: '' },
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  paidBy: { type: String, default: '' },
  note: { type: String, default: '' },
  status: { type: String, enum: ['Paid', 'Due'], default: 'Due' },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('OtherExpense', otherExpenseSchema);
