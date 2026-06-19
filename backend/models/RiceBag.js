const mongoose = require('mongoose');

const riceBagSchema = new mongoose.Schema({
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  date: { type: Date, required: true },
  price: { type: Number, required: true },
  description: { type: String, default: '' },
  status: { type: String, enum: ['Paid', 'Due'], default: 'Due' },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('RiceBag', riceBagSchema);
