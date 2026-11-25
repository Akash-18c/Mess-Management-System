const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  message:   { type: String, required: true },
  category:  { type: String, default: 'general' },
  actorName: { type: String, default: '' },
  actorRole: { type: String, default: 'manager' },
  readBy:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  month:     { type: Number, required: true },
  year:      { type: Number, required: true },
  expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
