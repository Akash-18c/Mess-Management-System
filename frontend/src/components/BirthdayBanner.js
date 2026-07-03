import React, { useEffect, useState } from 'react';
import api from '../api';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const DAY_CONFIG = {
  0: { label: "🎉 Birthday Today!",  badge: 'Today',     color: '#fbbf24', glow: 'rgba(251,191,36,0.35)' },
  1: { label: "🎈 Birthday Tomorrow", badge: 'Tomorrow',  color: '#fb923c', glow: 'rgba(251,146,60,0.30)' },
  2: { label: "🎁 Birthday in 2 Days",badge: 'In 2 Days', color: '#fcd34d', glow: 'rgba(252,211,77,0.25)' },
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
    <div className="px-4 pt-3 pb-0 lg:px-6">
      <div className="relative overflow-hidden rounded-2xl"
        style={{
          background: 'linear-gradient(135deg,rgba(251,191,36,0.10) 0%,rgba(245,158,11,0.06) 50%,rgba(217,119,6,0.10) 100%)',
          border: '1px solid rgba(251,191,36,0.22)',
          boxShadow: '0 4px 24px rgba(245,158,11,0.08)',
        }}>

        {/* Top shimmer */}
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg,transparent,rgba(251,191,36,0.55),transparent)' }} />

        <div className="flex items-stretch gap-0">
          {/* Left accent bar */}
          <div className="w-1 flex-shrink-0 rounded-l-2xl"
            style={{ background: 'linear-gradient(180deg,#fbbf24,#f59e0b,#d97706)' }} />

          <div className="flex-1 px-3.5 py-3">
            {people.map((p, i) => {
              const [mm, dd] = p.birthday.split('-').map(Number);
              const dateLabel = `${dd} ${MONTHS[mm - 1]}`;
              const cfg = DAY_CONFIG[p.daysLeft] || DAY_CONFIG[2];

              return (
                <div key={p._id}
                  className={`flex items-center gap-3 flex-wrap ${ i > 0 ? 'mt-2.5 pt-2.5' : ''}`}
                  style={i > 0 ? { borderTop: '1px solid rgba(251,191,36,0.10)' } : {}}>

                  {/* Animated cake */}
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 rounded-full animate-ping opacity-60"
                      style={{ background: cfg.glow, animationDuration: '2.2s' }} />
                    <div className="relative w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                      style={{ background: `rgba(251,191,36,0.12)`, border: `1px solid rgba(251,191,36,0.22)` }}>
                      🎂
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-bold text-sm leading-tight">{p.name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full leading-tight flex-shrink-0"
                        style={{
                          background: `${cfg.color}18`,
                          color: cfg.color,
                          border: `1px solid ${cfg.color}40`,
                          boxShadow: `0 0 8px ${cfg.glow}`,
                        }}>
                        {cfg.badge}
                      </span>
                    </div>
                    <p className="text-[11px] mt-0.5 leading-tight" style={{ color: 'rgba(253,230,138,0.65)' }}>
                      {cfg.label} &nbsp;·&nbsp; 🗓 {dateLabel}
                    </p>
                  </div>

                  {/* Wish text — hidden on very small screens */}
                  <p className="hidden sm:block text-[11px] font-medium flex-shrink-0"
                    style={{ color: 'rgba(251,191,36,0.55)' }}>
                    Wish them well! 🥳
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom glow */}
        <div className="absolute bottom-0 left-1/4 right-1/4 h-px"
          style={{ background: 'linear-gradient(90deg,transparent,rgba(251,191,36,0.25),transparent)' }} />
      </div>
    </div>
  );
}
