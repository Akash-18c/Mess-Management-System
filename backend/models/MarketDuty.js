const mongoose = require('mongoose');

const marketDutySchema = new mongoose.Schema({
  memberId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dayOfWeek: { type: Number, required: true }, // 0=Sun,1=Mon,...,6=Sat
  meal:      { type: String, enum: ['lunch', 'dinner'], required: true },
  time:      { type: String, required: true }, // HH:MM 24h e.g. "08:00"
  note:      { type: String, default: '' },
  isActive:  { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('MarketDuty', marketDutySchema);
