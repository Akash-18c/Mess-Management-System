const express = require('express');
const User = require('../models/User');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(auth, requireRole('admin', 'manager'));

router.get('/', async (req, res) => {
  try {
    const members = await User.find({ isActive: true })
      .select('-password')
      .sort({ name: 1 });
    res.json(members);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
