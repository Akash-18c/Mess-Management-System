import React, { useEffect, useState } from 'react';
import api from '../api';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const BADGE = {
  0: 'Today! 🎉',
  1: 'Tomorrow 🎈',
  2: 'In 2 Days 🎁',
};

const MSG = {
  0: 'Wishing you a wonderful birthday!',
  1: "Birthday's just around the corner!",
  2: 'Get ready to celebrate soon!',
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
          0%, 100% { transform: translateY(0px) rotate(-3deg); }
          50%       { transform: translateY(-6px) rotate(3deg); }
        }
      `}</style>

      <div className="space-y-2.5">
        {people.map((p) => {
          const [mm, dd] = p.birthday.split('-').map(Number);
          const dateLabel = `${dd} ${MONTHS[mm - 1]}`;
          const badge = BADGE[p.daysLeft] ?? BADGE[2];
          const msg   = MSG[p.daysLeft]   ?? MSG[2];

          return (
            <div key={p._id} className="relative overflow-hidden rounded-[28px]"
              style={{
                background: 'rgba(255,255,255,0.18)',
                backdropFilter: 'blur(40px)',
                WebkitBackdropFilter: 'blur(40px)',
                border: '1px solid rgba(255,255,255,0.28)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.35)',
              }}>

              {/* Top shimmer — same as login card */}
              <div className="absolute top-0 left-0 right-0 h-px"
                style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.60),transparent)' }} />
              {/* Inner top highlight */}
              <div className="absolute top-0 left-0 right-0 h-1/2 pointer-events-none"
                style={{ background: 'linear-gradient(180deg,rgba(255,255,255,0.10) 0%,transparent 100%)' }} />

              <div className="relative flex items-center gap-3 px-4 py-3.5">

                {/* Balloon */}
                <div className="flex-shrink-0" style={{ animation: 'floatBalloon 3s ease-in-out infinite' }}>
                  <img
                    src={BALLOON_IMG}
                    alt="balloon"
                    className="w-11 h-11 object-contain"
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white text-[15px] leading-tight">{p.name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full leading-none flex-shrink-0"
                      style={{
                        background: 'rgba(255,255,255,0.20)',
                        color: 'rgba(255,255,255,0.90)',
                        border: '1px solid rgba(255,255,255,0.30)',
                      }}>
                      {badge}
                    </span>
                  </div>
                  <p className="text-[11px] mt-0.5 leading-tight" style={{ color: 'rgba(255,255,255,0.60)' }}>
                    🗓 {dateLabel} · {msg}
                  </p>
                </div>

                {/* Cake */}
                <span className="text-2xl flex-shrink-0 select-none">🎂</span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
