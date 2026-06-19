const mongoose = require('mongoose');

const monthAssignmentSchema = new mongoose.Schema({
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedAt: { type: Date, default: Date.now },
}, { timestamps: true });

monthAssignmentSchema.index({ month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('MonthAssignment', monthAssignmentSchema);
