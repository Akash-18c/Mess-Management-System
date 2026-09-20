const mongoose = require('mongoose');

const messNoticeSchema = new mongoose.Schema({
  month:     { type: Number, required: true },
  year:      { type: Number, required: true },
  message:   { type: String, required: true, trim: true },
  setBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

messNoticeSchema.index({ month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('MessNotice', messNoticeSchema);
