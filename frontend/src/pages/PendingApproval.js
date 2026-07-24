import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ShieldCheck, LogOut, Mail, ChefHat } from 'lucide-react';
import useAuthStore from '../store/authStore';

export default function PendingApproval() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="fixed inset-0 overflow-y-auto"
      style={{ background: 'linear-gradient(135deg,#070c1a 0%,#050b16 50%,#070c1a 100%)' }}>

      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div style={{ position:'absolute', top:'-10%', left:'20%', width:'50vw', height:'50vw', maxWidth:500, maxHeight:500, background:'radial-gradient(circle,rgba(16,185,129,0.07) 0%,transparent 65%)', borderRadius:'50%' }} />
        <div style={{ position:'absolute', bottom:'-10%', right:'10%', width:'40vw', height:'40vw', maxWidth:400, maxHeight:400, background:'radial-gradient(circle,rgba(99,102,241,0.06) 0%,transparent 65%)', borderRadius:'50%' }} />
      </div>

      <div className="relative z-10 min-h-full flex flex-col items-center justify-center px-4 py-10">

        {/* Card */}
        <div className="w-full max-w-md"
          style={{
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            border: '1px solid rgba(255,255,255,0.10)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)',
            borderRadius: 28,
          }}>

          {/* Top shimmer */}
          <div className="h-px w-full rounded-t-[28px]"
            style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent)' }} />

          <div className="px-6 sm:px-8 py-8 sm:py-10">

            {/* Logo + icon */}
            <div className="flex flex-col items-center mb-7">
              <div className="relative mb-4">
                <img src="/messy-logo.png" alt="The Messy Kitchen"
                  className="w-16 h-16 object-contain"
                  style={{ filter: 'drop-shadow(0 4px 16px rgba(16,185,129,0.50))' }}
                  onError={e => { e.target.style.display='none'; }} />
                {/* Pending badge */}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', boxShadow: '0 2px 8px rgba(245,158,11,0.5)' }}>
                  <Clock size={12} color="#fff" strokeWidth={2.5} />
                </div>
              </div>

              <h1 style={{
                fontFamily: "'Dancing Script', cursive",
                fontSize: 'clamp(1.6rem,6vw,2.2rem)', fontWeight: 700,
                background: 'linear-gradient(135deg,#ffffff 0%,#d1fae5 40%,#6ee7b7 70%,#fbbf24 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                lineHeight: 1.2, textAlign: 'center',
              }}>The Messy Kitchen</h1>
              <p className="text-[10px] font-bold tracking-[0.25em] uppercase mt-1"
                style={{ color: 'rgba(110,231,183,0.60)' }}>Mess Meal Management</p>
            </div>

            {/* Status banner */}
            <div className="rounded-2xl p-4 mb-6 text-center"
              style={{
                background: 'linear-gradient(135deg,rgba(245,158,11,0.12) 0%,rgba(217,119,6,0.06) 100%)',
                border: '1px solid rgba(245,158,11,0.25)',
                boxShadow: '0 4px 20px rgba(245,158,11,0.08)',
              }}>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock size={16} style={{ color: '#fbbf24' }} />
                <span className="text-sm font-bold" style={{ color: '#fbbf24' }}>Awaiting Admin Approval</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(251,191,36,0.75)' }}>
                Your account has been created successfully. An admin needs to approve your access before you can use the platform.
              </p>
            </div>

            {/* User info */}
            {user && (
              <div className="rounded-2xl p-4 mb-6 flex items-center gap-3"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)', color: '#34d399' }}>
                  {user.name?.[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{user.name}</p>
                  <p className="text-xs truncate flex items-center gap-1" style={{ color: 'rgba(148,163,184,0.70)' }}>
                    <Mail size={10} />{user.email}
                  </p>
                </div>
                <div className="flex-shrink-0 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide"
                  style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.22)', color: '#fbbf24' }}>
                  Pending
                </div>
              </div>
            )}

            {/* Steps */}
            <div className="space-y-3 mb-7">
              {[
                { icon: ChefHat,     color: '#34d399', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.22)', step: '1', title: 'Account Created',       desc: 'Your Google account has been registered successfully.' },
                { icon: Clock,       color: '#fbbf24', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.22)', step: '2', title: 'Pending Admin Review',  desc: 'The admin will review and approve your account shortly.' },
                { icon: ShieldCheck, color: '#818cf8', bg: 'rgba(99,102,241,0.12)',  border: 'rgba(99,102,241,0.22)', step: '3', title: 'Get Full Access',        desc: 'Once approved, you can log in and access the platform.' },
              ].map(({ icon: Icon, color, bg, border, step, title, desc }) => (
                <div key={step} className="flex items-start gap-3 p-3 rounded-xl"
                  style={{ background: bg, border: `1px solid ${border}` }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(0,0,0,0.20)' }}>
                    <Icon size={15} style={{ color }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold" style={{ color: '#f1f5f9' }}>{title}</p>
                    <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'rgba(148,163,184,0.75)' }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Sign out */}
            <button onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition-all duration-200"
              style={{
                background: 'rgba(248,113,113,0.10)',
                border: '1px solid rgba(248,113,113,0.22)',
                color: '#f87171',
                boxShadow: '0 2px 12px rgba(248,113,113,0.08)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(248,113,113,0.18)'; e.currentTarget.style.borderColor='rgba(248,113,113,0.40)'; }}
              onMouseLeave={e => { e.currentTarget.style.background='rgba(248,113,113,0.10)'; e.currentTarget.style.borderColor='rgba(248,113,113,0.22)'; }}
            >
              <LogOut size={15} />
              Sign Out &amp; Try Different Account
            </button>

          </div>

          {/* Bottom glow */}
          <div className="h-px w-full rounded-b-[28px]"
            style={{ background: 'linear-gradient(90deg,transparent,rgba(16,185,129,0.25),transparent)' }} />
        </div>

        <p className="text-center mt-5 text-[10px]" style={{ color: 'rgba(148,163,184,0.40)' }}>
          © {new Date().getFullYear()} The Messy Kitchen · All rights reserved
        </p>
      </div>
    </div>
  );
}
