import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Mail, RefreshCw } from 'lucide-react';
import useAuthStore from '../store/authStore';
import api from '../api';

const G = () => (
  <svg width="13" height="13" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

export default function PendingApproval() {
  const { user, logout, login } = useAuthStore();
  const navigate = useNavigate();
  const intervalRef = useRef(null);

  const handleLogout = () => { logout(); navigate('/login'); };

  useEffect(() => {
    const check = async () => {
      try {
        const { data } = await api.get('/auth/me');
        if (data?.user?.isApproved) {
          clearInterval(intervalRef.current);
          login(data.user, data.token);
          navigate(data.user.role === 'admin' ? '/admin' : data.user.role === 'manager' ? '/manager' : '/member');
        }
      } catch {}
    };
    check(); // check immediately on mount
    intervalRef.current = setInterval(check, 2000);
    return () => clearInterval(intervalRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const steps = [
    { num: '1', done: true,  label: 'Account Registered',   sub: 'Your Google account is linked.' },
    { num: '2', done: false, label: 'Admin Review',          sub: 'Waiting for admin approval.' },
    { num: '3', done: false, label: 'Full Access Granted',   sub: 'Auto-redirect on approval.' },
  ];

  /* ── shared iOS glass style ── */
  const card = {
    background: 'rgba(255,255,255,0.08)',
    backdropFilter: 'blur(40px)',
    WebkitBackdropFilter: 'blur(40px)',
    border: '1px solid rgba(255,255,255,0.16)',
    boxShadow: '0 4px 24px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.20)',
  };

  return (
    <div className="fixed inset-0 overflow-y-auto"
      style={{ background: 'linear-gradient(160deg,#06091a 0%,#040d12 55%,#06091a 100%)' }}>

      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div style={{ position:'absolute', top:'-20%', left:'-10%', width:'65vw', height:'65vw', maxWidth:580, maxHeight:580, background:'radial-gradient(circle,rgba(16,185,129,0.09) 0%,transparent 65%)', borderRadius:'50%' }} />
        <div style={{ position:'absolute', bottom:'-15%', right:'-8%', width:'55vw', height:'55vw', maxWidth:500, maxHeight:500, background:'radial-gradient(circle,rgba(99,102,241,0.08) 0%,transparent 65%)', borderRadius:'50%' }} />
        <div style={{ position:'absolute', top:'35%', right:'10%', width:'35vw', height:'35vw', maxWidth:320, maxHeight:320, background:'radial-gradient(circle,rgba(245,158,11,0.05) 0%,transparent 65%)', borderRadius:'50%' }} />
      </div>

      <div className="relative z-10 min-h-full flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-[390px] flex flex-col gap-3">

          {/* ── Brand header card ── */}
          <div className="flex flex-col items-center py-7 px-6 rounded-[28px]" style={card}>
            {/* shimmer top */}
            <div className="absolute top-0 left-8 right-8 h-px rounded-full" style={{ background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.50),transparent)' }} />

            {/* Logo */}
            <div className="relative mb-4">
              <div className="absolute inset-[-8px] rounded-full animate-ping opacity-30"
                style={{ background:'rgba(245,158,11,0.35)', animationDuration:'2.8s' }} />
              <div className="relative w-[72px] h-[72px] rounded-full flex items-center justify-center"
                style={{ background:'rgba(255,255,255,0.10)', border:'1.5px solid rgba(255,255,255,0.22)', boxShadow:'0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.25)' }}>
                <img src="/messy-logo.png" alt="logo" className="w-11 h-11 object-contain"
                  style={{ filter:'drop-shadow(0 2px 10px rgba(16,185,129,0.50))' }}
                  onError={e => { e.target.style.display='none'; }} />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background:'linear-gradient(135deg,#f59e0b,#d97706)', boxShadow:'0 2px 8px rgba(245,158,11,0.55)', border:'2px solid rgba(6,9,26,0.9)' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
            </div>

            <h1 style={{
              fontFamily:"'Dancing Script',cursive", fontSize:'clamp(1.55rem,6vw,2rem)', fontWeight:700, lineHeight:1.15,
              background:'linear-gradient(135deg,#ffffff 0%,#d1fae5 40%,#6ee7b7 70%,#fbbf24 100%)',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', textAlign:'center',
            }}>The Messy Kitchen</h1>
            <p className="text-[9px] font-bold tracking-[0.28em] uppercase mt-1" style={{ color:'rgba(110,231,183,0.50)' }}>
              Mess Meal Management
            </p>
          </div>

          {/* ── Status pill ── */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full" style={{
              background:'rgba(255,255,255,0.07)',
              border:'1px solid rgba(245,158,11,0.28)',
              backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
              boxShadow:'0 2px 16px rgba(245,158,11,0.08), inset 0 1px 0 rgba(255,255,255,0.12)',
            }}>
              <span className="relative flex h-2 w-2 flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-70" style={{ background:'#fbbf24' }} />
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ background:'#f59e0b' }} />
              </span>
              <span className="text-xs font-semibold" style={{ color:'rgba(251,191,36,0.90)' }}>Awaiting Admin Approval</span>
            </div>
          </div>

          {/* ── User info card ── */}
          {user && (
            <div className="flex items-center gap-3 px-4 py-3.5 rounded-[22px]" style={card}>
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ background:'rgba(255,255,255,0.10)', border:'1px solid rgba(255,255,255,0.18)', color:'rgba(255,255,255,0.90)', boxShadow:'inset 0 1px 0 rgba(255,255,255,0.20)' }}>
                {user.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate">{user.name}</p>
                <p className="text-[11px] truncate flex items-center gap-1 mt-0.5" style={{ color:'rgba(148,163,184,0.60)' }}>
                  <Mail size={9} />{user.email}
                </p>
              </div>
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background:'#fff', boxShadow:'0 2px 8px rgba(0,0,0,0.20)' }}>
                <G />
              </div>
            </div>
          )}

          {/* ── Steps card ── */}
          <div className="rounded-[22px] overflow-hidden" style={card}>
            {steps.map((s, i) => (
              <div key={s.num} className="flex items-center gap-3 px-4 py-3.5"
                style={{ borderBottom: i < steps.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
                {/* circle */}
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                  style={{
                    background: i === 0 ? 'rgba(52,211,153,0.15)' : i === 1 ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.06)',
                    border: `1.5px solid ${i === 0 ? 'rgba(52,211,153,0.40)' : i === 1 ? 'rgba(245,158,11,0.35)' : 'rgba(255,255,255,0.12)'}`,
                  }}>
                  {i === 0
                    ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    : <span style={{ color: i === 1 ? '#fbbf24' : 'rgba(255,255,255,0.30)' }}>{s.num}</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: i === 0 ? 'rgba(255,255,255,0.95)' : i === 1 ? 'rgba(255,255,255,0.80)' : 'rgba(255,255,255,0.35)' }}>{s.label}</p>
                  <p className="text-[11px] mt-0.5" style={{ color:'rgba(148,163,184,0.50)' }}>{s.sub}</p>
                </div>
                {i === 1 && <RefreshCw size={13} className="flex-shrink-0 animate-spin" style={{ color:'rgba(251,191,36,0.70)', animationDuration:'2.2s' }} />}
              </div>
            ))}
          </div>

          {/* ── Note ── */}
          <p className="text-center text-[11px] leading-relaxed" style={{ color:'rgba(148,163,184,0.38)' }}>
            Checks automatically · redirects on approval
          </p>

          {/* ── Sign out ── */}
          <button onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-[22px] text-sm font-semibold transition-all duration-200"
            style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.10)', color:'rgba(248,113,113,0.85)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', boxShadow:'inset 0 1px 0 rgba(255,255,255,0.10)', WebkitTapHighlightColor:'transparent' }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(248,113,113,0.12)'; e.currentTarget.style.borderColor='rgba(248,113,113,0.28)'; }}
            onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.10)'; }}>
            <LogOut size={15} />Sign Out
          </button>

          <p className="text-center text-[10px]" style={{ color:'rgba(148,163,184,0.28)' }}>
            © {new Date().getFullYear()} The Messy Kitchen
          </p>
        </div>
      </div>
    </div>
  );
}
