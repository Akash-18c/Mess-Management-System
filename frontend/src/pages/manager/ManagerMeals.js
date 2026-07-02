import React, { useEffect, useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight, Users } from 'lucide-react';
import api from '../../api';

const rn = (name) => { const m = name?.match(/^\w+\s*\((.+)\)$/); return m ? m[1] : (name || ''); };

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const glass = {
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)',
  border: '1px solid rgba(255,255,255,0.10)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)',
};

export default function ManagerMeals() {
  const now = new Date();
  const curMonth = now.getMonth() + 1;
  const curYear  = now.getFullYear();
  const _pad = n => String(n).padStart(2, '0');
  const todayLocal = `${now.getFullYear()}-${_pad(now.getMonth()+1)}-${_pad(now.getDate())}`;

  const [month, setMonth]           = useState(curMonth);
  const [year,  setYear]            = useState(curYear);
  const [members, setMembers]       = useState([]);
  const [mealData, setMealData]     = useState({});
  const [selectedDate, setSelectedDate] = useState(todayLocal);
  // arming state for Off button: memberId or null
  const [armedOff, setArmedOff]     = useState(null);
  const armTimerRef                 = useRef(null);
  const pendingRef                  = useRef({});
  const calendarRef                 = useRef(null);

  const isLiveMonth = month === curMonth && year === curYear;
  const daysInMonth = new Date(year, month, 0).getDate();

  const loadData = useCallback(async () => {
    const [memsRes, mealsRes] = await Promise.all([
      api.get('/members'),
      api.get(`/meals/${month}/${year}`),
    ]);
    setMembers(memsRes.data);
    const map = {};
    mealsRes.data.forEach(m => {
      const key = `${m.memberId?._id}_${m.date?.slice(0, 10)}`;
      map[key] = m;
    });
    setMealData(map);
  }, [month, year]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (!calendarRef.current) return;
    const todayBtn = calendarRef.current.querySelector('[data-today="true"]');
    if (todayBtn) todayBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [members]);

  // Disarm Off button when date changes
  useEffect(() => { setArmedOff(null); }, [selectedDate]);

  // ── touch dedup ──
  const handled = useRef(false);
  const touch = (fn) => (e) => { e.preventDefault(); handled.current = true; fn(); };
  const click = (fn) => () => { if (handled.current) { handled.current = false; return; } fn(); };

  // ── Meal toggle with 250ms tap-hold guard ──
  const tapStart = useRef({});
  const handleMealTouchStart = (memberId, mealType) => {
    tapStart.current[`${memberId}_${mealType}`] = Date.now();
  };
  const handleMealToggle = (memberId, mealType) => {
    const startKey = `${memberId}_${mealType}`;
    const elapsed = Date.now() - (tapStart.current[startKey] || 0);
    // ignore accidental taps shorter than 80ms
    if (elapsed < 80) return;
    toggleMeal(memberId, mealType);
  };

  const toggleMeal = (memberId, mealType) => {
    if (!isLiveMonth) return;
    const key = `${memberId}_${selectedDate}`;
    const current = mealData[key] || {};
    if (current.isOff) return;
    const newVal = mealType === 'lunch'
      ? { ...current, lunch: !current.lunch }
      : { ...current, dinner: !current.dinner };

    setMealData(prev => ({ ...prev, [key]: { ...prev[key], ...newVal } }));

    if (pendingRef.current[memberId]) clearTimeout(pendingRef.current[memberId]);
    pendingRef.current[memberId] = setTimeout(async () => {
      try {
        await api.post('/meals/mark', {
          date: selectedDate, memberId,
          breakfast: false,
          lunch:  newVal.lunch  || false,
          dinner: newVal.dinner || false,
          isOff: false, month, year,
        });
      } catch {
        toast.error('Failed to save');
        setMealData(prev => ({ ...prev, [key]: current }));
      }
    }, 300);
  };

  // ── Off toggle: two-tap confirm ──
  const handleOffTap = (memberId) => {
    if (!isLiveMonth) return;
    if (armedOff === memberId) {
      // second tap — confirm
      clearTimeout(armTimerRef.current);
      setArmedOff(null);
      toggleOff(memberId);
    } else {
      // first tap — arm for 2.5s
      setArmedOff(memberId);
      clearTimeout(armTimerRef.current);
      armTimerRef.current = setTimeout(() => setArmedOff(null), 2500);
    }
  };

  const toggleOff = (memberId) => {
    const key = `${memberId}_${selectedDate}`;
    const current = mealData[key] || {};
    const isOff = !current.isOff;
    setMealData(prev => ({
      ...prev,
      [key]: { ...prev[key], isOff, lunch: isOff ? false : current.lunch, dinner: isOff ? false : current.dinner },
    }));
    if (pendingRef.current[memberId + '_off']) clearTimeout(pendingRef.current[memberId + '_off']);
    pendingRef.current[memberId + '_off'] = setTimeout(async () => {
      try {
        await api.post('/meals/mark', {
          date: selectedDate, memberId, breakfast: false,
          lunch: isOff ? false : current.lunch || false,
          dinner: isOff ? false : current.dinner || false,
          isOff, month, year,
        });
      } catch {
        toast.error('Failed to save');
        setMealData(prev => ({ ...prev, [key]: current }));
      }
    }, 300);
  };

  const changeGuest = (memberId, delta) => {
    if (!isLiveMonth) return;
    const key = `${memberId}_${selectedDate}`;
    const current = mealData[key] || {};
    if (current.isOff) return;
    const next = Math.max(0, Math.min(10, (current.guestMeals || 0) + delta));
    setMealData(prev => ({ ...prev, [key]: { ...prev[key], guestMeals: next } }));
    if (pendingRef.current[memberId + '_guest']) clearTimeout(pendingRef.current[memberId + '_guest']);
    pendingRef.current[memberId + '_guest'] = setTimeout(async () => {
      try {
        await api.post('/meals/guest', { date: selectedDate, memberId, guestMeals: next, month, year });
      } catch {
        toast.error('Failed to save guest');
        setMealData(prev => ({ ...prev, [key]: current }));
      }
    }, 300);
  };

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(year, month - 1, i + 1);
    const pad = n => String(n).padStart(2, '0');
    return { num: i + 1, dateStr: `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`, dayIdx: d.getDay() };
  });

  const pad = n => String(n).padStart(2, '0');
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
  const selDate  = new Date(selectedDate + 'T00:00:00');

  const lunchCount  = members.filter(m => mealData[`${m._id}_${selectedDate}`]?.lunch).length;
  const dinnerCount = members.filter(m => mealData[`${m._id}_${selectedDate}`]?.dinner).length;
  const offCount    = members.filter(m => mealData[`${m._id}_${selectedDate}`]?.isOff).length;
  const guestCount  = members.reduce((s, m) => s + (mealData[`${m._id}_${selectedDate}`]?.guestMeals || 0), 0);

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3 rounded-2xl p-3 px-4" style={glass}>
        <div>
          <h1 className="text-lg font-bold text-white leading-tight">Daily Meals</h1>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {isLiveMonth ? 'Tap Lunch / Dinner to toggle' : 'View only — current month only'}
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-xl p-1 flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <button onTouchEnd={touch(prevMonth)} onClick={click(prevMonth)}
            className="p-2 rounded-lg text-slate-400 active:text-white"
            style={{ WebkitTapHighlightColor: 'transparent' }}>
            <ChevronLeft size={15} />
          </button>
          <span className="text-white font-semibold px-2 text-xs whitespace-nowrap">
            {MONTHS_SHORT[month - 1]} {year}
          </span>
          <button onTouchEnd={touch(nextMonth)} onClick={click(nextMonth)}
            className="p-2 rounded-lg text-slate-400 active:text-white"
            style={{ WebkitTapHighlightColor: 'transparent' }}>
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* ── Calendar Strip ── */}
      <div className="rounded-2xl p-3" style={glass}>
        <div className="flex gap-1.5 overflow-x-auto pb-1"
          style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }} ref={calendarRef}>
          {days.map(({ num, dateStr, dayIdx }) => {
            const isSel   = dateStr === selectedDate;
            const isToday = dateStr === todayStr;
            const hasMeal = members.some(m => {
              const d = mealData[`${m._id}_${dateStr}`];
              return d?.lunch || d?.dinner || d?.guestMeals > 0;
            });
            return (
              <button key={num} data-today={isToday ? 'true' : undefined}
                onTouchEnd={touch(() => setSelectedDate(dateStr))}
                onClick={click(() => setSelectedDate(dateStr))}
                className="flex flex-col items-center flex-shrink-0 rounded-xl"
                style={{
                  width: '40px', padding: '7px 3px',
                  background: isSel ? 'linear-gradient(135deg,#10b981,#059669)' : isToday ? 'rgba(16,185,129,0.10)' : 'rgba(255,255,255,0.03)',
                  border: isSel ? '1px solid rgba(16,185,129,0.6)' : isToday ? '1px solid rgba(16,185,129,0.20)' : '1px solid rgba(255,255,255,0.06)',
                  boxShadow: isSel ? '0 4px 12px rgba(16,185,129,0.30)' : 'none',
                  WebkitTapHighlightColor: 'transparent',
                }}>
                <span className="text-[8px] font-semibold uppercase mb-0.5"
                  style={{ color: isSel ? 'rgba(255,255,255,0.7)' : dayIdx === 0 ? '#f87171' : '#475569' }}>
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

      {/* ── Date + Summary ── */}
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

      {!isLiveMonth && (
        <div className="rounded-2xl px-4 py-2.5 flex items-center gap-2"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.20)' }}>
          <span className="text-amber-400 text-sm">👁</span>
          <p className="text-amber-300 text-xs font-medium">View only — meal editing is allowed in the current month only</p>
        </div>
      )}

      {/* ── Member List ── */}
      {members.length === 0 ? (
        <div className="rounded-2xl py-16 flex flex-col items-center gap-3" style={glass}>
          <Users size={36} style={{ color: '#334155' }} />
          <p className="text-slate-500 text-sm">No members found</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={glass}>
          {members.map((m, idx) => {
            const key       = `${m._id}_${selectedDate}`;
            const data      = mealData[key] || {};
            const isOff     = !!data.isOff;
            const hasLunch  = !!data.lunch;
            const hasDinner = !!data.dinner;
            const guests    = data.guestMeals || 0;
            const name      = rn(m.name);
            const isArmed   = armedOff === m._id;

            return (
              <div key={m._id}
                className="flex items-center gap-3 px-4 py-3"
                style={{
                  borderBottom: idx < members.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  opacity: isOff ? 0.55 : 1,
                  background: isOff ? 'rgba(248,113,113,0.04)' : 'transparent',
                  transition: 'opacity 0.2s',
                }}>

                {/* Avatar */}
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{
                    background: isOff ? 'rgba(248,113,113,0.15)' : 'rgba(16,185,129,0.15)',
                    border: `1px solid ${isOff ? 'rgba(248,113,113,0.25)' : 'rgba(16,185,129,0.20)'}`,
                  }}>
                  {name[0]?.toUpperCase()}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold leading-tight truncate">{name}</p>
                  {guests > 0 && (
                    <p className="text-[10px]" style={{ color: '#f59e0b' }}>+{guests} guest{guests > 1 ? 's' : ''}</p>
                  )}
                </div>

                {/* Lunch */}
                <button
                  onTouchStart={() => handleMealTouchStart(m._id, 'lunch')}
                  onTouchEnd={(e) => { e.preventDefault(); handled.current = true; handleMealToggle(m._id, 'lunch'); }}
                  onClick={() => { if (handled.current) { handled.current = false; return; } handleMealToggle(m._id, 'lunch'); }}
                  disabled={isOff || !isLiveMonth}
                  className="flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold disabled:cursor-not-allowed"
                  style={{
                    background: hasLunch ? 'linear-gradient(135deg,#10b981,#059669)' : 'rgba(255,255,255,0.06)',
                    border: hasLunch ? '1px solid rgba(16,185,129,0.5)' : '1px solid rgba(255,255,255,0.09)',
                    color: hasLunch ? '#fff' : '#475569',
                    minWidth: '54px', textAlign: 'center',
                    boxShadow: hasLunch ? '0 2px 8px rgba(16,185,129,0.25)' : 'none',
                    WebkitTapHighlightColor: 'transparent',
                    transition: 'background 0.15s, color 0.15s',
                  }}>
                  🌤 Lunch
                </button>

                {/* Dinner */}
                <button
                  onTouchStart={() => handleMealTouchStart(m._id, 'dinner')}
                  onTouchEnd={(e) => { e.preventDefault(); handled.current = true; handleMealToggle(m._id, 'dinner'); }}
                  onClick={() => { if (handled.current) { handled.current = false; return; } handleMealToggle(m._id, 'dinner'); }}
                  disabled={isOff || !isLiveMonth}
                  className="flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold disabled:cursor-not-allowed"
                  style={{
                    background: hasDinner ? 'linear-gradient(135deg,#3b82f6,#2563eb)' : 'rgba(255,255,255,0.06)',
                    border: hasDinner ? '1px solid rgba(59,130,246,0.5)' : '1px solid rgba(255,255,255,0.09)',
                    color: hasDinner ? '#fff' : '#475569',
                    minWidth: '60px', textAlign: 'center',
                    boxShadow: hasDinner ? '0 2px 8px rgba(59,130,246,0.25)' : 'none',
                    WebkitTapHighlightColor: 'transparent',
                    transition: 'background 0.15s, color 0.15s',
                  }}>
                  🌙 Dinner
                </button>

                {/* Guest stepper — compact */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onTouchEnd={touch(() => changeGuest(m._id, -1))}
                    onClick={click(() => changeGuest(m._id, -1))}
                    disabled={isOff || guests === 0 || !isLiveMonth}
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-300 disabled:opacity-25 text-sm font-bold"
                    style={{ background: 'rgba(255,255,255,0.07)', WebkitTapHighlightColor: 'transparent' }}>
                    −
                  </button>
                  <span className="w-5 text-center text-xs font-bold"
                    style={{ color: guests > 0 ? '#f59e0b' : '#334155' }}>
                    {guests}
                  </span>
                  <button
                    onTouchEnd={touch(() => changeGuest(m._id, +1))}
                    onClick={click(() => changeGuest(m._id, +1))}
                    disabled={isOff || guests >= 10 || !isLiveMonth}
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-300 disabled:opacity-25 text-sm font-bold"
                    style={{ background: 'rgba(255,255,255,0.07)', WebkitTapHighlightColor: 'transparent' }}>
                    +
                  </button>
                </div>

                {/* Off — two-tap confirm */}
                <button
                  onTouchEnd={touch(() => handleOffTap(m._id))}
                  onClick={click(() => handleOffTap(m._id))}
                  disabled={!isLiveMonth}
                  className="flex-shrink-0 px-2.5 py-2 rounded-xl text-[11px] font-bold disabled:opacity-30"
                  style={{
                    background: isOff
                      ? 'rgba(248,113,113,0.18)'
                      : isArmed
                      ? 'rgba(248,113,113,0.12)'
                      : 'rgba(255,255,255,0.04)',
                    border: isOff
                      ? '1px solid rgba(248,113,113,0.40)'
                      : isArmed
                      ? '1px solid rgba(248,113,113,0.30)'
                      : '1px solid rgba(255,255,255,0.07)',
                    color: isOff ? '#f87171' : isArmed ? '#fca5a5' : '#334155',
                    WebkitTapHighlightColor: 'transparent',
                    transition: 'all 0.2s',
                    minWidth: '42px', textAlign: 'center',
                  }}>
                  {isOff ? 'On?' : isArmed ? 'Sure?' : 'Off'}
                </button>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
