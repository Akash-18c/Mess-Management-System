const mongoose = require('mongoose');

const groceryExpenseSchema = new mongoose.Schema({
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  item: { type: String, required: true },
  quantity: { type: Number },
  unit: { type: String, default: '' },
  unitPrice: { type: Number, required: true },
  total: { type: Number, required: true },
  meal: { type: String, enum: ['Lunch', 'Dinner', ''], default: '' },
  date: { type: Date, required: true },
  buyerName: { type: String, default: '' },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

groceryExpenseSchema.index({ month: 1, year: 1 });

module.exports = mongoose.model('GroceryExpense', groceryExpenseSchema);
