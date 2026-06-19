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
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
