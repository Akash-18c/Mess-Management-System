import React, { useEffect, useState, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, Users } from 'lucide-react';
import api from '../../api';
import useActivePeriod from '../../hooks/useActivePeriod';

const rn = (name) => { const m = name?.match(/^\w+\s*\((.+)\)$/); return m ? m[1] : (name || ''); };

const glass = {
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(40px)',
  WebkitBackdropFilter: 'blur(40px)',
  border: '1px solid rgba(255,255,255,0.10)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)',
};

const calGlass = {
  background: 'rgba(255,255,255,0.03)',
  backdropFilter: 'blur(48px)',
  WebkitBackdropFilter: 'blur(48px)',
  border: '1px solid rgba(255,255,255,0.08)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.10)',
};

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export default function MemberMeals() {
  const now = new Date();
  const curMonth = now.getMonth() + 1;
  const curYear  = now.getFullYear();
  const _pad = n => String(n).padStart(2, '0');
  const todayLocal = `${now.getFullYear()}-${_pad(now.getMonth()+1)}-${_pad(now.getDate())}`;
  const [month, setMonth] = useState(curMonth);
  const [year,  setYear]  = useState(curYear);
  const [members,  setMembers]  = useState([]);
  const [mealData, setMealData] = useState({});
  const [selectedDate, setSelectedDate] = useState(todayLocal);

  const { period } = useActivePeriod();
  const rangeStart = period?.startDate || null;
  const rangeEnd   = period?.endDate   || null;

  // Sync to active period month when it loads
  useEffect(() => {
    if (period) { setMonth(period.month); setYear(period.year); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period?.month, period?.year]);

  const isDateInRange = (dateStr) => {
    if (!rangeStart && !rangeEnd) return true;
    if (rangeStart && dateStr < rangeStart) return false;
    if (rangeEnd   && dateStr > rangeEnd)   return false;
    return true;
  };

  const daysInMonth = new Date(year, month, 0).getDate();

  const loadData = useCallback(async () => {
    const [memsRes, mealsRes] = await Promise.all([
      api.get('/member/members-list'),
      api.get(`/meals/${month}/${year}`),
    ]);
    setMembers(memsRes.data);
    const map = {};
    mealsRes.data.forEach(m => {
      const mid = m.memberId?._id || m.memberId;
      if (mid) map[`${mid}_${m.date?.slice(0, 10)}`] = m;
    });
    setMealData(map);
  }, [month, year]);

  useEffect(() => { loadData(); }, [loadData]);

  const handled = useRef(false);
  const touch = (fn) => (e) => { e.preventDefault(); handled.current = true; fn(); };
  const click = (fn) => () => { if (handled.current) { handled.current = false; return; } fn(); };

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(year, month - 1, i + 1);
    const pad = n => String(n).padStart(2, '0');
    const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    return { num: i + 1, dateStr, dayIdx: d.getDay(), inRange: isDateInRange(dateStr) };
  });

  const pad = n => String(n).padStart(2, '0');
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const calendarRef = useRef(null);

  useEffect(() => {
    if (!calendarRef.current) return;
    const todayBtn = calendarRef.current.querySelector('[data-today="true"]');
    if (todayBtn) todayBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [members]);

  const lunchCount  = members.filter(m => mealData[`${m._id}_${selectedDate}`]?.lunch).length;
  const dinnerCount = members.filter(m => mealData[`${m._id}_${selectedDate}`]?.dinner).length;
  const offCount    = members.filter(m => mealData[`${m._id}_${selectedDate}`]?.isOff).length;
  const guestCount  = members.reduce((s, m) => s + (mealData[`${m._id}_${selectedDate}`]?.guestMeals || 0), 0);
  const selDate     = new Date(selectedDate + 'T00:00:00');

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3 rounded-2xl p-3 px-4" style={calGlass}>
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-white leading-tight">Daily Meals</h1>
          <p className="text-[10px] text-slate-500 mt-0.5">View only — meal attendance for all members</p>
        </div>
        <div className="flex items-center gap-1 rounded-xl p-1 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <button onTouchEnd={touch(prevMonth)} onClick={click(prevMonth)} className="p-2 rounded-lg text-slate-400 active:text-white" style={{ WebkitTapHighlightColor: 'transparent' }}>
            <ChevronLeft size={15} />
          </button>
          <span className="text-white font-semibold px-2 text-xs whitespace-nowrap">{MONTHS_SHORT[month - 1]} {year}</span>
          <button onTouchEnd={touch(nextMonth)} onClick={click(nextMonth)} className="p-2 rounded-lg text-slate-400 active:text-white" style={{ WebkitTapHighlightColor: 'transparent' }}>
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* ── View-only banner ── */}
      <div className="rounded-2xl px-4 py-2.5 flex items-center gap-2"
        style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.20)' }}>
        <span className="text-blue-400 text-sm">👁</span>
        <p className="text-blue-300 text-xs font-medium">View only — only the manager can edit meal records</p>
      </div>

      {/* ── Period banner ── */}
      {rangeStart && rangeEnd && (
        <div className="rounded-xl px-4 py-2.5 flex items-center gap-2"
          style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.18)' }}>
          <span className="text-green-400 text-xs">📅</span>
          <p className="text-green-300 text-xs font-medium">
            Active period: {new Date(rangeStart+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short'})} → {new Date(rangeEnd+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
          </p>
        </div>
      )}

      {/* ── Calendar Date Strip ── */}
      <div className="rounded-2xl p-3" style={calGlass}>
        <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }} ref={calendarRef}>
          {days.map(({ num, dateStr, dayIdx, inRange }) => {
            const isSel   = dateStr === selectedDate;
            const isToday = dateStr === todayStr;
            const isSun   = dayIdx === 0;
            const hasMeal = members.some(m => {
              const d = mealData[`${m._id}_${dateStr}`];
              return d?.lunch || d?.dinner || d?.guestMeals > 0;
            });
            return (
              <button
                key={num}
                data-today={isToday ? 'true' : undefined}
                onTouchEnd={touch(() => inRange && setSelectedDate(dateStr))}
                onClick={click(() => inRange && setSelectedDate(dateStr))}
                className="flex flex-col items-center flex-shrink-0 rounded-xl"
                style={{
                  width: '40px', padding: '7px 3px',
                  opacity: inRange === false ? 0.25 : 1,
                  cursor: inRange === false ? 'not-allowed' : 'pointer',
                  background: isSel ? 'linear-gradient(135deg,#10b981,#059669)' : isToday ? 'rgba(16,185,129,0.10)' : 'rgba(255,255,255,0.03)',
                  border: isSel ? '1px solid rgba(16,185,129,0.6)' : isToday ? '1px solid rgba(16,185,129,0.20)' : '1px solid rgba(255,255,255,0.06)',
                  boxShadow: isSel ? '0 4px 12px rgba(16,185,129,0.30)' : 'none',
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'transform 0.1s',
                }}
              >
                <span className="text-[8px] font-semibold uppercase mb-0.5"
                  style={{ color: isSel ? 'rgba(255,255,255,0.7)' : isSun ? '#f87171' : '#475569' }}>
                  {DAYS[dayIdx]}
                </span>
                <span className="text-xs font-bold"
                  style={{ color: isSel ? '#fff' : isToday ? '#34d399' : '#cbd5e1' }}>
                  {num}
                </span>
                {hasMeal && (
                  <span className="w-1 h-1 rounded-full mt-0.5"
                    style={{ background: isSel ? 'rgba(255,255,255,0.7)' : '#10b981' }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Selected Date + Summary ── */}
      <div className="rounded-2xl p-3 px-4" style={glass}>
        <p className="text-white font-semibold text-sm">
          {selDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {[
            { label: 'Lunch',  value: lunchCount,  color: '#34d399' },
            { label: 'Dinner', value: dinnerCount, color: '#60a5fa' },
            { label: 'Guest',  value: guestCount,  color: '#f59e0b' },
            { label: 'Off',    value: offCount,    color: '#f87171' },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <span className="text-sm font-bold" style={{ color }}>{value}</span>
              <span className="text-[10px] text-slate-500">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Member Cards (read-only) ── */}
      {members.length === 0 ? (
        <div className="rounded-2xl py-16 flex flex-col items-center gap-3" style={glass}>
          <Users size={36} style={{ color: '#334155' }} />
          <p className="text-slate-500 text-sm">No members found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {members.map(m => {
            const key        = `${m._id}_${selectedDate}`;
            const data       = mealData[key] || {};
            const isOff      = !!data.isOff;
            const hasLunch   = !!data.lunch;
            const hasDinner  = !!data.dinner;
            const guests     = data.guestMeals || 0;
            const name       = rn(m.name);
            const totalToday = (hasLunch ? 1 : 0) + (hasDinner ? 1 : 0) + guests;
            const roleColor  = m.role === 'admin' ? '#f87171' : m.role === 'manager' ? '#fbbf24' : '#64748b';

            return (
              <div key={m._id} className="rounded-2xl p-3" style={{
                ...glass,
                opacity: isOff ? 0.55 : 1,
                border: isOff
                  ? '1px solid rgba(248,113,113,0.20)'
                  : (hasLunch || hasDinner)
                  ? '1px solid rgba(16,185,129,0.20)'
                  : '1px solid rgba(255,255,255,0.08)',
              }}>
                {/* Member Info */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ background: isOff ? 'rgba(248,113,113,0.15)' : 'rgba(16,185,129,0.15)', border: `1px solid ${isOff ? 'rgba(248,113,113,0.25)' : 'rgba(16,185,129,0.25)'}` }}>
                      {name[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-semibold text-sm leading-tight truncate">{name}</p>
                      <p className="text-[10px]" style={{ color: roleColor }}>
                        {m.role !== 'member' ? m.role : `Room ${m.room || '—'}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {isOff ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(248,113,113,0.12)', color: '#f87171', border: '1px solid rgba(248,113,113,0.25)' }}>
                        Day Off
                      </span>
                    ) : totalToday > 0 ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }}>
                        {totalToday} meal{totalToday > 1 ? 's' : ''}
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Lunch + Dinner (display only) */}
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {[{ label: 'Lunch', active: hasLunch, activeColor: '#10b981', activeBorder: 'rgba(16,185,129,0.5)', activeShadow: 'rgba(16,185,129,0.25)' },
                    { label: 'Dinner', active: hasDinner, activeColor: '#3b82f6', activeBorder: 'rgba(59,130,246,0.5)', activeShadow: 'rgba(59,130,246,0.25)' }
                  ].map(({ label, active, activeColor, activeBorder, activeShadow }) => (
                    <div key={label} className="flex items-center justify-center py-2.5 rounded-xl font-semibold text-sm"
                      style={{
                        background: active ? `linear-gradient(135deg,${activeColor},${activeColor}cc)` : 'rgba(255,255,255,0.05)',
                        border: active ? `1px solid ${activeBorder}` : '1px solid rgba(255,255,255,0.08)',
                        color: active ? '#fff' : '#64748b',
                        boxShadow: active ? `0 4px 12px ${activeShadow}` : 'none',
                      }}>
                      {label}
                    </div>
                  ))}
                </div>

                {/* Guest + Off (display only) */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-1 rounded-xl px-2 py-1.5"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <span className="text-[10px] font-medium flex-1 text-slate-400">👤 Guest</span>
                    <span className="w-5 text-center text-sm font-bold"
                      style={{ color: guests > 0 ? '#f59e0b' : '#475569' }}>
                      {guests}
                    </span>
                  </div>
                  {isOff && (
                    <div className="px-3 py-1.5 rounded-xl text-xs font-semibold"
                      style={{ background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.35)', color: '#f87171' }}>
                      ✕ Off
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
