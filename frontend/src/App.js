import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';
import Login from './pages/Login';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminMembers from './pages/admin/AdminMembers';
import AdminAssignments from './pages/admin/AdminAssignments';
import AdminReports from './pages/admin/AdminReports';
import AdminMonths from './pages/admin/AdminMonths';
import AdminMasiSalary from './pages/admin/AdminMasiSalary';
import AdminPurge from './pages/admin/AdminPurge';
import AdminExpensesHistory from './pages/admin/AdminExpensesHistory';
import ManagerLayout from './pages/manager/ManagerLayout';
import ManagerDashboard from './pages/manager/ManagerDashboard';
import ManagerMeals from './pages/manager/ManagerMeals';
import ManagerExpenses from './pages/manager/ManagerExpenses';
import ManagerPayments from './pages/manager/ManagerPayments';
import ManagerBills from './pages/manager/ManagerBills';
import ManagerOtherCharges from './pages/manager/ManagerOtherCharges';
import MemberLayout from './pages/member/MemberLayout';
import MemberDashboard from './pages/member/MemberDashboard';
import MemberHistory from './pages/member/MemberHistory';
import MemberExpensesHistory from './pages/member/MemberExpensesHistory';
import MemberMeals from './pages/member/MemberMeals';

function ProtectedRoute({ children, roles }) {
  const { user, token } = useAuthStore();
  if (!token || !user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/login" replace />;
  return children;
}

function RoleRedirect() {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'manager') return <Navigate to="/manager" replace />;
  return <Navigate to="/member" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        containerStyle={{ top: 16 }}
        toastOptions={{
          style: {
            background: '#1E293B', color: '#fff', border: '1px solid #334155',
            whiteSpace: 'nowrap', maxWidth: '90vw', padding: '10px 16px',
            fontSize: '13px', lineHeight: '1',
          },
          duration: 3000,
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<RoleRedirect />} />

        <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="members" element={<AdminMembers />} />
          <Route path="assignments" element={<AdminAssignments />} />
          <Route path="months" element={<AdminMonths />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="masi-salary" element={<AdminMasiSalary />} />
          <Route path="expenses-history" element={<AdminExpensesHistory />} />
          <Route path="purge" element={<AdminPurge />} />
        </Route>

        <Route path="/manager" element={<ProtectedRoute roles={['manager', 'admin']}><ManagerLayout /></ProtectedRoute>}>
          <Route index element={<ManagerDashboard />} />
          <Route path="meals" element={<ManagerMeals />} />
          <Route path="expenses" element={<ManagerExpenses />} />
          <Route path="payments" element={<ManagerPayments />} />
          <Route path="bills" element={<ManagerBills />} />
          <Route path="charges" element={<ManagerOtherCharges />} />
        </Route>

        <Route path="/member" element={<ProtectedRoute roles={['member', 'manager', 'admin']}><MemberLayout /></ProtectedRoute>}>
          <Route index element={<MemberDashboard />} />
          <Route path="meals" element={<MemberMeals />} />
          <Route path="history" element={<MemberHistory />} />
          <Route path="expenses-history" element={<MemberExpensesHistory />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
