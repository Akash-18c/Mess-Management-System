import React from 'react';

export default function PageLoader({ text = 'Loading…' }) {
  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-5"
      style={{ background: '#0a0f1e' }}
    >
      <div className="relative flex items-center justify-center">
        {/* outer glow ring */}
        <div className="absolute w-20 h-20 rounded-full animate-ping"
          style={{ background: 'rgba(34,197,94,0.08)', animationDuration: '1.6s' }} />
        {/* spinner */}
        <div className="w-16 h-16 rounded-full border-2 border-green-500/20 border-t-green-400 animate-spin" />
        {/* logo */}
        <img
          src="/messy-logo.png"
          alt="logo"
          className="absolute w-9 h-9 object-contain"
          onError={e => { e.target.style.display = 'none'; }}
        />
      </div>
      <p className="text-slate-400 text-sm tracking-wide">{text}</p>
    </div>
  );
}
