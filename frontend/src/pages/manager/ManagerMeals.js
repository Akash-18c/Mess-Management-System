import React, { useEffect, useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight, Users, Minus, Plus } from 'lucide-react';
import api from '../../api';

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

export default function ManagerMeals() {
  const now = new Date();
  const curMonth = now.getMonth() + 1;
  const curYear  = now.getFullYear();
  const _pad = n => String(n).padStart(2, '0');
  const todayLocal = `${now.getFullYear()}-${_pad(now.getMonth()+1)}-${_pad(now.getDate())}`;
  const [month, setMonth] = useState(curMonth);
  const [year,  setYear]  = useState(curYear);
  const isLiveMonth = month === curMonth && year === curYear;
  const [members,      setMembers]      = useState([]);
  const [mealData,     setMealData]     = useState({});
  const [selectedDate, setSelectedDate] = useState(todayLocal);
  const pendingRef = useRef({}); // track in-flight requests per memberId

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

  // prevent double-fire on touch (onTouchEnd + onClick both fire on mobile)
  const handled = useRef(false);
  const touch = (fn) => (e) => { e.preventDefault(); handled.current = true; fn(); };
  const click = (fn) => () => { if (handled.current) { handled.current = false; return; } fn(); };

  // ── Optimistic toggle — update UI instantly, sync in background ──
  const toggleMeal = (memberId, mealType) => {
    if (!isLiveMonth) return;
    const key = `${memberId}_${selectedDate}`;
    const current = mealData[key] || {};
    if (current.isOff) return;

    const newVal = mealType === 'lunch'
      ? { ...current, lunch: !current.lunch }
      : { ...current, dinner: !current.dinner };

    // instant UI update
    setMealData(prev => ({ ...prev, [key]: { ...prev[key], ...newVal } }));

    // debounce — cancel previous pending for this member
    if (pendingRef.current[memberId]) clearTimeout(pendingRef.current[memberId]);
    pendingRef.current[memberId] = setTimeout(async () => {
      try {
        await api.post('/meals/mark', {
          date: selectedDate, memberId,
          breakfast: false,
          lunch:  newVal.lunch  || false,
          dinner: newVal.dinner || false,
          isOff: false,
          month, year,
        });
      } catch {
        toast.error('Failed to save');
        // revert on error
        setMealData(prev => ({ ...prev, [key]: current }));
      }
    }, 300);
  };

  const toggleOff = (memberId) => {
    if (!isLiveMonth) return;
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
          date: selectedDate, memberId,
          breakfast: false,
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
    const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    return { num: i + 1, dateStr, dayIdx: d.getDay() };
  });

  const pad = n => String(n).padStart(2, '0');
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const calendarRef = useRef(null);

  // auto-scroll calendar to today on load
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
          <p className="text-[10px] text-slate-500 mt-0.5">
            {isLiveMonth ? 'Mark attendance for each member' : 'View only — editing allowed in current month only'}
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-xl p-1 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            onTouchEnd={touch(prevMonth)} onClick={click(prevMonth)}
            className="p-2 rounded-lg text-slate-400 active:text-white"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <ChevronLeft size={15} />
          </button>
          <span className="text-white font-semibold px-2 text-xs whitespace-nowrap">{MONTHS_SHORT[month - 1]} {year}</span>
          <button
            onTouchEnd={touch(nextMonth)} onClick={click(nextMonth)}
            className="p-2 rounded-lg text-slate-400 active:text-white"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* ── Calendar Date Strip ── */}
      <div className="rounded-2xl p-3" style={calGlass}>
        <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }} ref={calendarRef}>
          {days.map(({ num, dateStr, dayIdx }) => {
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
                onTouchEnd={touch(() => setSelectedDate(dateStr))}
                onClick={click(() => setSelectedDate(dateStr))}
                className="flex flex-col items-center flex-shrink-0 rounded-xl"
                style={{
                  width: '40px', padding: '7px 3px',
                  background: isSel
                    ? 'linear-gradient(135deg,#10b981,#059669)'
                    : isToday
                    ? 'rgba(16,185,129,0.10)'
                    : 'rgba(255,255,255,0.03)',
                  border: isSel
                    ? '1px solid rgba(16,185,129,0.6)'
                    : isToday
                    ? '1px solid rgba(16,185,129,0.20)'
                    : '1px solid rgba(255,255,255,0.06)',
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

      {/* ── Read-only banner ── */}
      {!isLiveMonth && (
        <div className="rounded-2xl px-4 py-2.5 flex items-center gap-2"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.20)' }}>
          <span className="text-amber-400 text-sm">👁</span>
          <p className="text-amber-300 text-xs font-medium">View only — meal editing is allowed in the current month only</p>
        </div>
      )}

      {/* ── Member Cards ── */}}
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

                {/* Lunch + Dinner */}
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    onTouchEnd={touch(() => toggleMeal(m._id, 'lunch'))}
                    onClick={click(() => toggleMeal(m._id, 'lunch'))}
                    disabled={isOff || !isLiveMonth}
                    className="flex items-center justify-center py-2.5 rounded-xl font-semibold text-sm disabled:cursor-not-allowed active:scale-95"
                    style={{
                      background: hasLunch ? 'linear-gradient(135deg,#10b981,#059669)' : 'rgba(255,255,255,0.05)',
                      border: hasLunch ? '1px solid rgba(16,185,129,0.5)' : '1px solid rgba(255,255,255,0.08)',
                      color: hasLunch ? '#fff' : '#64748b',
                      boxShadow: hasLunch ? '0 4px 12px rgba(16,185,129,0.25)' : 'none',
                      transition: 'transform 0.1s, background 0.1s',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    Lunch
                  </button>
                  <button
                    onTouchEnd={touch(() => toggleMeal(m._id, 'dinner'))}
                    onClick={click(() => toggleMeal(m._id, 'dinner'))}
                    disabled={isOff || !isLiveMonth}
                    className="flex items-center justify-center py-2.5 rounded-xl font-semibold text-sm disabled:cursor-not-allowed active:scale-95"
                    style={{
                      background: hasDinner ? 'linear-gradient(135deg,#3b82f6,#2563eb)' : 'rgba(255,255,255,0.05)',
                      border: hasDinner ? '1px solid rgba(59,130,246,0.5)' : '1px solid rgba(255,255,255,0.08)',
                      color: hasDinner ? '#fff' : '#64748b',
                      boxShadow: hasDinner ? '0 4px 12px rgba(59,130,246,0.25)' : 'none',
                      transition: 'transform 0.1s, background 0.1s',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    Dinner
                  </button>
                </div>

                {/* Guest + Off */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-1 rounded-xl px-2 py-1.5"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <span className="text-[10px] font-medium flex-1 text-slate-400">👤 Guest</span>
                    <button
                      onTouchEnd={touch(() => changeGuest(m._id, -1))}
                      onClick={click(() => changeGuest(m._id, -1))}
                      disabled={isOff || guests === 0 || !isLiveMonth}
                      className="w-6 h-6 rounded-lg flex items-center justify-center disabled:opacity-30"
                      style={{ background: 'rgba(255,255,255,0.07)', WebkitTapHighlightColor: 'transparent' }}
                    >
                      <Minus size={10} className="text-slate-300" />
                    </button>
                    <span className="w-5 text-center text-sm font-bold"
                      style={{ color: guests > 0 ? '#f59e0b' : '#475569' }}>
                      {guests}
                    </span>
                    <button
                      onTouchEnd={touch(() => changeGuest(m._id, +1))}
                      onClick={click(() => changeGuest(m._id, +1))}
                      disabled={isOff || guests >= 10 || !isLiveMonth}
                      className="w-6 h-6 rounded-lg flex items-center justify-center disabled:opacity-30"
                      style={{ background: 'rgba(255,255,255,0.07)', WebkitTapHighlightColor: 'transparent' }}
                    >
                      <Plus size={10} className="text-slate-300" />
                    </button>
                  </div>
                  <button
                    onTouchEnd={touch(() => toggleOff(m._id))}
                    onClick={click(() => toggleOff(m._id))}
                    disabled={!isLiveMonth}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold active:scale-95"
                    style={{
                      background: isOff ? 'rgba(248,113,113,0.15)' : 'rgba(255,255,255,0.05)',
                      border: isOff ? '1px solid rgba(248,113,113,0.35)' : '1px solid rgba(255,255,255,0.08)',
                      color: isOff ? '#f87171' : '#475569',
                      transition: 'transform 0.1s',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    {isOff ? '✕ Off' : 'Off?'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
