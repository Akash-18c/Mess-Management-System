import React, { useEffect, useState } from 'react';
import { ShoppingCart, Send } from 'lucide-react';
import api from '../../api';
import toast from 'react-hot-toast';
import { buildWaLink } from '../../hooks/useMarketDutyNotifier';
import useAuthStore from '../../store/authStore';

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

const glass = {
  background: 'rgba(255,255,255,0.08)',
  backdropFilter: 'blur(40px)',
  WebkitBackdropFilter: 'blur(40px)',
  border: '1px solid rgba(255,255,255,0.18)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.25)',
};

const rn = (name) => { const m = name?.match(/^\w+\s*\((.+)\)$/); return m ? m[1] : (name || ''); };

function MealSlot({ meal, duties, onSend }) {
  const isLunch = meal === 'lunch';
  const accent  = isLunch ? 'rgba(251,191,36,0.18)' : 'rgba(99,102,241,0.18)';
  const border  = isLunch ? 'rgba(251,191,36,0.30)' : 'rgba(99,102,241,0.30)';
  const color   = isLunch ? '#fcd34d'               : '#a5b4fc';
  const label   = isLunch ? '☀️ Lunch'             : '🌙 Dinner';

  return (
    <div className="flex-1 rounded-2xl overflow-hidden" style={{ background: accent, border: `1px solid ${border}`, minWidth: 0 }}>
      <div className="px-3 py-2" style={{ borderBottom: `1px solid ${border}` }}>
        <span className="text-xs font-bold" style={{ color }}>{label}</span>
      </div>
      {duties.length === 0 ? (
        <div className="px-3 py-3 text-center text-slate-600 text-xs">No duty</div>
      ) : (
        <div className="p-2 space-y-1.5">
          {duties.map(d => (
            <div key={d._id} className="rounded-xl px-2.5 py-2"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
                  style={{ background: 'rgba(255,255,255,0.12)' }}>
                  {rn(d.memberId?.name)?.[0]?.toUpperCase()}
                </div>
                <p className="text-white font-semibold text-xs truncate flex-1">{rn(d.memberId?.name)}</p>
              </div>
              <p className="text-slate-500 text-[10px] mb-2">⏰ {d.time}{d.note ? ` · ${d.note}` : ''}</p>
              <div className="flex items-center gap-1">
                <button onClick={() => onSend(d, false)}
                  className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg text-[10px] font-bold transition-all active:scale-95"
                  style={{ background: 'rgba(37,211,102,0.18)', border: '1px solid rgba(37,211,102,0.30)', color: '#25d366' }}>
                  <Send size={10} /> Send
                </button>
                {isLunch && (
                  <button onClick={() => onSend(d, true)}
                    className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg text-[10px] font-bold transition-all active:scale-95"
                    style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.28)', color: '#c4b5fd' }}>
                    🌙 Tonight
                  </button>
                )}
              </div>
            </div>
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

  const sendWhatsApp = (duty, isNightBefore = false) => {
    const url = buildWaLink(duty, isNightBefore, user);
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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 rounded-2xl p-4" style={glass}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.25)' }}>
          <ShoppingCart size={18} className="text-amber-400" />
        </div>
        <div>
          <h1 className="font-bold text-white text-base leading-tight">Market Duty</h1>
          <p className="text-slate-500 text-xs mt-0.5">Weekly grocery schedule · Tap Send to notify via WhatsApp</p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl p-10 text-center text-slate-500 text-sm" style={glass}>Loading...</div>
      ) : (
        <>
          {/* Today banner */}
          {todayDuties.length > 0 && (
            <div className="rounded-2xl overflow-hidden" style={{ ...glass, border: '1px solid rgba(245,158,11,0.35)' }}>
              <div className="px-4 py-2.5 flex items-center gap-2"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.10)', background: 'rgba(245,158,11,0.08)' }}>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <p className="text-sm font-bold text-amber-300">Today's Duty — {DAYS[todayDay]}</p>
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

          {/* Weekly schedule */}
          {byDay.length === 0 ? (
            <div className="rounded-2xl p-10 text-center text-slate-600 text-sm" style={glass}>
              No duties scheduled yet. Ask admin to set up the schedule.
            </div>
          ) : (
            <div className="space-y-3">
              {byDay.map(({ day, lunch, dinner }) => (
                <div key={day} className="rounded-2xl overflow-hidden" style={glass}>
                  <div className="px-4 py-2.5 flex items-center gap-2"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.04)' }}>
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">{DAYS[day]}</span>
                    {day === todayDay && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(245,158,11,0.20)', color: '#fcd34d', border: '1px solid rgba(245,158,11,0.35)' }}>TODAY</span>
                    )}
                    <span className="ml-auto text-[10px] text-slate-600">
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
