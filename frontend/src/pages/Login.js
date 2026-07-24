import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff, ArrowRight, KeyRound } from 'lucide-react';
import api from '../api';
import useAuthStore from '../store/authStore';

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

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
        background: focused ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.20)',
        border: focused ? '1px solid rgba(255,255,255,0.55)' : '1px solid rgba(255,255,255,0.30)',
        boxShadow: focused ? '0 0 0 3px rgba(255,255,255,0.12)' : 'none',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      }}>
      <span className="pl-4 pr-2 flex-shrink-0" style={{ color: focused ? 'rgba(52,211,153,0.85)' : 'rgba(110,231,183,0.40)' }}>
        <Icon size={16} />
      </span>
      <input {...props}
        onFocus={e => { setFocused(true); props.onFocus?.(e); }}
        onBlur={e => { setFocused(false); props.onBlur?.(e); }}
        className="flex-1 bg-transparent py-3.5 text-sm text-white outline-none min-w-0 placeholder:text-white/40"
        style={{ caretColor: '#34d399' }}
        placeholder={props.placeholder}
      />
      {rightSlot && <span className="pr-3 flex-shrink-0">{rightSlot}</span>}
    </div>
  );
}

/* ─── Login Page ────────────────────────────────────────────────────── */
export default function Login() {
  const [form, setForm]             = useState({ email: '', password: '' });
  const [show, setShow]             = useState(false);
  const [loading, setLoading]       = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const googleBtnRef = useRef(null);
  const { login }  = useAuthStore();
  const navigate   = useNavigate();

  const doLogin = (userData, token) => {
    login(userData, token);
    toast.success(`Welcome, ${userData.name}!`);
    setNavigating(true);
    setTimeout(() => {
      if (userData.role === 'admin')        navigate('/admin');
      else if (userData.role === 'manager') navigate('/manager');
      else                                   navigate('/member');
    }, 1200);
  };

  // Load Google script and render button immediately on load
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const initGoogle = () => {
      if (!window.google) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async ({ credential }) => {
          try {
            const { data } = await api.post('/auth/google', { credential });
            doLogin(data.user, data.token);
          } catch (err) {
            toast.error(err.response?.data?.message || 'Google sign-in failed.');
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      if (googleBtnRef.current) {
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: googleBtnRef.current.offsetWidth || 340,
        });
        setGoogleReady(true);
      }
    };

    if (window.google) {
      initGoogle();
    } else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initGoogle;
      document.head.appendChild(script);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      doLogin(data.user, data.token);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
      setLoading(false);
    }
  };

  return (
    <>
      {navigating && <LoadingOverlay />}

      <div className="fixed inset-0 flex flex-col items-center justify-center px-4 overflow-y-auto overflow-x-hidden">

        {/* Background — desktop */}
        <div className="fixed inset-0 hidden sm:block"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1588644525273-f37b60d78512?w=3840&auto=format&fit=crop&q=100')`,
            backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
            filter: 'brightness(0.72) saturate(1.10)',
          }} />
        {/* Background — mobile */}
        <div className="fixed inset-0 sm:hidden"
          style={{
            backgroundImage: `url('/ph background.jpeg')`,
            backgroundSize: 'cover', backgroundPosition: 'top center', backgroundRepeat: 'no-repeat',
            filter: 'brightness(0.70) saturate(1.05)',
          }} />
        <div className="fixed inset-0 hidden sm:block"
          style={{ background: 'linear-gradient(160deg,rgba(0,0,0,0.22) 0%,rgba(0,0,0,0.08) 50%,rgba(0,0,0,0.22) 100%)' }} />
        <div className="fixed inset-0 sm:hidden" style={{ background: 'rgba(0,0,0,0.30)' }} />
        <div className="fixed -top-32 -left-32 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle,rgba(16,185,129,0.08) 0%,transparent 65%)' }} />

        {/* Content */}
        <div className="relative z-10 w-full max-w-[400px] flex flex-col my-auto py-8">

          {/* Brand */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="pt-4 mb-3">
              <img src="/messy-logo.png" alt="The Messy Kitchen"
                className="w-24 h-24 sm:w-28 sm:h-28 object-contain mx-auto"
                style={{ filter: 'drop-shadow(0 4px 20px rgba(16,185,129,0.60)) drop-shadow(0 0 8px rgba(245,158,11,0.30))' }}
                onError={e => { e.target.style.display = 'none'; }} />
            </div>
            <h1 style={{
              fontFamily: "'Dancing Script', cursive",
              fontSize: 'clamp(2rem, 7vw, 2.8rem)', fontWeight: 700, lineHeight: 1.1,
              background: 'linear-gradient(135deg,#ffffff 0%,#d1fae5 40%,#6ee7b7 70%,#fbbf24 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              filter: 'drop-shadow(0 2px 8px rgba(16,185,129,0.25))',
            }}>The Messy Kitchen</h1>
            <p className="mt-1.5 text-[10px] sm:text-[11px] font-bold tracking-[0.28em] uppercase"
              style={{ color: 'rgba(110,231,183,0.70)' }}>
              Mess Meal Management System
            </p>
          </div>

          {/* Glass Card */}
          <div className="relative rounded-[28px] sm:rounded-[32px] overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(40px)',
              WebkitBackdropFilter: 'blur(40px)', border: '1px solid rgba(255,255,255,0.28)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.35)',
            }}>
            <div className="absolute top-0 left-0 right-0 h-px"
              style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.60),transparent)' }} />
            <div className="absolute top-0 left-0 right-0 h-1/2 pointer-events-none"
              style={{ background: 'linear-gradient(180deg,rgba(255,255,255,0.10) 0%,transparent 100%)' }} />

            <div className="px-6 sm:px-8 py-7 sm:py-8 relative">
              <h2 className="mb-0.5" style={{
                fontFamily: "'Dancing Script', cursive",
                fontSize: 'clamp(1.6rem, 5vw, 2rem)', fontWeight: 700, lineHeight: 1.2,
                background: 'linear-gradient(135deg,#ffffff 0%,#d1fae5 50%,#6ee7b7 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>Welcome Back</h2>
              <p className="text-xs sm:text-sm mb-6" style={{ color: 'rgba(30,40,50,0.65)' }}>
                Sign in to your mess account
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Email */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.22em] mb-2"
                    style={{ color: 'rgba(255,255,255,0.70)' }}>Email Address</label>
                  <GlassInput icon={Mail} type="email" value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="your@email.com" required autoComplete="email" />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.22em] mb-2"
                    style={{ color: 'rgba(255,255,255,0.70)' }}>Password</label>
                  <GlassInput icon={Lock} type={show ? 'text' : 'password'} value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••" required autoComplete="current-password"
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
                <button type="submit" disabled={loading}
                  className="group relative w-full py-3.5 sm:py-4 rounded-2xl text-white overflow-hidden mt-2"
                  style={{
                    background: 'rgba(255,255,255,0.22)', backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.38)',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.45)',
                    transition: 'opacity 0.2s', opacity: loading ? 0.85 : 1,
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}>
                  {!loading && (
                    <span className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none"
                      style={{ background: 'linear-gradient(110deg,transparent 20%,rgba(255,255,255,0.20) 50%,transparent 80%)', transition: 'opacity 0.4s' }} />
                  )}
                  <style>{`@keyframes orbitBubble{from{transform:rotate(0deg) translateX(10px) rotate(0deg)}to{transform:rotate(360deg) translateX(10px) rotate(-360deg)}}`}</style>
                  {loading ? (
                    <span className="relative flex items-center justify-center gap-3">
                      <span className="relative w-5 h-5 flex-shrink-0">
                        {[0,1,2,3].map(i => (
                          <span key={i} className="absolute rounded-full" style={{
                            width: i%2===0?5:4, height: i%2===0?5:4,
                            background: 'rgba(255,255,255,0.90)', top:'50%', left:'50%',
                            marginTop: i%2===0?-2.5:-2, marginLeft: i%2===0?-2.5:-2,
                            animation:`orbitBubble ${0.9+i*0.15}s linear ${i*0.22}s infinite`,
                            opacity: 1-i*0.15,
                          }} />
                        ))}
                      </span>
                      <span className="text-sm font-semibold tracking-wide text-white/90">Signing in…</span>
                    </span>
                  ) : (
                    <span className="relative flex items-center justify-center gap-2.5"
                      style={{ fontFamily:"'Dancing Script',cursive", fontWeight:700, fontSize:'1.3rem', letterSpacing:'0.04em' }}>
                      Sign In
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
                    </span>
                  )}
                </button>

                {/* Forgot Password — proper styled link */}
                <div className="flex justify-center pt-0.5">
                  <button type="button" onClick={() => navigate('/forgot-password')}
                    className="group inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200"
                    style={{
                      color: 'rgba(110,231,183,0.90)',
                      background: 'rgba(16,185,129,0.08)',
                      border: '1px solid rgba(16,185,129,0.20)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background='rgba(16,185,129,0.16)'; e.currentTarget.style.borderColor='rgba(16,185,129,0.40)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background='rgba(16,185,129,0.08)'; e.currentTarget.style.borderColor='rgba(16,185,129,0.20)'; }}
                  >
                    <KeyRound size={12} />
                    Forgot Password?
                  </button>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3 py-0.5">
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.15)' }} />
                  <span className="text-[10px] font-bold tracking-widest uppercase px-1"
                    style={{ color: 'rgba(255,255,255,0.30)' }}>or</span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.15)' }} />
                </div>

                {/* Google Sign In — rendered by Google SDK for instant response */}
                <div className="w-full overflow-hidden rounded-2xl" style={{ minHeight: 44 }}>
                  {/* Google renders its own button here — fastest possible */}
                  <div ref={googleBtnRef} className="w-full" style={{ minHeight: 44 }} />
                  {/* Fallback shown only while script loads */}
                  {!googleReady && (
                    <div className="w-full flex items-center justify-center gap-3 py-3 rounded-2xl text-sm font-semibold"
                      style={{ background: 'rgba(255,255,255,0.88)', color: '#6b7280', border: '1px solid rgba(255,255,255,0.50)' }}>
                      <svg width="18" height="18" viewBox="0 0 48 48">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                      </svg>
                      Continue with Google
                    </div>
                  )}
                </div>

              </form>
            </div>

            <div className="absolute bottom-0 left-1/4 right-1/4 h-[1px]"
              style={{ background: 'linear-gradient(90deg,transparent,rgba(16,185,129,0.35),transparent)' }} />
          </div>

          <p className="text-center mt-5 text-[11px] font-medium tracking-wide"
            style={{ color: 'rgba(148,163,184,0.60)' }}>
            © {new Date().getFullYear()} The Messy Kitchen · All rights reserved
          </p>
        </div>
      </div>
    </>
  );
}
