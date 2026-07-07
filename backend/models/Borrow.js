const mongoose = require('mongoose');

const borrowSchema = new mongoose.Schema({
  memberId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount:      { type: Number, required: true },
  reason:      { type: String, default: '' },
  date:        { type: Date, required: true },
  returned:    { type: Boolean, default: false },
  returnedAt:  { type: Date },
  addedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Borrow', borrowSchema);
