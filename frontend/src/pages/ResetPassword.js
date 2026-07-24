import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import api from '../api';

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
      />
      {rightSlot && <span className="pr-3 flex-shrink-0">{rightSlot}</span>}
    </div>
  );
}

export default function ResetPassword() {
  const [searchParams]        = useSearchParams();
  const token                 = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [showCf, setShowCf]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);
  const [error, setError]       = useState('');
  const navigate = useNavigate();

  if (!token) {
    return (
      <div className="fixed inset-0 flex items-center justify-center px-4"
        style={{ background: '#070c1a' }}>
        <div className="text-center">
          <p className="text-red-400 text-sm mb-4">This password reset link is invalid or has expired.</p>
          <button onClick={() => navigate('/login')}
            className="text-emerald-400 text-sm underline">Back to Login</button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setDone(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center px-4 overflow-y-auto overflow-x-hidden">

      {/* Background */}
      <div className="fixed inset-0 hidden sm:block"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1588644525273-f37b60d78512?w=3840&auto=format&fit=crop&q=100')`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          filter: 'brightness(0.72) saturate(1.10)',
        }} />
      <div className="fixed inset-0 sm:hidden"
        style={{
          backgroundImage: `url('/ph background.jpeg')`,
          backgroundSize: 'cover', backgroundPosition: 'top center',
          filter: 'brightness(0.70) saturate(1.05)',
        }} />
      <div className="fixed inset-0 hidden sm:block"
        style={{ background: 'linear-gradient(160deg,rgba(0,0,0,0.22) 0%,rgba(0,0,0,0.08) 50%,rgba(0,0,0,0.22) 100%)' }} />
      <div className="fixed inset-0 sm:hidden" style={{ background: 'rgba(0,0,0,0.30)' }} />

      <div className="relative z-10 w-full max-w-[400px] flex flex-col my-auto py-8">

        {/* Brand */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="pt-4 mb-3">
            <img src="/messy-logo.png" alt="The Messy Kitchen"
              className="w-20 h-20 sm:w-24 sm:h-24 object-contain mx-auto"
              style={{ filter: 'drop-shadow(0 4px 20px rgba(16,185,129,0.60))' }}
              onError={e => { e.target.style.display = 'none'; }} />
          </div>
          <h1 style={{
            fontFamily: "'Dancing Script', cursive",
            fontSize: 'clamp(1.8rem, 6vw, 2.4rem)', fontWeight: 700, lineHeight: 1.1,
            background: 'linear-gradient(135deg,#ffffff 0%,#d1fae5 40%,#6ee7b7 70%,#fbbf24 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>The Messy Kitchen</h1>
          <p className="mt-1.5 text-[10px] sm:text-[11px] font-bold tracking-[0.28em] uppercase"
            style={{ color: 'rgba(110,231,183,0.70)' }}>
            Set New Password
          </p>
        </div>

        {/* Card */}
        <div className="relative rounded-[28px] sm:rounded-[32px] overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)', border: '1px solid rgba(255,255,255,0.28)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.35)',
          }}>
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.60),transparent)' }} />

          <div className="px-6 sm:px-8 py-7 sm:py-8 relative">

            {done ? (
              /* ── Success state ── */
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.30)' }}>
                  <CheckCircle size={26} style={{ color: '#34d399' }} />
                </div>
                <h2 className="text-white font-bold text-lg mb-2">Password Changed!</h2>
                <p className="text-sm mb-1" style={{ color: 'rgba(148,163,184,0.85)' }}>
                  Password changed successfully. Please login.
                </p>
                <p className="text-xs mb-5" style={{ color: 'rgba(110,231,183,0.60)' }}>
                  Redirecting to login…
                </p>
                <button onClick={() => navigate('/login')}
                  className="w-full py-3 rounded-2xl text-sm font-semibold text-white transition-opacity hover:opacity-80"
                  style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.28)' }}>
                  Go to Login
                </button>
              </div>
            ) : (
              /* ── Form state ── */
              <>
                <h2 className="mb-0.5" style={{
                  fontFamily: "'Dancing Script', cursive",
                  fontSize: 'clamp(1.4rem, 4.5vw, 1.8rem)', fontWeight: 700,
                  background: 'linear-gradient(135deg,#ffffff 0%,#d1fae5 50%,#6ee7b7 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>Reset Password</h2>
                <p className="text-xs sm:text-sm mb-6" style={{ color: 'rgba(30,40,50,0.65)' }}>
                  Choose a strong new password (min. 8 characters).
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.22em] mb-2"
                      style={{ color: 'rgba(255,255,255,0.70)' }}>
                      New Password
                    </label>
                    <GlassInput
                      icon={Lock} type={showPw ? 'text' : 'password'}
                      value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="Min. 8 characters" required autoComplete="new-password"
                      rightSlot={
                        <button type="button" onClick={() => setShowPw(!showPw)}
                          className="transition-all duration-200 p-1.5 rounded-lg mr-1"
                          style={{ color: showPw ? 'rgba(52,211,153,0.90)' : 'rgba(148,163,184,0.60)', background: showPw ? 'rgba(52,211,153,0.10)' : 'transparent' }}>
                          {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.22em] mb-2"
                      style={{ color: 'rgba(255,255,255,0.70)' }}>
                      Confirm Password
                    </label>
                    <GlassInput
                      icon={Lock} type={showCf ? 'text' : 'password'}
                      value={confirm} onChange={e => setConfirm(e.target.value)}
                      placeholder="Repeat password" required autoComplete="new-password"
                      rightSlot={
                        <button type="button" onClick={() => setShowCf(!showCf)}
                          className="transition-all duration-200 p-1.5 rounded-lg mr-1"
                          style={{ color: showCf ? 'rgba(52,211,153,0.90)' : 'rgba(148,163,184,0.60)', background: showCf ? 'rgba(52,211,153,0.10)' : 'transparent' }}>
                          {showCf ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      }
                    />
                  </div>

                  {error && (
                    <p className="text-xs px-1" style={{ color: '#f87171' }}>{error}</p>
                  )}

                  <button type="submit" disabled={loading}
                    className="w-full py-3.5 rounded-2xl text-white text-sm font-semibold mt-1 transition-opacity"
                    style={{
                      background: 'rgba(255,255,255,0.22)', backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.38)',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.45)',
                      opacity: loading ? 0.75 : 1, cursor: loading ? 'not-allowed' : 'pointer',
                    }}>
                    {loading ? 'Saving…' : 'Change Password'}
                  </button>
                </form>
              </>
            )}
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
  );
}
