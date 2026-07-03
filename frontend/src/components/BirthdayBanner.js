import React, { useEffect, useState, useCallback } from 'react';
import api from '../api';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const BALLOON_IMG = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT5wfRdOxSyRLBqDDkRvkjQh-FGS9CBsCMPZCUyWhFOqw&s=10';

// Right-side GIFs per daysLeft
const RIGHT_GIF = {
  2: 'https://media.tenor.com/IavKWJp8FJEAAAAM/meme-coffee.gif',
  1: 'https://miro.medium.com/1*IPsjgr1uwUGNcbvWYGeUwA.gif',
  0: 'https://i.pinimg.com/originals/9a/9c/03/9a9c03ad9ec52915de81679da7c7ace4.gif',
};

function msUntilMidnight() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) - now;
}

export default function BirthdayBanner() {
  const [people, setPeople] = useState([]);

  const fetchBirthdays = useCallback(() => {
    api.get('/member/birthdays/upcoming')
      .then(r => setPeople(r.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchBirthdays();
    const t = setTimeout(fetchBirthdays, msUntilMidnight() + 500);
    return () => clearTimeout(t);
  }, [fetchBirthdays]);

  if (people.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes floatBalloon {
          0%, 100% { transform: translateY(0px) rotate(-3deg); }
          50%       { transform: translateY(-6px) rotate(3deg); }
        }
        @keyframes marqueeScroll {
          0%   { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        @keyframes riseUp {
          0%   { transform: translateY(60px); opacity: 0; }
          60%  { transform: translateY(-6px); opacity: 1; }
          80%  { transform: translateY(3px); }
          100% { transform: translateY(0px); opacity: 1; }
        }
        @keyframes bdayBlink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0.25; }
        }
      `}</style>

      <div className="space-y-2.5">
        {people.map((p) => {
          const [mm, dd] = p.birthday.split('-').map(Number);
          const dateLabel = `${dd} ${MONTHS[mm - 1]}`;
          const isToday = p.daysLeft === 0;

          const badge =
            isToday       ? '🎉 Birthday Today!' :
            p.daysLeft === 1 ? '🎈 Birthday Tomorrow' :
                               '🎁 Birthday in 2 Days';

          const scrollText =
            isToday
              ? `🎉 Happy Birthday ${p.name}!  🎂 Wishing you a wonderful birthday!  🗓 ${dateLabel}  🎊 Have an amazing day!  🎈`
              : p.daysLeft === 1
              ? `🎈 ${p.name}'s birthday is tomorrow!  🗓 ${dateLabel}  🎁 Get ready to celebrate!  🎂 Don't forget to wish!  🎊`
              : `🎁 ${p.name}'s birthday is coming in 2 days!  🗓 ${dateLabel}  🎈 Start planning the celebration!  🎂 Don't forget to wish!  🎉`;

          const fullText = `${scrollText}     ${scrollText}`;
          const duration = `${Math.max(18, scrollText.length * 0.22)}s`;
          const gifSrc   = RIGHT_GIF[p.daysLeft] ?? RIGHT_GIF[2];

          // today: rise-up then blink; others: just float
          const gifStyle = isToday
            ? {
                animation: 'riseUp 1.2s cubic-bezier(0.22,1,0.36,1) forwards, bdayBlink 1.2s step-end 1.2s infinite',
              }
            : {
                animation: 'floatBalloon 3s ease-in-out infinite',
              };

          return (
            <div key={p._id} className="relative overflow-hidden rounded-2xl"
              style={{
                background: 'rgba(255,255,255,0.18)',
                backdropFilter: 'blur(40px)',
                WebkitBackdropFilter: 'blur(40px)',
                border: '1px solid rgba(255,255,255,0.28)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.35)',
              }}>

              {/* Top shimmer */}
              <div className="absolute top-0 left-0 right-0 h-px"
                style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.60),transparent)' }} />
              <div className="absolute top-0 left-0 right-0 h-1/2 pointer-events-none"
                style={{ background: 'linear-gradient(180deg,rgba(255,255,255,0.10) 0%,transparent 100%)' }} />

              {/* Main row */}
              <div className="relative flex items-center gap-2.5 px-3 pt-3 pb-2">

                {/* Balloon — left */}
                <div className="flex-shrink-0" style={{ animation: 'floatBalloon 3s ease-in-out infinite' }}>
                  <img src={BALLOON_IMG} alt="balloon" className="w-10 h-10 sm:w-14 sm:h-14 object-contain"
                    onError={e => { e.target.style.display = 'none'; }} />
                </div>

                {/* Name + badge */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white leading-tight truncate" style={{ fontSize: '15px' }}>
                    {p.name}
                  </p>
                  <span className="inline-block font-semibold px-2 py-0.5 rounded-full mt-0.5"
                    style={{
                      fontSize: '10px',
                      background: 'rgba(255,255,255,0.18)',
                      color: 'rgba(255,255,255,0.88)',
                      border: '1px solid rgba(255,255,255,0.28)',
                    }}>
                    {badge}
                  </span>
                </div>

                {/* Right GIF */}
                <div className="flex-shrink-0 overflow-hidden"
                  style={{ width: 64, height: 64, borderRadius: 12 }}>
                  <img
                    src={gifSrc}
                    alt="status"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', ...gifStyle }}
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                </div>
              </div>

              {/* Scrolling ticker */}
              <div className="relative overflow-hidden pb-3"
                style={{ borderTop: '1px solid rgba(255,255,255,0.10)' }}>
                <div className="absolute left-0 top-0 bottom-0 w-8 z-10 pointer-events-none"
                  style={{ background: 'linear-gradient(90deg,rgba(255,255,255,0.18),transparent)' }} />
                <div className="absolute right-0 top-0 bottom-0 w-8 z-10 pointer-events-none"
                  style={{ background: 'linear-gradient(270deg,rgba(255,255,255,0.18),transparent)' }} />

                <div className="flex pt-1.5"
                  style={{ animation: `marqueeScroll ${duration} linear infinite`, whiteSpace: 'nowrap', willChange: 'transform' }}>
                  <span style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.68)', fontWeight: 500, paddingRight: '2rem' }}>
                    {fullText}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
