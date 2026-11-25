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
  if (!user || user.role === 'admin') return; // admin actions are always silent
  try {
    const rn = (name) => { const m = name?.match(/^\w+\s*\((.+)\)$/); return m ? m[1] : (name || ''); };
    const now = new Date();
    const m = month || (now.getMonth() + 1);
    const y = year  || now.getFullYear();
    // expiresAt = first moment of next month (MongoDB TTL will delete then)
    const expiresAt = new Date(y, m, 1, 0, 0, 0); // month is 0-indexed in Date constructor, so m = next month
    await Notification.create({
      message,
      category,
      actorName: rn(user.name),
      actorRole: user.role,
      month: m,
      year: y,
      expiresAt,
    });
  } catch { /* non-critical */ }
}

module.exports = { pushNotification };
