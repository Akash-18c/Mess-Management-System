const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');

dotenv.config();

const app = express();

// ── Gzip compression ──
app.use(compression());

// ── Security headers ──
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'blob:'],
      fontSrc: ["'self'", 'data:'],
      connectSrc: ["'self'", 'https://mess-management-system-fwy8.onrender.com'],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// ── Rate limiting on auth routes ──
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { message: 'Too many requests, try again later' } });
app.use('/api/auth', authLimiter);

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
app.use('/api/borrow',  require('./routes/borrow'));
app.use('/api/borrows',  require('./routes/borrows'));
app.use('/api/guests',   require('./routes/guests'));

// ── Health / keep-alive ping ──
app.get('/health', (req, res) => res.json({ status: 'ok', ts: Date.now() }));

// ── Self-ping every 14 min to prevent Render cold start ──
setInterval(() => {
  const url = process.env.RENDER_EXTERNAL_URL || `http://localhost:${process.env.PORT || 5000}`;
  require('https').get(`${url}/health`, () => {}).on('error', () => {});
}, 14 * 60 * 1000);

// ── Serve React build in production ──
const buildPath = path.join(__dirname, '../frontend/build');
app.use(express.static(buildPath, {
  maxAge: '1y',
  etag: true,
  setHeaders: (res, filePath) => {
    // Don't cache index.html so new deploys are picked up immediately
    if (filePath.endsWith('index.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  },
}));
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
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`)).on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ Port ${PORT} is already in use.\n   Run: netstat -ano | findstr :${PORT}  → then: taskkill /PID <pid> /F\n`);
        process.exit(1);
      } else throw err;
    });
  })
  .catch((err) => console.error('MongoDB error:', err));

async function seedAdmin() {
  const User = require('./models/User');
  const bcrypt = require('bcryptjs');
  // Only create admin if not exists — never overwrite password on restart
  const existing = await User.findOne({ role: 'admin' });
  if (!existing) {
    const hashed = await bcrypt.hash('Akash@1805x', 10);
    await User.create({
      name: 'Admin (Akash Chakraborty)',
      email: 'akashranaa188@gmail.com',
      password: hashed,
      plainPassword: 'Akash@1805x',
      phone: '9907737323',
      room: 'N/A',
      role: 'admin',
      isActive: true,
      isApproved: true,
      joinDate: new Date(),
    });
    console.log('Admin created: akashranaa188@gmail.com / Akash@1805x');
  } else {
    // Ensure admin is always active and approved
    await User.findByIdAndUpdate(existing._id, { isActive: true, isApproved: true });
    console.log('Admin ready:', existing.email);
  }
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
