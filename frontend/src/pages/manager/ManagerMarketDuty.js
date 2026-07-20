import React, { useEffect, useState } from 'react';
import { Send, ShoppingCart, Clock, ChevronRight } from 'lucide-react';
import api from '../../api';
import toast from 'react-hot-toast';
import { buildWaLink } from '../../hooks/useMarketDutyNotifier';
import useAuthStore from '../../store/authStore';

const DAYS      = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const DAYS_FULL = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const rn = (name) => { const m = name?.match(/^\w+\s*\((.+)\)$/); return m ? m[1] : (name || ''); };

const glass = {
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(255,255,255,0.10)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
};

const AVATAR_COLORS = [
  ['rgba(20,184,166,0.25)','#2dd4bf'],
  ['rgba(99,102,241,0.25)','#a5b4fc'],
  ['rgba(245,158,11,0.25)','#fcd34d'],
  ['rgba(236,72,153,0.25)','#f9a8d4'],
  ['rgba(34,197,94,0.25)', '#86efac'],
  ['rgba(249,115,22,0.25)','#fdba74'],
];
function avatarColor(name) {
  let h = 0;
  for (let i = 0; i < (name?.length || 0); i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function Avatar({ name, size = 36 }) {
  const [bg, fg] = avatarColor(name);
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: bg, color: fg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: size * 0.38, flexShrink: 0 }}>
      {name?.[0]?.toUpperCase()}
    </div>
  );
}

function DutyCard({ d, onSend }) {
  const name = rn(d.memberId?.name);
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
      <div className="flex items-center gap-3 px-3 pt-3 pb-2.5">
        <Avatar name={name} />
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm leading-tight truncate">{name}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <Clock size={10} className="text-slate-500 flex-shrink-0" />
            <p className="text-slate-400 text-xs">{d.time}{d.note ? ` · ${d.note}` : ''}</p>
          </div>
        </div>
      </div>
      <div className="px-3 pb-3">
        <button onClick={() => onSend(d)}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold active:scale-95 transition-transform"
          style={{ background: 'rgba(37,211,102,0.12)', border: '1px solid rgba(37,211,102,0.30)', color: '#22c55e' }}>
          <Send size={12} /> Notify on WhatsApp
        </button>
      </div>
    </div>
  );
}

function MealBlock({ meal, duties, onSend }) {
  const isLunch = meal === 'lunch';
  const accent  = isLunch ? '#fbbf24' : '#818cf8';
  const bg      = isLunch ? 'rgba(251,191,36,0.06)' : 'rgba(129,140,248,0.06)';
  const border  = isLunch ? 'rgba(251,191,36,0.20)' : 'rgba(129,140,248,0.20)';
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: bg, border: `1px solid ${border}` }}>
      <div className="px-3 py-2.5" style={{ borderBottom: `1px solid ${border}` }}>
        <span className="text-xs font-bold" style={{ color: accent }}>{isLunch ? '☀️ Lunch' : '🌙 Dinner'}</span>
      </div>
      {duties.length === 0
        ? <p className="text-center text-slate-600 text-xs py-4">No one assigned</p>
        : <div className="p-2.5 space-y-2">{duties.map(d => <DutyCard key={d._id} d={d} onSend={onSend} />)}</div>
      }
    </div>
  );
}

