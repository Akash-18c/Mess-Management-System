const mongoose = require('mongoose');

const masiSalarySchema = new mongoose.Schema({
  month:            { type: Number, required: true },
  year:             { type: Number, required: true },
  totalAmount:      { type: Number, required: true, default: 0 },
  perMemberAmount:  { type: Number, default: 0 },
  memberCount:      { type: Number, default: 0 },
  setBy:            { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

masiSalarySchema.index({ month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('MasiSalary', masiSalarySchema);
