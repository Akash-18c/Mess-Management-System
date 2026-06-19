# MessKit — Mess Meal Management System

🚀 **Live Demo:** [https://mess-management-system-fwy8.onrender.com](https://mess-management-system-fwy8.onrender.com)

## Tech Stack
- **Frontend:** React.js + Tailwind CSS + Recharts
- **Backend:** Node.js + Express.js
- **Database:** MongoDB
- **Auth:** JWT (role-based)

## 3-Tier Roles
| Role | Access |
|------|--------|
| 🔴 Admin | Full platform control |
| 🟡 Manager | Assigned monthly — meals, expenses, payments, bills |
| 🟢 Member | View own data, mark off days |

## Quick Start

### Prerequisites
- Node.js v18+
- MongoDB running locally on port 27017

### Backend
```bash
cd backend
npm install
npm run dev
```
Backend runs on `http://localhost:5000`

### Frontend
```bash
cd frontend
npm install
npm start
```
Frontend runs on `http://localhost:3000`

## First-Time Setup
1. Start MongoDB
2. Start backend — admin is auto-seeded
3. Start frontend
4. Login as admin
5. Go to **Categories** → Click "Seed Defaults" to add expense categories
6. Go to **Members** → Add members
7. Go to **Assignments** → Assign a manager for the current month
8. The assigned member can now login as Manager

## Business Rules
- One manager per month; reassignable while month is open
- Meal Rate = (Grocery + Other Expenses) ÷ Total Meals
- Bill = Meal Count × Rate + Guest Charges
- Due = Bill − Advance Paid
- Closing a month locks all data permanently
