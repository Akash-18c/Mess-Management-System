import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, Tag, FileText, Trash2, LogOut, Menu, HandCoins } from 'lucide-react';
import useAuthStore from '../../store/authStore';

const rn = (name) => { const m = name?.match(/^\w+\s*\((.+)\)$/); return m ? m[1] : (name || ''); };

const links = [
  { to: '/admin',             icon: LayoutDashboard, label: 'Dashboard',   end: true },
  { to: '/admin/members',     icon: Users,           label: 'Members' },
  { to: '/admin/assignments', icon: Calendar,        label: 'Assignments' },
  { to: '/admin/categories',  icon: Tag,             label: 'Categories' },
  { to: '/admin/reports',     icon: FileText,        label: 'Reports' },
  { to: '/admin/masi-salary', icon: HandCoins,       label: 'Masi Salary' },
  { to: '/admin/purge',       icon: Trash2,          label: 'Purge Data', danger: true },
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
            <p style={{ fontFamily: "'Dancing Script', cursive", fontSize: '1.35rem', fontWeight: 700, background: 'linear-gradient(135deg,#34d399 0%,#059669 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1.2 }}>The Messy Kitchen</p>
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
    background: 'linear-gradient(180deg, #0d1528 0%, #0a1020 100%)',
    borderRight: '1px solid rgba(255,255,255,0.07)',
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #060d1a 50%, #0a0f1e 100%)' }}>
      <aside className="hidden lg:flex flex-col w-64" style={sidebarStyle}>
        <SidebarContent />
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 flex flex-col" style={sidebarStyle}>
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="lg:hidden flex items-center justify-between px-4 py-3" style={{ background: 'rgba(13,21,40,0.95)', borderBottom: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)' }}>
          <button onClick={() => setOpen(true)} className="text-slate-400 hover:text-white"><Menu size={22} /></button>
          <div className="flex items-center gap-2">
            <img src="/messy-logo.png" alt="logo" className="w-7 h-7 object-contain" />
            <span style={{ fontFamily: "'Dancing Script', cursive", fontSize: '1.1rem', fontWeight: 700, background: 'linear-gradient(135deg,#34d399,#059669)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>The Messy Kitchen</span>
          </div>
          <span className="badge-admin">Admin</span>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6"><Outlet /></main>
      </div>
    </div>
  );
}
