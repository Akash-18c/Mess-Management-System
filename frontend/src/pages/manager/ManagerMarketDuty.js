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

function PersonCard({ d, isLunch, onSend }) {
  return (
    <div className="rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 text-white"
          style={{ background: isLunch ? 'rgba(251,191,36,0.25)' : 'rgba(99,102,241,0.25)', border: isLunch ? '1px solid rgba(251,191,36,0.4)' : '1px solid rgba(99,102,241,0.4)' }}>
          {rn(d.memberId?.name)?.[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm truncate">{rn(d.memberId?.name)}</p>
          <p className="text-slate-400 text-xs">⏰ {d.time}{d.note ? ` · ${d.note}` : ''}</p>
        </div>
      </div>
      <button onClick={() => onSend(d)}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95"
        style={{ background: 'rgba(37,211,102,0.20)', border: '1px solid rgba(37,211,102,0.40)', color: '#22c55e', boxShadow: '0 0 12px rgba(37,211,102,0.10)' }}>
        <Send size={14} /> Send WhatsApp
      </button>
    </div>
  );
}

function MealSlot({ meal, duties, onSend }) {
  const isLunch = meal === 'lunch';
  const accent  = isLunch ? 'rgba(251,191,36,0.10)' : 'rgba(99,102,241,0.10)';
  const border  = isLunch ? 'rgba(251,191,36,0.25)' : 'rgba(99,102,241,0.25)';
  const color   = isLunch ? '#fcd34d'               : '#a5b4fc';
  const label   = isLunch ? '☀️ Lunch'             : '🌙 Dinner';

  return (
    <div className="flex-1 rounded-2xl overflow-hidden" style={{ background: accent, border: `1px solid ${border}`, minWidth: 0 }}>
      <div className="px-3 py-2.5" style={{ borderBottom: `1px solid ${border}` }}>
        <span className="text-xs font-bold tracking-wide" style={{ color }}>{label}</span>
      </div>
      {duties.length === 0 ? (
        <div className="px-3 py-4 text-center text-slate-600 text-xs">No duty assigned</div>
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

      {/* Header */}
      <div className="flex items-center gap-3 rounded-2xl p-4" style={glass}>
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.30)' }}>
          <ShoppingCart size={20} className="text-amber-400" />
        </div>
        <div>
          <h1 className="font-bold text-white text-base leading-tight">Market Duty</h1>
          <p className="text-slate-500 text-xs mt-0.5">Weekly schedule · Tap Send to notify</p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl p-12 text-center" style={glass}>
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Loading duties...</p>
        </div>
      ) : (
        <>
          {/* Today banner */}
          {todayDuties.length > 0 && (
            <div className="rounded-2xl overflow-hidden" style={{ ...glass, border: '1px solid rgba(245,158,11,0.40)' }}>
              <div className="px-4 py-3 flex items-center gap-2"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.10)', background: 'rgba(245,158,11,0.08)' }}>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
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
            <div className="rounded-2xl p-12 text-center" style={glass}>
              <ShoppingCart size={32} className="text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 text-sm font-medium">No duties scheduled yet</p>
              <p className="text-slate-600 text-xs mt-1">Ask admin to set up the schedule</p>
            </div>
          ) : (
            <div className="space-y-3">
              {byDay.map(({ day, lunch, dinner }) => (
                <div key={day} className="rounded-2xl overflow-hidden" style={glass}>
                  <div className="px-4 py-3 flex items-center gap-2"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.04)' }}>
                    <span className="text-sm font-bold text-white tracking-wide">{DAYS[day]}</span>
                    {day === todayDay && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(245,158,11,0.20)', color: '#fcd34d', border: '1px solid rgba(245,158,11,0.40)' }}>TODAY</span>
                    )}
                    <span className="ml-auto text-[11px] font-medium text-slate-500">
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
