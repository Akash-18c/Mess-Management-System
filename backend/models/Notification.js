const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  message:   { type: String, required: true },
  category:  { type: String, default: 'general' }, // meal | expense | payment | bill | notice | general
  actorName: { type: String, default: '' },         // display name of who did it
  actorRole: { type: String, default: 'manager' },  // manager | member
  readBy:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  month:     { type: Number },
  year:      { type: Number },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
