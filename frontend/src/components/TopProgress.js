import React, { useEffect, useState } from 'react';

// Thin top progress bar — shown during lazy chunk loading
// Much less jarring than a full-screen spinner
let _start = null;
let _set = null;

export function startProgress() {
  if (_set) _set(10);
  _start = Date.now();
}
export function doneProgress() {
  if (_set) _set(100);
}

export default function TopProgress() {
  const [pct, setPct] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    _set = (v) => {
      if (v === 10) { setVisible(true); setPct(10); }
      if (v === 100) {
        setPct(100);
        setTimeout(() => { setVisible(false); setPct(0); }, 300);
      }
    };
    return () => { _set = null; };
  }, []);

  // Trickle forward while loading
  useEffect(() => {
    if (!visible || pct >= 90) return;
    const t = setTimeout(() => setPct(p => Math.min(p + Math.random() * 15, 90)), 300);
    return () => clearTimeout(t);
  }, [visible, pct]);

  if (!visible && pct === 0) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: 2,
      zIndex: 99999, pointerEvents: 'none',
    }}>
      <div style={{
        height: '100%',
        width: `${pct}%`,
        background: 'linear-gradient(90deg, #10b981, #34d399)',
        boxShadow: '0 0 8px rgba(16,185,129,0.8)',
        transition: pct === 100 ? 'width 0.1s ease, opacity 0.3s ease' : 'width 0.3s ease',
        opacity: pct === 100 ? 0 : 1,
        borderRadius: '0 2px 2px 0',
      }} />
    </div>
  );
}
