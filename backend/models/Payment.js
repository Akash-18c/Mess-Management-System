const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  method: { type: String, enum: ['Cash', 'UPI', 'Bank'], default: 'Cash' },
  note: { type: String, default: '' },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
