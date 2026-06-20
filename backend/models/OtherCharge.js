const mongoose = require('mongoose');

const otherChargeSchema = new mongoose.Schema({
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  month:    { type: Number, required: true },
  year:     { type: Number, required: true },
  reason:   { type: String, required: true },
  amount:   { type: Number, required: true },
  date:     { type: Date,   required: true },
  addedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('OtherCharge', otherChargeSchema);
