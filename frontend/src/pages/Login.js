import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import api from '../api';
import useAuthStore from '../store/authStore';

/* ─── Loading overlay ───────────────────────────────────────────────── */
function LoadingOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: 'linear-gradient(135deg,rgba(2,10,18,0.97) 0%,rgba(4,22,12,0.97) 100%)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}>
      <div className="relative w-20 h-20 mb-6">
        <svg className="animate-spin w-20 h-20" viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="40" r="34" stroke="rgba(16,185,129,0.15)" strokeWidth="6" />
          <path d="M40 6a34 34 0 0 1 34 34" stroke="url(#sg)" strokeWidth="6" strokeLinecap="round" />
          <defs>
            <linearGradient id="sg" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#34d399" /><stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>
        </svg>
        <img src="/messy-logo.png" alt="" className="absolute inset-0 w-12 h-12 m-auto object-contain"
          style={{ filter: 'drop-shadow(0 0 10px rgba(16,185,129,0.5))' }} onError={e => { e.target.style.display = 'none'; }} />
      </div>
      <p className="text-emerald-300 font-bold text-lg tracking-wide">Signing you in…</p>
      <p className="text-slate-500 text-xs mt-1 tracking-widest uppercase">Please wait</p>
    </div>
  );
}

/* ─── Glass Input ───────────────────────────────────────────────────── */
function GlassInput({ icon: Icon, rightSlot, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative flex items-center rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        background: focused ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.09)',
        border: focused ? '1px solid rgba(255,255,255,0.35)' : '1px solid rgba(255,255,255,0.18)',
        boxShadow: focused ? '0 0 0 3px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.15)' : 'inset 0 1px 0 rgba(255,255,255,0.10)',
        backdropFilter: 'blur(40px) saturate(180%)', WebkitBackdropFilter: 'blur(40px) saturate(180%)',
      }}>
      <span className="pl-4 pr-2 flex-shrink-0" style={{ color: focused ? 'rgba(52,211,153,0.85)' : 'rgba(110,231,183,0.40)' }}>
        <Icon size={16} />
      </span>
      <input {...props}
        onFocus={e => { setFocused(true); props.onFocus?.(e); }}
        onBlur={e => { setFocused(false); props.onBlur?.(e); }}
        className="flex-1 bg-transparent py-3.5 text-sm text-white outline-none min-w-0"
        style={{ caretColor: '#34d399' }}
        placeholder={props.placeholder}
      />
      {rightSlot && <span className="pr-3 flex-shrink-0">{rightSlot}</span>}
    </div>
  );
}

