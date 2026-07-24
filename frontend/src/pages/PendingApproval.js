import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Mail, RefreshCw } from 'lucide-react';
import useAuthStore from '../store/authStore';
import api from '../api';

export default function PendingApproval() {
  const { user, logout, login } = useAuthStore();
  const navigate = useNavigate();
  const intervalRef = useRef(null);

  const handleLogout = () => { logout(); navigate('/login'); };

  // Poll every 8s — if admin approved, auto-redirect
  useEffect(() => {
    intervalRef.current = setInterval(async () => {
      try {
        const { data } = await api.get('/auth/me');
        if (data?.user?.isApproved) {
          clearInterval(intervalRef.current);
          login(data.user, data.token || useAuthStore.getState().token);
          navigate(data.user.role === 'admin' ? '/admin' : data.user.role === 'manager' ? '/manager' : '/member');
        }
      } catch {}
    }, 8000);
    return () => clearInterval(intervalRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const steps = [
    {
      num: '1', done: true,
      label: 'Account Registered',
      sub: 'Your Google account is linked successfully.',
      color: '#34d399', glow: 'rgba(16,185,129,0.30)',
      bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.20)',
    },
    {
      num: '2', done: false,
      label: 'Admin Review',
      sub: 'Waiting for admin to approve your access.',
      color: '#fbbf24', glow: 'rgba(245,158,11,0.30)',
      bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.22)',
    },
    {
      num: '3', done: false,
      label: 'Full Access Granted',
      sub: 'You\'ll be redirected automatically once approved.',
      color: '#818cf8', glow: 'rgba(99,102,241,0.25)',
      bg: 'rgba(99,102,241,0.06)', border: 'rgba(99,102,241,0.18)',
    },
  ];

  return (
    <div className="fixed inset-0 overflow-y-auto" style={{ background: 'linear-gradient(160deg,#060b18 0%,#040e10 50%,#060b18 100%)' }}>

      {/* ── Ambient background blobs ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div style={{ position:'absolute', top:'-15%', left:'-5%', width:'60vw', height:'60vw', maxWidth:560, maxHeight:560, background:'radial-gradient(circle,rgba(16,185,129,0.10) 0%,transparent 65%)', borderRadius:'50%' }} />
        <div style={{ position:'absolute', bottom:'-10%', right:'-5%', width:'50vw', height:'50vw', maxWidth:480, maxHeight:480, background:'radial-gradient(circle,rgba(99,102,241,0.09) 0%,transparent 65%)', borderRadius:'50%' }} />
        <div style={{ position:'absolute', top:'40%', right:'15%', width:'30vw', height:'30vw', maxWidth:300, maxHeight:300, background:'radial-gradient(circle,rgba(245,158,11,0.06) 0%,transparent 65%)', borderRadius:'50%' }} />
      </div>

      <div className="relative z-10 min-h-full flex flex-col items-center justify-center px-4 py-10">

        {/* ── Main glass card ── */}
        <div className="w-full max-w-[400px]" style={{
          background: 'rgba(255,255,255,0.055)',
          backdropFilter: 'blur(48px)',
          WebkitBackdropFilter: 'blur(48px)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.12)',
          borderRadius: 32,
          overflow: 'hidden',
        }}>

          {/* Top shimmer */}
          <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.45),transparent)' }} />

          {/* ── Header section ── */}
          <div className="flex flex-col items-center pt-8 pb-6 px-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>

            {/* Logo with pulse ring */}
            <div className="relative mb-5">
              <div className="absolute inset-0 rounded-full animate-ping" style={{ background: 'rgba(245,158,11,0.15)', animationDuration: '2.5s' }} />
              <div className="relative w-20 h-20 rounded-full flex items-center justify-center" style={{
                background: 'linear-gradient(135deg,rgba(16,185,129,0.18) 0%,rgba(245,158,11,0.12) 100%)',
                border: '1.5px solid rgba(255,255,255,0.15)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3), 0 0 0 8px rgba(245,158,11,0.06)',
              }}>
                <img src="/messy-logo.png" alt="logo" className="w-12 h-12 object-contain"
                  style={{ filter: 'drop-shadow(0 2px 12px rgba(16,185,129,0.55))' }}
                  onError={e => { e.target.style.display = 'none'; }} />
              </div>
              {/* Amber clock badge */}
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center" style={{
                background: 'linear-gradient(135deg,#f59e0b,#d97706)',
                boxShadow: '0 2px 10px rgba(245,158,11,0.55)',
                border: '2px solid rgba(6,11,24,0.9)',
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
            </div>

            <h1 style={{
              fontFamily: "'Dancing Script', cursive",
              fontSize: 'clamp(1.6rem,6vw,2.1rem)', fontWeight: 700, lineHeight: 1.15,
              background: 'linear-gradient(135deg,#ffffff 0%,#d1fae5 40%,#6ee7b7 70%,#fbbf24 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              textAlign: 'center',
            }}>The Messy Kitchen</h1>
            <p className="text-[9px] font-bold tracking-[0.28em] uppercase mt-1" style={{ color: 'rgba(110,231,183,0.55)' }}>
              Mess Meal Management
            </p>
          </div>

          <div className="px-5 sm:px-6 py-6 space-y-4">

            {/* ── Status pill ── */}
            <div className="flex items-center justify-center">
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full" style={{
                background: 'linear-gradient(135deg,rgba(245,158,11,0.14) 0%,rgba(217,119,6,0.08) 100%)',
                border: '1px solid rgba(245,158,11,0.30)',
                boxShadow: '0 4px 20px rgba(245,158,11,0.10), inset 0 1px 0 rgba(255,255,255,0.06)',
              }}>
                {/* Pulsing dot */}
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#fbbf24' }} />
                  <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: '#f59e0b' }} />
                </span>
                <span className="text-xs font-bold tracking-wide" style={{ color: '#fbbf24' }}>Awaiting Admin Approval</span>
              </div>
            </div>

            {/* ── User info card ── */}
            {user && (
              <div className="flex items-center gap-3 p-3.5 rounded-2xl" style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.09)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
              }}>
                {/* Avatar */}
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-base font-bold flex-shrink-0" style={{
                  background: 'linear-gradient(135deg,rgba(16,185,129,0.20) 0%,rgba(5,150,105,0.10) 100%)',
                  border: '1px solid rgba(16,185,129,0.28)',
                  color: '#34d399',
                  boxShadow: '0 0 16px rgba(16,185,129,0.15)',
                }}>
                  {user.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{user.name}</p>
                  <p className="text-[11px] truncate flex items-center gap-1 mt-0.5" style={{ color: 'rgba(148,163,184,0.65)' }}>
                    <Mail size={9} />{user.email}
                  </p>
                </div>
                {/* Google badge */}
                <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.25)' }}>
                  <svg width="13" height="13" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                </div>
              </div>
            )}

            {/* ── Progress steps ── */}
            <div className="space-y-2">
              {steps.map((s, i) => (
                <div key={s.num} className="flex items-center gap-3 px-3.5 py-3 rounded-2xl transition-all" style={{
                  background: s.bg,
                  border: `1px solid ${s.border}`,
                  boxShadow: s.done ? `0 0 16px ${s.glow}` : 'none',
                }}>
                  {/* Step circle */}
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{
                    background: s.done ? `linear-gradient(135deg,${s.color}33,${s.color}18)` : 'rgba(255,255,255,0.05)',
                    border: `1.5px solid ${s.color}55`,
                    color: s.color,
                    boxShadow: s.done ? `0 0 12px ${s.glow}` : 'none',
                  }}>
                    {s.done && i === 0
                      ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      : <span style={{ color: s.color }}>{s.num}</span>
                    }
                  </div>
                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: s.done ? '#f1f5f9' : 'rgba(241,245,249,0.65)' }}>{s.label}</p>
                    <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: 'rgba(148,163,184,0.60)' }}>{s.sub}</p>
                  </div>
                  {/* Active spinner on step 2 */}
                  {i === 1 && (
                    <RefreshCw size={13} className="flex-shrink-0 animate-spin" style={{ color: '#fbbf24', animationDuration: '2s' }} />
                  )}
                </div>
              ))}
            </div>

            {/* ── Info note ── */}
            <p className="text-center text-[11px] leading-relaxed px-2" style={{ color: 'rgba(148,163,184,0.45)' }}>
              This page checks automatically every few seconds.<br />You'll be redirected as soon as you're approved.
            </p>

            {/* ── Sign out button ── */}
            <button onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-200"
              style={{
                background: 'rgba(248,113,113,0.08)',
                border: '1px solid rgba(248,113,113,0.20)',
                color: '#f87171',
                boxShadow: '0 2px 12px rgba(248,113,113,0.06)',
                WebkitTapHighlightColor: 'transparent',
              }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(248,113,113,0.16)'; e.currentTarget.style.borderColor='rgba(248,113,113,0.38)'; }}
              onMouseLeave={e => { e.currentTarget.style.background='rgba(248,113,113,0.08)'; e.currentTarget.style.borderColor='rgba(248,113,113,0.20)'; }}
            >
              <LogOut size={15} />
              Sign Out
            </button>

          </div>

          {/* Bottom glow line */}
          <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(16,185,129,0.30),transparent)' }} />
        </div>

        <p className="text-center mt-5 text-[10px]" style={{ color: 'rgba(148,163,184,0.35)' }}>
          © {new Date().getFullYear()} The Messy Kitchen · All rights reserved
        </p>
      </div>
    </div>
  );
}
