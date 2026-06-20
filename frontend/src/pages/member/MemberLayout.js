import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, History, LogOut, Menu } from 'lucide-react';
import useAuthStore from '../../store/authStore';

const rn = (name) => { const m = name?.match(/^\w+\s*\((.+)\)$/); return m ? m[1] : (name || ''); };

const links = [
  { to: '/member', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/member/history', icon: History, label: 'History' },
];

export default function MemberLayout() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const mainRef = useRef(null);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/login'); };

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const onScroll = () => setScrolled(el.scrollTop > 10);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <img src="/messy-logo.png" alt="logo" className="w-14 h-14 object-contain" style={{ filter: 'drop-shadow(0 0 6px rgba(16,185,129,0.5))' }} />
          <div>
            <p style={{ fontFamily: "'Dancing Script', cursive", fontSize: '1.35rem', fontWeight: 700, background: 'linear-gradient(135deg,#34d399 0%,#059669 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1.2 }}>The Messy Kitchen</p>
            <span className="badge-member">Member</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-0.5">
        {links.map(({ to, icon: Icon, label, end }) => (
          <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${
                isActive ? 'bg-green-500/15 text-green-400 border border-green-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-700/60 border border-transparent'
              }`
            }
          >
            <Icon size={17} />{label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-3 mb-3 px-1">
          <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 font-bold text-sm flex-shrink-0">
            {rn(user?.name)?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{rn(user?.name)}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-900 overflow-hidden">
      <aside className="hidden lg:flex flex-col w-64 bg-slate-800 border-r border-slate-700">
        <SidebarContent />
      </aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
            <SidebarContent />
          </aside>
        </div>
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header — glass effect deepens on scroll */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 transition-all duration-300"
          style={scrolled ? {
            background: 'rgba(8,14,28,0.85)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            borderBottom: '1px solid rgba(255,255,255,0.10)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 -1px 0 rgba(255,255,255,0.04)',
          } : {
            background: 'rgba(8,14,28,0.45)',
            backdropFilter: 'blur(16px) saturate(150%)',
            WebkitBackdropFilter: 'blur(16px) saturate(150%)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
          <button onClick={() => setOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}>
            <Menu size={18} className="text-slate-300" />
          </button>
          <div className="flex items-center gap-2">
            <img src="/messy-logo.png" alt="logo" className="w-7 h-7 object-contain"
              style={{ filter: 'drop-shadow(0 0 6px rgba(34,197,94,0.5))' }} />
            <span style={{
              fontFamily: "'Dancing Script', cursive", fontSize: '1.1rem', fontWeight: 700,
              background: 'linear-gradient(135deg,#ffffff 0%,#bbf7d0 50%,#34d399 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>The Messy Kitchen</span>
          </div>
          <span className="badge-member">Member</span>
        </header>
        <main ref={mainRef} className="flex-1 overflow-y-auto p-4 lg:p-6"><Outlet /></main>
      </div>
    </div>
  );
}