/* ─── Login Page ────────────────────────────────────────────────────── */
export default function Login() {
  const [form, setForm]           = useState({ email: '', password: '' });
  const [show, setShow]           = useState(false);
  const [loading, setLoading]     = useState(false);
  const [navigating, setNavigating] = useState(false);
  const { login }  = useAuthStore();
  const navigate   = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.user, data.token);
      toast.success(`Welcome, ${data.user.name}!`);
      setNavigating(true);
      setTimeout(() => {
        if (data.user.role === 'admin')        navigate('/admin');
        else if (data.user.role === 'manager') navigate('/manager');
        else                                    navigate('/member');
      }, 1200);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
      setLoading(false);
    }
  };

  return (
    <>
      {navigating && <LoadingOverlay />}

      {/* ── Full-screen wrapper ───────────────────────────────────────── */}
      <div className="fixed inset-0 flex flex-col items-center justify-center px-4 overflow-y-auto overflow-x-hidden">

        {/* Background image — desktop */}
        <div className="fixed inset-0 hidden sm:block"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1588644525273-f37b60d78512?w=3840&auto=format&fit=crop&q=100')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            filter: 'brightness(0.72) saturate(1.10)',
          }} />

        {/* Background image — mobile */}
        <div className="fixed inset-0 sm:hidden"
          style={{
            backgroundImage: `url('/ph background.jpeg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'top center',
            backgroundRepeat: 'no-repeat',
            filter: 'brightness(0.70) saturate(1.05)',
          }} />

        {/* Gradient overlay — very light so image stays sharp */}
        <div className="fixed inset-0 hidden sm:block"
          style={{ background: 'linear-gradient(160deg,rgba(0,0,0,0.22) 0%,rgba(0,0,0,0.08) 50%,rgba(0,0,0,0.22) 100%)' }} />
        <div className="fixed inset-0 sm:hidden"
          style={{ background: 'rgba(0,0,0,0.30)' }} />

        {/* Ambient glows */}
        <div className="fixed -top-32 -left-32 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle,rgba(16,185,129,0.12) 0%,transparent 65%)' }} />
        <div className="fixed -bottom-32 -right-32 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle,rgba(245,158,11,0.08) 0%,transparent 65%)' }} />

        {/* ── Content ──────────────────────────────────────────────────── */}
        <div className="relative z-10 w-full max-w-[400px] flex flex-col my-auto py-8">

          {/* ── Brand block ────────────────────────────────────────────── */}
          <div className="flex flex-col items-center text-center mb-6">

            {/* Logo — pushed down with padding-top */}
            <div className="pt-4 mb-3">
              <img
                src="/messy-logo.png"
                alt="The Messy Kitchen"
                className="w-24 h-24 sm:w-28 sm:h-28 object-contain mx-auto"
                style={{ filter: 'drop-shadow(0 4px 20px rgba(16,185,129,0.60)) drop-shadow(0 0 8px rgba(245,158,11,0.30))' }}
                onError={e => { e.target.style.display = 'none'; }}
              />
            </div>

            {/* Title */}
            <h1 style={{
              fontFamily: "'Dancing Script', cursive",
              fontSize: 'clamp(2rem, 7vw, 2.8rem)',
              fontWeight: 700,
              lineHeight: 1.1,
              background: 'linear-gradient(135deg,#ffffff 0%,#d1fae5 40%,#6ee7b7 70%,#fbbf24 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 2px 8px rgba(16,185,129,0.25))',
            }}>
              The Messy Kitchen
            </h1>

            {/* Tagline */}
            <p className="mt-1.5 text-[10px] sm:text-[11px] font-bold tracking-[0.28em] uppercase"
              style={{ color: 'rgba(110,231,183,0.70)' }}>
              Mess Meal Management System
            </p>
          </div>

          {/* ── Glass Card ─────────────────────────────────────────────── */}
          <div className="relative rounded-[28px] sm:rounded-[32px] overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(60px) saturate(180%)',
              WebkitBackdropFilter: 'blur(60px) saturate(180%)',
              border: '1px solid rgba(255,255,255,0.18)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.20)',
            }}>

            {/* Top shimmer */}
            <div className="absolute top-0 left-0 right-0 h-px"
              style={{ background: 'linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.55) 40%,rgba(255,255,255,0.55) 60%,transparent 100%)' }} />
            {/* Inner highlight */}
            <div className="absolute top-0 left-0 right-0 h-1/2 pointer-events-none"
              style={{ background: 'linear-gradient(180deg,rgba(255,255,255,0.04) 0%,transparent 100%)' }} />

            <div className="px-6 sm:px-8 py-7 sm:py-8 relative">

              {/* Card heading */}
              <h2 className="mb-0.5" style={{
                fontFamily: "'Dancing Script', cursive",
                fontSize: 'clamp(1.6rem, 5vw, 2rem)',
                fontWeight: 700,
                lineHeight: 1.2,
                background: 'linear-gradient(135deg,#ffffff 0%,#d1fae5 50%,#6ee7b7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>Welcome Back</h2>

              <p className="text-xs sm:text-sm mb-6"
                style={{ color: 'rgba(148,163,184,0.80)' }}>
                Sign in to your mess account
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Email */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.22em] mb-2"
                    style={{ color: 'rgba(110,231,183,0.70)' }}>
                    Email Address
                  </label>
                  <GlassInput
                    icon={Mail}
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="your@email.com"
                    required
                    autoComplete="email"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.22em] mb-2"
                    style={{ color: 'rgba(110,231,183,0.70)' }}>
                    Password
                  </label>
                  <GlassInput
                    icon={Lock}
                    type={show ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    rightSlot={
                      <button type="button" onClick={() => setShow(!show)}
                        className="transition-all duration-200 p-1.5 rounded-lg mr-1"
                        style={{
                          color: show ? 'rgba(52,211,153,0.90)' : 'rgba(148,163,184,0.60)',
                          background: show ? 'rgba(52,211,153,0.10)' : 'transparent',
                        }}>
                        {show ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    }
                  />
                </div>

                {/* Sign In button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full py-3.5 sm:py-4 rounded-2xl text-white overflow-hidden transition-all duration-300 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                  style={{
                    background: 'rgba(255,255,255,0.12)',
                    backdropFilter: 'blur(40px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    boxShadow: '0 2px 16px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.20)',
                  }}>
                  {/* Hover shimmer */}
                  <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                    style={{ background: 'linear-gradient(110deg,transparent 20%,rgba(255,255,255,0.18) 50%,transparent 80%)' }} />

                  {loading ? (
                    <span className="flex items-center justify-center gap-3 text-sm">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Authenticating…
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2.5"
                      style={{ fontFamily: "'Dancing Script', cursive", fontWeight: 700, fontSize: '1.3rem', letterSpacing: '0.04em' }}>
                      Sign In
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
                    </span>
                  )}
                </button>
              </form>
            </div>

            {/* Bottom glow */}
            <div className="absolute bottom-0 left-1/4 right-1/4 h-[1px]"
              style={{ background: 'linear-gradient(90deg,transparent,rgba(16,185,129,0.35),transparent)' }} />
          </div>

          {/* Copyright */}
          <p className="text-center mt-5 text-[11px] font-medium tracking-wide"
            style={{ color: 'rgba(148,163,184,0.60)' }}>
            © {new Date().getFullYear()} The Messy Kitchen · All rights reserved
          </p>
        </div>
      </div>
    </>
  );
}