export default function ManagerMarketDuty() {
  const [duties,   setDuties]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [activeDay, setActiveDay] = useState(new Date().getDay());
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

  const todayDay    = new Date().getDay();
  const activeDays  = Array.from({ length: 7 }, (_, i) => i).filter(i => duties.some(d => d.dayOfWeek === i));
  const lunchDuties  = duties.filter(d => d.dayOfWeek === activeDay && d.meal === 'lunch');
  const dinnerDuties = duties.filter(d => d.dayOfWeek === activeDay && d.meal === 'dinner');
  const totalToday   = duties.filter(d => d.dayOfWeek === todayDay).length;

  return (
    <div className="space-y-4 pb-6">
      {/* ── Header ── */}
      <div className="rounded-2xl p-4" style={glass}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.30)' }}>
            <ShoppingCart size={20} style={{ color: '#fbbf24' }} />
          </div>
          <div>
            <h1 className="font-bold text-white text-base leading-tight">Market Duty</h1>
            <p className="text-slate-500 text-xs mt-0.5">Weekly schedule · Tap to notify</p>
          </div>
        </div>

        {/* Stats */}
        {!loading && duties.length > 0 && (
          <div className="flex items-center gap-3 mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            {[
              { label: 'Total Duties',   value: duties.length,    color: '#fbbf24' },
              { label: 'Days Covered',   value: activeDays.length, color: '#60a5fa' },
              { label: "Today's Duties", value: totalToday,        color: '#4ade80' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex-1 text-center">
                <p className="text-base font-bold tabular-nums" style={{ color }}>{value}</p>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="rounded-2xl p-12 text-center" style={glass}>
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading duties…</p>
        </div>
      ) : duties.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={glass}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.20)' }}>
            <ShoppingCart size={28} style={{ color: '#fbbf24' }} />
          </div>
          <p className="text-white font-semibold text-sm">No duties scheduled yet</p>
          <p className="text-slate-500 text-xs mt-1">Ask admin to set up the schedule</p>
        </div>
      ) : (
        <>
          {/* ── Day Pill Tabs ── */}
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {Array.from({ length: 7 }, (_, i) => {
              const hasDuty = activeDays.includes(i);
              const isToday = i === todayDay;
              const isSel   = i === activeDay;
              return (
                <button key={i} onClick={() => setActiveDay(i)}
                  className="flex-shrink-0 flex flex-col items-center gap-1 px-3.5 py-2.5 rounded-2xl transition-all active:scale-95"
                  style={{
                    background: isSel ? 'rgba(245,158,11,0.18)' : 'rgba(255,255,255,0.04)',
                    border: isSel ? '1px solid rgba(245,158,11,0.45)' : '1px solid rgba(255,255,255,0.08)',
                    minWidth: 52,
                    WebkitTapHighlightColor: 'transparent',
                  }}>
                  <span className="text-[10px] font-bold uppercase tracking-wide"
                    style={{ color: isSel ? '#fbbf24' : '#64748b' }}>{DAYS[i]}</span>
                  <div className="flex items-center gap-1">
                    {isToday && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />}
                    {hasDuty && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: isSel ? '#fbbf24' : '#334155' }} />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* ── Selected Day Panel ── */}
          <div className="rounded-2xl overflow-hidden" style={glass}>
            <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="font-bold text-white text-sm">{DAYS_FULL[activeDay]}</p>
              {activeDay === todayDay && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(251,191,36,0.18)', color: '#fcd34d', border: '1px solid rgba(251,191,36,0.35)' }}>TODAY</span>
              )}
              {lunchDuties.length === 0 && dinnerDuties.length === 0 && (
                <span className="ml-auto text-xs text-slate-600">No duties</span>
              )}
            </div>
            <div className="p-3 space-y-3">
              <MealBlock meal="lunch"  duties={lunchDuties}  onSend={sendWhatsApp} />
              <MealBlock meal="dinner" duties={dinnerDuties} onSend={sendWhatsApp} />
            </div>
          </div>

          {/* ── Full Week Overview ── */}
          <div className="rounded-2xl overflow-hidden" style={glass}>
            <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-sm font-bold text-white">Full Week Overview</p>
              <p className="text-slate-500 text-xs mt-0.5">{activeDays.length} of 7 days covered</p>
            </div>
            <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              {Array.from({ length: 7 }, (_, i) => {
                const dayDuties = duties.filter(d => d.dayOfWeek === i);
                const isToday   = i === todayDay;
                const isSel     = i === activeDay;
                return (
                  <button key={i} onClick={() => setActiveDay(i)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-white/5 transition-colors"
                    style={{ WebkitTapHighlightColor: 'transparent', background: isSel ? 'rgba(245,158,11,0.06)' : 'transparent' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: isSel ? 'rgba(245,158,11,0.18)' : 'rgba(255,255,255,0.05)', border: isSel ? '1px solid rgba(245,158,11,0.35)' : '1px solid rgba(255,255,255,0.08)' }}>
                      <span className="text-xs font-bold" style={{ color: isSel ? '#fbbf24' : '#64748b' }}>{DAYS[i]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold" style={{ color: isSel ? '#fbbf24' : '#e2e8f0' }}>{DAYS_FULL[i]}</span>
                        {isToday && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(251,191,36,0.18)', color: '#fcd34d', border: '1px solid rgba(251,191,36,0.30)' }}>TODAY</span>}
                      </div>
                      {dayDuties.length > 0 ? (
                        <div className="flex items-center gap-2 mt-0.5">
                          {['lunch','dinner'].map(meal => {
                            const cnt = dayDuties.filter(d => d.meal === meal).length;
                            if (!cnt) return null;
                            return (
                              <span key={meal} className="text-[10px] font-medium" style={{ color: meal === 'lunch' ? '#fbbf24' : '#818cf8' }}>
                                {meal === 'lunch' ? '☀️' : '🌙'} {cnt}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-600 mt-0.5">No duties</p>
                      )}
                    </div>
                    <ChevronRight size={14} style={{ color: isSel ? '#fbbf24' : '#334155', flexShrink: 0 }} />
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
