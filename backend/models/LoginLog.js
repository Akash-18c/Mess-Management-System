const mongoose = require('mongoose');

const loginLogSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:     { type: String, required: true },
  role:     { type: String, required: true },
  loginAt:  { type: Date, default: Date.now },
  logoutAt: { type: Date, default: null },
  duration: { type: Number, default: null }, // seconds
}, { timestamps: false });

module.exports = mongoose.model('LoginLog', loginLogSchema);
