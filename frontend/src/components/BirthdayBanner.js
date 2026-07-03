import React, { useEffect, useState } from 'react';
import api from '../api';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const CFG = {
  0: { badge: 'Today! 🎉',    color: '#fbbf24', glow: 'rgba(251,191,36,0.30)', msg: 'Wishing you a wonderful birthday!' },
  1: { badge: 'Tomorrow 🎈',  color: '#fb923c', glow: 'rgba(251,146,60,0.25)', msg: "Birthday's just around the corner!" },
  2: { badge: 'In 2 Days 🎁', color: '#fcd34d', glow: 'rgba(252,211,77,0.22)', msg: 'Get ready to celebrate soon!' },
};

const BALLOON_IMG = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT5wfRdOxSyRLBqDDkRvkjQh-FGS9CBsCMPZCUyWhFOqw&s=10';

export default function BirthdayBanner() {
  const [people, setPeople] = useState([]);

  useEffect(() => {
    api.get('/member/birthdays/upcoming')
      .then(r => setPeople(r.data || []))
      .catch(() => {});
  }, []);

  if (people.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes floatBalloon {
          0%, 100% { transform: translateY(0px) rotate(-4deg); }
          50%       { transform: translateY(-7px) rotate(4deg); }
        }
        @keyframes bdayFadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmerMove {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>

      <div className="space-y-2.5" style={{ animation: 'bdayFadeIn 0.4s ease' }}>
        {people.map((p) => {
          const cfg = CFG[p.daysLeft] ?? CFG[2];
          const [mm, dd] = p.birthday.split('-').map(Number);
          const dateLabel = `${dd} ${MONTHS[mm - 1]}`;

          return (
            <div key={p._id} className="relative overflow-hidden rounded-[22px]"
              style={{
                /* iOS-style frosted glass */
                background: 'rgba(30, 20, 5, 0.55)',
                backdropFilter: 'blur(40px) saturate(180%)',
                WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                border: `1px solid rgba(251,191,36,0.22)`,
                boxShadow: `0 8px 32px ${cfg.glow}, 0 1px 0 rgba(255,255,255,0.10) inset, 0 -1px 0 rgba(0,0,0,0.20) inset`,
              }}>

              {/* Shimmer sweep */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[22px]">
                <div style={{
                  position: 'absolute', top: 0, left: 0, width: '40%', height: '100%',
                  background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.07) 50%, transparent 70%)',
                  animation: 'shimmerMove 3.5s ease-in-out infinite',
                }} />
              </div>

              {/* Top highlight line */}
              <div className="absolute top-0 left-6 right-6 h-px rounded-full"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.30), transparent)' }} />

              {/* Subtle warm glow bg */}
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: `radial-gradient(ellipse at 80% 50%, ${cfg.glow} 0%, transparent 65%)` }} />

              <div className="relative flex items-center gap-3 px-4 py-3.5">

                {/* Balloon image — floating */}
                <div className="flex-shrink-0" style={{ animation: 'floatBalloon 3s ease-in-out infinite' }}>
                  <img
                    src={BALLOON_IMG}
                    alt="balloon"
                    className="w-12 h-12 object-contain"
                    style={{ filter: `drop-shadow(0 4px 12px ${cfg.glow})` }}
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-bold text-[15px] leading-tight">{p.name}</span>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full leading-none flex-shrink-0"
                      style={{
                        background: `${cfg.color}20`,
                        color: cfg.color,
                        border: `1px solid ${cfg.color}50`,
                        boxShadow: `0 0 12px ${cfg.glow}`,
                        letterSpacing: '0.02em',
                      }}>
                      {cfg.badge}
                    </span>
                  </div>
                  <p className="text-[12px] mt-1 leading-tight font-medium" style={{ color: 'rgba(253,230,138,0.70)' }}>
                    🗓 {dateLabel} · {cfg.msg}
                  </p>
                </div>

                {/* Right cake emoji */}
                <span className="text-2xl flex-shrink-0 select-none" style={{ filter: 'drop-shadow(0 2px 6px rgba(251,191,36,0.4))' }}>🎂</span>
              </div>

              {/* Bottom glow line */}
              <div className="absolute bottom-0 left-8 right-8 h-px"
                style={{ background: `linear-gradient(90deg, transparent, ${cfg.color}40, transparent)` }} />
            </div>
          );
        })}
      </div>
    </>
  );
}
