import React, { useEffect, useState } from 'react';
import { ShoppingCart, Send } from 'lucide-react';
import api from '../../api';
import toast from 'react-hot-toast';
import { buildWaLink } from '../../hooks/useMarketDutyNotifier';
import useAuthStore from '../../store/authStore';

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const rn = (name) => { const m = name?.match(/^\w+\s*\((.+)\)$/); return m ? m[1] : (name || ''); };

// Same glass as BirthdayBanner
const cardGlass = {
  background: 'rgba(255,255,255,0.18)',
  backdropFilter: 'blur(40px)',
  WebkitBackdropFilter: 'blur(40px)',
  border: '1px solid rgba(255,255,255,0.28)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.35)',
};

function PersonCard({ d, isLunch, onSend }) {
  const avatarBg  = isLunch ? 'rgba(251,191,36,0.22)'  : 'rgba(99,102,241,0.22)';
  const avatarBdr = isLunch ? 'rgba(251,191,36,0.45)'  : 'rgba(99,102,241,0.45)';
  const avatarClr = isLunch ? '#fcd34d'                : '#a5b4fc';
  const name = rn(d.memberId?.name);

  return (
    <div className="relative rounded-2xl p-2.5 overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.10)',
        border: '1px solid rgba(255,255,255,0.18)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.20)',
      }}>
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.45),transparent)' }} />

      {/* Avatar + name */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{ background: avatarBg, border: `1.5px solid ${avatarBdr}`, color: avatarClr }}>
          {name?.[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-xs leading-tight" style={{ wordBreak: 'break-word' }}>{name}</p>
          <p className="text-slate-300 text-[10px]">{d.time}{d.note ? ` · ${d.note}` : ''}</p>
        </div>
      </div>

      {/* Send button — full width */}
      <button onClick={() => onSend(d)}
        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold active:scale-95 transition-transform"
        style={{ background: 'rgba(37,211,102,0.22)', border: '1px solid rgba(37,211,102,0.50)', color: '#22c55e', boxShadow: '0 0 10px rgba(37,211,102,0.10)' }}>
        <Send size={11} /> Send
      </button>
    </div>
  );
}

function MealSlot({ meal, duties, onSend }) {
  const isLunch = meal === 'lunch';
  const color   = isLunch ? '#fcd34d' : '#a5b4fc';
  const border  = isLunch ? 'rgba(251,191,36,0.30)' : 'rgba(99,102,241,0.30)';
  const bg      = isLunch ? 'rgba(251,191,36,0.08)'  : 'rgba(99,102,241,0.08)';
  const label   = isLunch ? '☀️ Lunch' : '🌙 Dinner';

  return (
    <div className="flex-1 rounded-2xl overflow-hidden" style={{ background: bg, border: `1px solid ${border}`, minWidth: 0 }}>
      <div className="px-3 py-2" style={{ borderBottom: `1px solid ${border}` }}>
        <span className="text-xs font-bold" style={{ color }}>{label}</span>
      </div>
      {duties.length === 0 ? (
        <p className="text-center text-slate-500 text-xs py-4">No duty</p>
      ) : (
        <div className="p-2 space-y-2">
          {duties.map(d => (
            <PersonCard key={d._id} d={d} isLunch={isLunch} onSend={onSend} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ManagerMarketDuty() {
  const [duties, setDuties] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    api.get('/member/market-duty')
      .then(r => setDuties(r.data || []))
      .catch(() => toast.error('Failed to load duties'))
      .finally(() => setLoading(false));
  }, []);

  const sendWhatsApp = (duty) => {
    const url = buildWaLink(duty, false, user);
    if (!url) return toast.error('No phone number for this member');
    window.open(url, '_blank');
  };

  const todayDay = new Date().getDay();
  const todayDuties = duties.filter(d => d.dayOfWeek === todayDay);
  const byDay = Array.from({ length: 7 }, (_, i) => ({
    day: i,
    lunch:  duties.filter(d => d.dayOfWeek === i && d.meal === 'lunch'),
    dinner: duties.filter(d => d.dayOfWeek === i && d.meal === 'dinner'),
  })).filter(g => g.lunch.length > 0 || g.dinner.length > 0);

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="relative rounded-2xl overflow-hidden p-4" style={cardGlass}>
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.60),transparent)' }} />
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 text-xl"
            style={{ background: 'rgba(245,158,11,0.18)', border: '1px solid rgba(245,158,11,0.35)' }}>
            🛒
          </div>
          <div>
            <h1 className="font-bold text-white text-base leading-tight">Market Duty</h1>
            <p className="text-slate-300 text-xs mt-0.5 opacity-70">Weekly schedule · Tap Send to notify</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="relative rounded-2xl overflow-hidden p-12 text-center" style={cardGlass}>
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.60),transparent)' }} />
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-300 text-sm">Loading duties...</p>
        </div>
      ) : (
        <>
          {/* ── Today Banner ── */}
          {todayDuties.length > 0 && (
            <div className="relative rounded-2xl overflow-hidden" style={{ ...cardGlass, border: '1px solid rgba(245,158,11,0.45)' }}>
              <div className="absolute top-0 left-0 right-0 h-px"
                style={{ background: 'linear-gradient(90deg,transparent,rgba(245,158,11,0.70),transparent)' }} />
              <div className="px-4 py-2.5 flex items-center gap-2"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.12)', background: 'rgba(245,158,11,0.08)' }}>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
                <p className="text-sm font-bold text-amber-300">Today — {DAYS[todayDay]}</p>
              </div>
              <div className="p-3 flex gap-3">
                {['lunch','dinner'].map(meal => {
                  const dd = todayDuties.filter(d => d.meal === meal);
                  if (!dd.length) return null;
                  return <MealSlot key={meal} meal={meal} duties={dd} onSend={sendWhatsApp} />;
                })}
              </div>
            </div>
          )}

          {/* ── Weekly Schedule ── */}
          {byDay.length === 0 ? (
            <div className="relative rounded-2xl overflow-hidden p-12 text-center" style={cardGlass}>
              <div className="absolute top-0 left-0 right-0 h-px"
                style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.60),transparent)' }} />
              <p className="text-4xl mb-3">🛒</p>
              <p className="text-white font-semibold text-sm">No duties scheduled yet</p>
              <p className="text-slate-400 text-xs mt-1">Ask admin to set up the schedule</p>
            </div>
          ) : (
            <div className="space-y-3">
              {byDay.map(({ day, lunch, dinner }) => (
                <div key={day} className="relative rounded-2xl overflow-hidden" style={cardGlass}>
                  <div className="absolute top-0 left-0 right-0 h-px"
                    style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.60),transparent)' }} />
                  <div className="px-4 py-3 flex items-center gap-2"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.05)' }}>
                    <span className="text-sm font-bold text-white">{DAYS[day]}</span>
                    {day === todayDay && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(245,158,11,0.22)', color: '#fcd34d', border: '1px solid rgba(245,158,11,0.45)' }}>TODAY</span>
                    )}
                    <span className="ml-auto text-[11px] font-medium" style={{ color: 'rgba(148,163,184,0.60)' }}>
                      {lunch.length + dinner.length} {lunch.length + dinner.length === 1 ? 'person' : 'people'}
                    </span>
                  </div>
                  <div className="p-3 flex gap-3">
                    <MealSlot meal="lunch"  duties={lunch}  onSend={sendWhatsApp} />
                    <MealSlot meal="dinner" duties={dinner} onSend={sendWhatsApp} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
