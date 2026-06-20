const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// ── Security headers (fixes browser "dangerous site" warnings) ──
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https://mess-management-system-fwy8.onrender.com;"
  );
  next();
});

const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://mess-management-system-fwy8.onrender.com',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json());

// ── API Routes ──
app.use('/api/auth',    require('./routes/auth'));
app.use('/api/members', require('./routes/members'));
app.use('/api/admin',   require('./routes/admin'));
app.use('/api/expenses',require('./routes/expenses'));
app.use('/api/meals',   require('./routes/meals'));
app.use('/api/payments',require('./routes/payments'));
app.use('/api/bills',   require('./routes/bills'));
app.use('/api/member',  require('./routes/member'));
app.use('/api/summary', require('./routes/summary'));
app.use('/api/gas',     require('./routes/gas'));

// ── Health / keep-alive ping ──
app.get('/health', (req, res) => res.json({ status: 'ok', ts: Date.now() }));

// ── Serve React build in production ──
const buildPath = path.join(__dirname, '../frontend/build');
app.use(express.static(buildPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected');
    await seedAdmin();
    await seedCategories();
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error('MongoDB error:', err));

async function seedAdmin() {
  const User = require('./models/User');
  const bcrypt = require('bcryptjs');
  const hashed = await bcrypt.hash('admin123', 10);
  await User.findOneAndUpdate(
    { role: 'admin' },
    {
      name: 'Admin (Akash Chakraborty)',
      email: 'admin@mess.com',
      password: hashed,
      phone: '0000000000',
      room: 'N/A',
      role: 'admin',
      isActive: true,
      joinDate: new Date(),
    },
    { upsert: true, new: true }
  );
  console.log('Admin ready: admin@mess.com / admin123');
}

async function seedCategories() {
  const ExpenseCategory = require('./models/ExpenseCategory');
  const defaults = ['Rice Bag', 'Gas Cylinder', 'Fuel', 'Utensils', 'Maintenance', 'Miscellaneous', 'Internet', 'Water', 'Electricity'];
  for (const name of defaults) {
    await ExpenseCategory.findOneAndUpdate(
      { name },
      { name, type: 'other', isActive: true },
      { upsert: true }
    );
  }
  console.log('Default categories ready');
}
