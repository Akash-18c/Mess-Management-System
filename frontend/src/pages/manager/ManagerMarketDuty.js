import React, { useEffect, useState } from 'react';
import { Send } from 'lucide-react';
import api from '../../api';
import toast from 'react-hot-toast';
import { buildWaLink } from '../../hooks/useMarketDutyNotifier';
import useAuthStore from '../../store/authStore';

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const rn = (name) => { const m = name?.match(/^\w+\s*\((.+)\)$/); return m ? m[1] : (name || ''); };

const cardGlass = {
  background: 'rgba(255,255,255,0.18)',
  backdropFilter: 'blur(40px)',
  WebkitBackdropFilter: 'blur(40px)',
  border: '1px solid rgba(255,255,255,0.28)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.35)',
};

function PersonCard({ d, isLunch, onSend }) {
  const name      = rn(d.memberId?.name);
  const avatarBg  = isLunch ? 'rgba(251,191,36,0.25)' : 'rgba(99,102,241,0.25)';
  const avatarClr = isLunch ? '#fcd34d'               : '#a5b4fc';

  return (
    <div className="relative rounded-2xl p-3 overflow-hidden"
      style={{ background: 'rgba(0,0,0,0.20)', border: '1px solid rgba(255,255,255,0.15)' }}>
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.40),transparent)' }} />

      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
          style={{ background: avatarBg, color: avatarClr }}>
          {name?.[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm">{name}</p>
          <p className="text-slate-300 text-xs mt-0.5">⏰ {d.time}{d.note ? ` · ${d.note}` : ''}</p>
        </div>
      </div>

      <button onClick={() => onSend(d)}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold active:scale-95 transition-transform"
        style={{ background: 'rgba(37,211,102,0.25)', border: '1px solid rgba(37,211,102,0.55)', color: '#22c55e', boxShadow: '0 0 12px rgba(37,211,102,0.15)' }}>
        <Send size={14} /> Send WhatsApp
      </button>
    </div>
  );
}

function MealSection({ meal, duties, onSend }) {
  const isLunch  = meal === 'lunch';
  const label    = isLunch ? '☀️ Lunch' : '🌙 Dinner';
  const color    = isLunch ? '#fcd34d'  : '#a5b4fc';
  const borderC  = isLunch ? 'rgba(251,191,36,0.35)' : 'rgba(99,102,241,0.35)';
  const bgC      = isLunch ? 'rgba(251,191,36,0.07)' : 'rgba(99,102,241,0.07)';

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: bgC, border: `1px solid ${borderC}` }}>
      <div className="px-4 py-2.5" style={{ borderBottom: `1px solid ${borderC}` }}>
        <span className="text-sm font-bold" style={{ color }}>{label}</span>
      </div>
      {duties.length === 0 ? (
        <p className="text-center text-slate-400 text-sm py-5">No duty assigned</p>
      ) : (
        <div className="p-3 space-y-2">
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
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: 'rgba(245,158,11,0.18)', border: '1px solid rgba(245,158,11,0.35)' }}>
            🛒
          </div>
          <div>
            <h1 className="font-bold text-white text-base">Market Duty</h1>
            <p className="text-slate-300 text-xs opacity-70">Weekly schedule · Tap Send to notify</p>
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
              <div className="px-4 py-3 flex items-center gap-2"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.12)', background: 'rgba(245,158,11,0.08)' }}>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
                <p className="text-sm font-bold text-amber-300">Today — {DAYS[todayDay]}</p>
              </div>
              <div className="p-3 space-y-3">
                {['lunch','dinner'].map(meal => {
                  const dd = todayDuties.filter(d => d.meal === meal);
                  if (!dd.length) return null;
                  return <MealSection key={meal} meal={meal} duties={dd} onSend={sendWhatsApp} />;
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
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.14)', background: 'rgba(0,0,0,0.15)' }}>
                    <span className="text-sm font-bold text-white">{DAYS[day]}</span>
                    {day === todayDay && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(245,158,11,0.22)', color: '#fcd34d', border: '1px solid rgba(245,158,11,0.45)' }}>TODAY</span>
                    )}
                    <span className="ml-auto text-xs font-medium text-slate-400">
                      {lunch.length + dinner.length} {lunch.length + dinner.length === 1 ? 'person' : 'people'}
                    </span>
                  </div>
                  {/* Lunch then Dinner — stacked vertically, full width */}
                  <div className="p-3 space-y-3">
                    <MealSection meal="lunch"  duties={lunch}  onSend={sendWhatsApp} />
                    <MealSection meal="dinner" duties={dinner} onSend={sendWhatsApp} />
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
