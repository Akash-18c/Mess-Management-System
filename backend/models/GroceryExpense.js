const mongoose = require('mongoose');

const groceryExpenseSchema = new mongoose.Schema({
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  item: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, default: 'kg' },
  unitPrice: { type: Number, required: true },
  total: { type: Number, required: true },
  date: { type: Date, required: true },
  buyerName: { type: String, default: '' },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('GroceryExpense', groceryExpenseSchema);
