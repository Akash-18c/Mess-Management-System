const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', process.env.FRONTEND_URL].filter(Boolean),
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/members', require('./routes/members'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/meals', require('./routes/meals'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/bills', require('./routes/bills'));
app.use('/api/member', require('./routes/member'));
app.use('/api/summary', require('./routes/summary'));
app.use('/api/gas', require('./routes/gas'));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected');
    await seedAdmin();
    await seedCategories();
    app.listen(process.env.PORT || 5000, () =>
      console.log(`Server running on port ${process.env.PORT || 5000}`)
    );
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
