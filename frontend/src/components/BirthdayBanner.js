import React, { useEffect, useState } from 'react';
import api from '../api';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const CFG = {
  0: { emoji: '🎉', badge: 'Today!',     color: '#fbbf24', bg: 'rgba(251,191,36,0.14)', border: 'rgba(251,191,36,0.35)', glow: 'rgba(251,191,36,0.25)', msg: 'Wishing you a wonderful birthday!' },
  1: { emoji: '🎈', badge: 'Tomorrow',   color: '#fb923c', bg: 'rgba(251,146,60,0.12)', border: 'rgba(251,146,60,0.30)', glow: 'rgba(251,146,60,0.20)', msg: "Birthday's just around the corner!" },
  2: { emoji: '🎁', badge: 'In 2 Days',  color: '#fcd34d', bg: 'rgba(252,211,77,0.10)', border: 'rgba(252,211,77,0.25)', glow: 'rgba(252,211,77,0.18)', msg: 'Get ready to celebrate!' },
};

export default function BirthdayBanner() {
  const [people, setPeople] = useState([]);

  useEffect(() => {
    api.get('/member/birthdays/upcoming')
      .then(r => setPeople(r.data || []))
      .catch(() => {});
  }, []);

  if (people.length === 0) return null;

  return (
    <div className="px-4 pt-3 pb-0 lg:px-6 space-y-2.5">
      {people.map((p) => {
        const cfg = CFG[p.daysLeft] ?? CFG[2];
        const [mm, dd] = p.birthday.split('-').map(Number);
        const dateLabel = `${dd} ${MONTHS[mm - 1]}`;

        return (
          <div key={p._id} className="relative overflow-hidden rounded-2xl"
            style={{
              background: `linear-gradient(135deg, ${cfg.bg} 0%, rgba(0,0,0,0) 100%)`,
              border: `1px solid ${cfg.border}`,
              boxShadow: `0 4px 24px ${cfg.glow}, inset 0 1px 0 rgba(255,255,255,0.06)`,
            }}>

            {/* Top shimmer line */}
            <div className="absolute top-0 left-0 right-0 h-px"
              style={{ background: `linear-gradient(90deg,transparent,${cfg.color},transparent)`, opacity: 0.5 }} />

            {/* Decorative dots — top right */}
            <div className="absolute top-2 right-3 flex gap-1 opacity-30 pointer-events-none">
              {[0,1,2].map(i => (
                <div key={i} className="rounded-full"
                  style={{ width: 4, height: 4, background: cfg.color, opacity: 1 - i * 0.25 }} />
              ))}
            </div>

            <div className="flex items-stretch">
              {/* Left accent bar */}
              <div className="w-1 flex-shrink-0 rounded-l-2xl"
                style={{ background: `linear-gradient(180deg,${cfg.color},${cfg.color}88)` }} />

              <div className="flex-1 px-3.5 py-3 flex items-center gap-3">

                {/* Animated icon */}
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 rounded-2xl animate-ping opacity-40"
                    style={{ background: cfg.glow, animationDuration: '2.5s' }} />
                  <div className="relative w-10 h-10 rounded-2xl flex items-center justify-center text-xl"
                    style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                    {cfg.emoji}
                  </div>
                </div>

                {/* Text block */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-bold text-sm leading-tight">{p.name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full leading-none flex-shrink-0"
                      style={{
                        background: cfg.bg,
                        color: cfg.color,
                        border: `1px solid ${cfg.border}`,
                        boxShadow: `0 0 10px ${cfg.glow}`,
                      }}>
                      {cfg.badge}
                    </span>
                  </div>
                  <p className="text-[11px] mt-0.5 leading-tight" style={{ color: 'rgba(253,230,138,0.60)' }}>
                    🗓 {dateLabel} · {cfg.msg}
                  </p>
                </div>

                {/* Right emoji — hidden on xs */}
                <span className="hidden sm:block text-xl flex-shrink-0 opacity-60">🎂</span>
              </div>
            </div>

            {/* Bottom glow */}
            <div className="absolute bottom-0 left-1/3 right-1/3 h-px"
              style={{ background: `linear-gradient(90deg,transparent,${cfg.color}44,transparent)` }} />
          </div>
        );
      })}
    </div>
  );
}
