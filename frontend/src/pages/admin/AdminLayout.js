import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, FileText, Trash2, LogOut, Menu, HandCoins, CalendarDays, Receipt, Cake } from 'lucide-react';
import useAuthStore from '../../store/authStore';

import BirthdayBanner from '../../components/BirthdayBanner';

const rn = (name) => { const m = name?.match(/^\w+\s*\((.+)\)$/); return m ? m[1] : (name || ''); };

const links = [
  { to: '/admin',                  icon: LayoutDashboard, label: 'Dashboard',        end: true },
  { to: '/admin/months',           icon: CalendarDays,    label: 'Month Control' },
  { to: '/admin/members',          icon: Users,           label: 'Members' },
  { to: '/admin/assignments',      icon: Calendar,        label: 'Assignments' },
  { to: '/admin/expenses-history', icon: Receipt,         label: 'Expenses History' },
  { to: '/admin/reports',          icon: FileText,        label: 'Reports' },
  { to: '/admin/masi-salary',      icon: HandCoins,       label: 'Masi Salary' },
  { to: '/admin/birthdays',        icon: Cake,            label: 'Birthdays' },
  { to: '/admin/purge',            icon: Trash2,          label: 'Purge Data', danger: true },
];

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/login'); };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-3">
          <img src="/messy-logo.png" alt="logo" className="w-14 h-14 object-contain" style={{ filter: 'drop-shadow(0 0 8px rgba(16,185,129,0.6))' }} />
          <div>
            <p style={{ fontFamily: "'Dancing Script', cursive", fontSize: '1.35rem', fontWeight: 700, background: 'linear-gradient(135deg,#ffffff 0%,#d1fae5 40%,#6ee7b7 70%,#fbbf24 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1.2 }}>The Messy Kitchen</p>
            <span className="badge-admin">Admin</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-0.5">
        {links.map(({ to, icon: Icon, label, end, danger }) => (
          <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${
                isActive
                  ? (danger ? 'text-red-400' : 'text-emerald-400')
                  : (danger ? 'text-red-500/70 hover:text-red-400' : 'text-slate-400 hover:text-white')
              }`
            }
            style={({ isActive }) => isActive ? {
              background: danger
                ? 'linear-gradient(135deg, rgba(239,68,68,0.12) 0%, rgba(220,38,38,0.06) 100%)'
                : 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(5,150,105,0.08) 100%)',
              border: `1px solid ${danger ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'}`,
              boxShadow: `0 4px 16px ${danger ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)'}`,
            } : {
              border: '1px solid transparent',
            }}
          >
            <Icon size={17} />{label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-3 mb-3 px-1">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-red-400 font-bold text-sm flex-shrink-0" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.25)' }}>
            {rn(user?.name)?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{rn(user?.name)}</p>
            <p className="text-xs truncate" style={{ color: '#4a5a7a' }}>{user?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-xl transition-all" style={{ color: '#64748b' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.background = 'transparent'; }}
        >
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </div>
  );

  const sidebarStyle = {
    background: 'rgba(8,13,28,0.92)',
    backdropFilter: 'blur(40px)',
    WebkitBackdropFilter: 'blur(40px)',
    borderRight: '1px solid rgba(255,255,255,0.08)',
    boxShadow: '4px 0 40px rgba(0,0,0,0.5)',
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'linear-gradient(135deg, #070c1a 0%, #050b16 50%, #070c1a 100%)' }}>
      {/* Ambient background */}
      <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-15%', left: '10%', width: '50vw', height: '50vw', maxWidth: 600, maxHeight: 600, background: 'radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 65%)', borderRadius: '50%', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '5%', width: '40vw', height: '40vw', maxWidth: 480, maxHeight: 480, background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 65%)', borderRadius: '50%', filter: 'blur(60px)' }} />
      </div>

      <aside className="hidden lg:flex flex-col w-64 relative z-10 flex-shrink-0" style={sidebarStyle}>
        <SidebarContent />
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 flex flex-col z-10" style={sidebarStyle}>
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        <header className="lg:hidden flex items-center justify-between px-4 py-3" style={{ background: 'rgba(6,10,22,0.90)', borderBottom: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)', boxShadow: '0 2px 20px rgba(0,0,0,0.4)' }}>
          <button onClick={() => setOpen(true)} className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors" style={{ color: '#94a3b8', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}><Menu size={20} /></button>
          <div className="flex items-center gap-2">
            <img src="/messy-logo.png" alt="logo" className="w-7 h-7 object-contain" style={{ filter: 'drop-shadow(0 0 6px rgba(16,185,129,0.5))' }} />
            <span style={{ fontFamily: "'Dancing Script', cursive", fontSize: '1.1rem', fontWeight: 700, background: 'linear-gradient(135deg,#ffffff 0%,#d1fae5 40%,#6ee7b7 70%,#fbbf24 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>The Messy Kitchen</span>
          </div>
          <span className="badge-admin">Admin</span>
        </header>
        <main className="flex-1 overflow-y-auto"><BirthdayBanner /><div className="p-4 lg:p-6 mt-3"><Outlet /></div></main>
      </div>
    </div>
  );
}
