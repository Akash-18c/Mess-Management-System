import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';
import TopProgress, { startProgress, doneProgress } from './components/TopProgress';

const Login              = lazy(() => import('./pages/Login'));
const ForgotPassword     = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword      = lazy(() => import('./pages/ResetPassword'));
const PendingApproval    = lazy(() => import('./pages/PendingApproval'));
const AdminLayout        = lazy(() => import('./pages/admin/AdminLayout'));
const AdminDashboard     = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminMembers       = lazy(() => import('./pages/admin/AdminMembers'));
const AdminAssignments   = lazy(() => import('./pages/admin/AdminAssignments'));
const AdminReports       = lazy(() => import('./pages/admin/AdminReports'));
const AdminMonths        = lazy(() => import('./pages/admin/AdminMonths'));
const AdminMasiSalary    = lazy(() => import('./pages/admin/AdminMasiSalary'));
const AdminBirthdays     = lazy(() => import('./pages/admin/AdminBirthdays'));
const AdminMarketDuty    = lazy(() => import('./pages/admin/AdminMarketDuty'));
const AdminPurge         = lazy(() => import('./pages/admin/AdminPurge'));
const AdminExpensesHistory = lazy(() => import('./pages/admin/AdminExpensesHistory'));
const AdminCategories    = lazy(() => import('./pages/admin/AdminCategories'));
const AdminGuestMembers  = lazy(() => import('./pages/admin/AdminGuestMembers'));
const ManagerLayout      = lazy(() => import('./pages/manager/ManagerLayout'));
const ManagerDashboard   = lazy(() => import('./pages/manager/ManagerDashboard'));
const ManagerMeals       = lazy(() => import('./pages/manager/ManagerMeals'));
const ManagerExpenses    = lazy(() => import('./pages/manager/ManagerExpenses'));
const ManagerPayments    = lazy(() => import('./pages/manager/ManagerPayments'));
const ManagerBills       = lazy(() => import('./pages/manager/ManagerBills'));
const ManagerOtherCharges = lazy(() => import('./pages/manager/ManagerOtherCharges'));
const ManagerMarketDuty  = lazy(() => import('./pages/manager/ManagerMarketDuty'));
const ManagerBorrows     = lazy(() => import('./pages/manager/ManagerBorrows'));
const ManagerRiceBag     = lazy(() => import('./pages/manager/ManagerRiceBag'));
const ManagerGuestMembers = lazy(() => import('./pages/manager/ManagerGuestMembers'));
const MemberLayout       = lazy(() => import('./pages/member/MemberLayout'));
const MemberDashboard    = lazy(() => import('./pages/member/MemberDashboard'));
const MemberHistory      = lazy(() => import('./pages/member/MemberHistory'));
const MemberExpensesHistory = lazy(() => import('./pages/member/MemberExpensesHistory'));
const MemberMeals        = lazy(() => import('./pages/member/MemberMeals'));

// Tiny inline skeleton — just a dark screen, no spinner
// The TopProgress bar handles the visual feedback
function PageSkeleton() {
  useEffect(() => {
    startProgress();
    return () => doneProgress();
  }, []);
  return <div style={{ minHeight: '100vh', background: '#070c1a' }} />;
}

function ProtectedRoute({ children, roles }) {
  const { user, token } = useAuthStore();
  if (!token || !user) return <Navigate to="/login" replace />;
  if (user.isApproved === false) return <Navigate to="/pending-approval" replace />;
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

// Scroll to top on every route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <TopProgress />
      <Toaster
        position="top-center"
        containerStyle={{ top: 20 }}
        toastOptions={{
          duration: 3000,
          style: {
            background: '#0f172a',
            color: '#f1f5f9',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: '14px',
            padding: '12px 16px',
            fontSize: '13px',
            fontWeight: '500',
            lineHeight: '1.4',
            maxWidth: '88vw',
            boxShadow: '0 8px 32px rgba(0,0,0,0.40), 0 2px 8px rgba(0,0,0,0.20)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          },
          success: {
            style: {
              background: '#052e16',
              color: '#bbf7d0',
              border: '1px solid rgba(34,197,94,0.25)',
              borderRadius: '14px',
              padding: '12px 16px',
              fontSize: '13px',
              fontWeight: '500',
              lineHeight: '1.4',
              maxWidth: '88vw',
              boxShadow: '0 8px 32px rgba(0,0,0,0.40), 0 0 0 1px rgba(34,197,94,0.10)',
            },
            iconTheme: { primary: '#22c55e', secondary: '#052e16' },
          },
          error: {
            style: {
              background: '#2d0a0a',
              color: '#fecaca',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: '14px',
              padding: '12px 16px',
              fontSize: '13px',
              fontWeight: '500',
              lineHeight: '1.4',
              maxWidth: '88vw',
              boxShadow: '0 8px 32px rgba(0,0,0,0.40), 0 0 0 1px rgba(239,68,68,0.10)',
            },
            iconTheme: { primary: '#ef4444', secondary: '#2d0a0a' },
          },
        }}
      />
      <Suspense fallback={<PageSkeleton />}>
        <ScrollToTop />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/pending-approval" element={<PendingApproval />} />
          <Route path="/" element={<RoleRedirect />} />

          <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminLayout /></ProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="members" element={<AdminMembers />} />
            <Route path="assignments" element={<AdminAssignments />} />
            <Route path="months" element={<AdminMonths />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="masi-salary" element={<AdminMasiSalary />} />
            <Route path="expenses-history" element={<AdminExpensesHistory />} />
            <Route path="birthdays" element={<AdminBirthdays />} />
            <Route path="market-duty" element={<AdminMarketDuty />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="purge" element={<AdminPurge />} />
            <Route path="guest-members" element={<AdminGuestMembers />} />
          </Route>

          <Route path="/manager" element={<ProtectedRoute roles={['manager', 'admin']}><ManagerLayout /></ProtectedRoute>}>
            <Route index element={<ManagerDashboard />} />
            <Route path="meals" element={<ManagerMeals />} />
            <Route path="expenses" element={<ManagerExpenses />} />
            <Route path="payments" element={<ManagerPayments />} />
            <Route path="bills" element={<ManagerBills />} />
            <Route path="charges" element={<ManagerOtherCharges />} />
            <Route path="market-duty" element={<ManagerMarketDuty />} />
            <Route path="borrows" element={<ManagerBorrows />} />
            <Route path="rice-bag" element={<ManagerRiceBag />} />
            <Route path="guests" element={<ManagerGuestMembers />} />
          </Route>

          <Route path="/member" element={<ProtectedRoute roles={['member', 'manager', 'admin']}><MemberLayout /></ProtectedRoute>}>
            <Route index element={<MemberDashboard />} />
            <Route path="meals" element={<MemberMeals />} />
            <Route path="history" element={<MemberHistory />} />
            <Route path="expenses-history" element={<MemberExpensesHistory />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
