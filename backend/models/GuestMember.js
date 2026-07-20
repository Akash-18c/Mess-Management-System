const mongoose = require('mongoose');

const mealEntrySchema = new mongoose.Schema({
  date:       { type: String, required: true },
  lunch:      { type: Boolean, default: false },
  dinner:     { type: Boolean, default: false },
  customRate: { type: Number, default: 0 },
  charge:     { type: Number, default: 0 },
}, { _id: true });

const guestMemberSchema = new mongoose.Schema({
  name:       { type: String, required: true, trim: true },
  phone:      { type: String, default: '' },
  note:       { type: String, default: '' },
  mealRate:   { type: Number, default: 0 },
  meals:      [mealEntrySchema],
  month:      { type: Number, required: true },
  year:       { type: Number, required: true },
  createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('GuestMember', guestMemberSchema);
