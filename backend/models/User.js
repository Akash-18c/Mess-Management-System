const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  phone: { type: String, default: '' },
  room: { type: String, default: '' },
  role: { type: String, enum: ['admin', 'manager', 'member'], default: 'member' },
  isActive: { type: Boolean, default: true },
  joinDate: { type: Date, default: Date.now },
  birthday: { type: String, default: '' }, // stored as 'MM-DD' e.g. '07-15'
  plainPassword: { type: String, default: '' },
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpiry: { type: Date, default: null },
  googleId: { type: String, default: null },
  isApproved: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
