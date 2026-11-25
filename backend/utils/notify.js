const Notification = require('../models/Notification');

/**
 * Push a notification — only for manager/member actions, never admin.
 * @param {object} opts
 * @param {object} user   - req.user (must have role, name)
 * @param {string} message
 * @param {string} category  - meal | expense | payment | bill | notice | general
 * @param {number} [month]
 * @param {number} [year]
 */
async function pushNotification({ user, message, category = 'general', month, year }) {
  if (!user || user.role === 'admin') return; // admin actions are silent
  try {
    const rn = (name) => { const m = name?.match(/^\w+\s*\((.+)\)$/); return m ? m[1] : (name || ''); };
    await Notification.create({
      message,
      category,
      actorName: rn(user.name),
      actorRole: user.role,
      month,
      year,
    });
    // Keep only latest 100
    const count = await Notification.countDocuments();
    if (count > 100) {
      const oldest = await Notification.find().sort({ createdAt: 1 }).limit(count - 100).select('_id');
      await Notification.deleteMany({ _id: { $in: oldest.map(o => o._id) } });
    }
  } catch { /* non-critical */ }
}

module.exports = { pushNotification };
