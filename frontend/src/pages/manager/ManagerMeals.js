import React, { useEffect, useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight, Users, Plus, Minus } from 'lucide-react';
import api from '../../api';

const rn = (name) => { const m = name?.match(/^\w+\s*\((.+)\)$/); return m ? m[1] : (name || ''); };
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export default function ManagerMeals() {
  const now = new Date();
  const curMonth = now.getMonth() + 1;
  const curYear  = now.getFullYear();
  const _pad = n => String(n).padStart(2, '0');
  const todayLocal = `${now.getFullYear()}-${_pad(now.getMonth()+1)}-${_pad(now.getDate())}`;

  const [month, setMonth]               = useState(curMonth);
  const [year,  setYear]                = useState(curYear);
  const [members, setMembers]           = useState([]);
  const [mealData, setMealData]         = useState({});
  const [selectedDate, setSelectedDate] = useState(todayLocal);
  const [expandGuest, setExpandGuest]   = useState({});
  const pendingRef  = useRef({});
  const calendarRef = useRef(null);
  // track touchstart time to ignore scroll-triggered taps
  const touchTime   = useRef({});

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
    const el = calendarRef.current.querySelector('[data-today="true"]');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [members]);

  // ── Scroll-safe tap: only fire if finger didn't move much ──
  const onTouchStart = (key) => (e) => {
    touchTime.current[key] = { t: Date.now(), y: e.touches[0].clientY, x: e.touches[0].clientX };
  };
  const onTouchEnd = (key, fn) => (e) => {
    e.preventDefault();
    const s = touchTime.current[key];
    if (!s) return;
    const dy = Math.abs(e.changedTouches[0].clientY - s.y);
    const dx = Math.abs(e.changedTouches[0].clientX - s.x);
    const dt = Date.now() - s.t;
    // ignore if scrolled more than 8px or held > 600ms
    if (dy > 8 || dx > 8 || dt > 600) return;
    fn();
  };

  const save = (memberId, patch, current) => {
    const pKey = memberId;
    if (pendingRef.current[pKey]) clearTimeout(pendingRef.current[pKey]);
    pendingRef.current[pKey] = setTimeout(async () => {
      try {
        await api.post('/meals/mark', {
          date: selectedDate, memberId,
          breakfast: false,
          lunch:  patch.lunch  ?? false,
          dinner: patch.dinner ?? false,
          isOff:  patch.isOff  ?? false,
          month, year,
        });
      } catch {
        toast.error('Failed to save');
        setMealData(prev => ({ ...prev, [`${memberId}_${selectedDate}`]: current }));
      }
    }, 350);
  };

  const toggleMeal = (memberId, type) => {
    if (!isLiveMonth) return;
    const key = `${memberId}_${selectedDate}`;
    const cur = mealData[key] || {};
    if (cur.isOff) return;
    const next = { ...cur, [type]: !cur[type] };
    setMealData(prev => ({ ...prev, [key]: next }));
    save(memberId, { lunch: next.lunch || false, dinner: next.dinner || false, isOff: false }, cur);
  };

  const toggleOff = (memberId) => {
    if (!isLiveMonth) return;
    const key = `${memberId}_${selectedDate}`;
    const cur = mealData[key] || {};
    const isOff = !cur.isOff;
    const next = { ...cur, isOff, lunch: isOff ? false : cur.lunch, dinner: isOff ? false : cur.dinner };
    setMealData(prev => ({ ...prev, [key]: next }));
    save(memberId, { lunch: next.lunch || false, dinner: next.dinner || false, isOff }, cur);
  };

  const changeGuest = (memberId, delta) => {
    if (!isLiveMonth) return;
    const key = `${memberId}_${selectedDate}`;
    const cur = mealData[key] || {};
    if (cur.isOff) return;
    const next = Math.max(0, Math.min(10, (cur.guestMeals || 0) + delta));
    setMealData(prev => ({ ...prev, [key]: { ...cur, guestMeals: next } }));
    const pKey = memberId + '_g';
    if (pendingRef.current[pKey]) clearTimeout(pendingRef.current[pKey]);
    pendingRef.current[pKey] = setTimeout(async () => {
      try { await api.post('/meals/guest', { date: selectedDate, memberId, guestMeals: next, month, year }); }
      catch { toast.error('Failed to save guest'); setMealData(prev => ({ ...prev, [key]: cur })); }
    }, 350);
  };

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y-1); } else setMonth(m => m-1); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(y => y+1); } else setMonth(m => m+1); };

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(year, month - 1, i + 1);
    const p = n => String(n).padStart(2,'0');
    return { num: i+1, dateStr: `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`, dayIdx: d.getDay() };
  });

  const p2 = n => String(n).padStart(2,'0');
  const todayStr    = `${now.getFullYear()}-${p2(now.getMonth()+1)}-${p2(now.getDate())}`;
  const selDate     = new Date(selectedDate + 'T00:00:00');
  const lunchCount  = members.filter(m => mealData[`${m._id}_${selectedDate}`]?.lunch).length;
  const dinnerCount = members.filter(m => mealData[`${m._id}_${selectedDate}`]?.dinner).length;
  const offCount    = members.filter(m => mealData[`${m._id}_${selectedDate}`]?.isOff).length;
  const guestCount  = members.reduce((s,m) => s + (mealData[`${m._id}_${selectedDate}`]?.guestMeals || 0), 0);

  const panelGlass = {
    background: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)',
    border: '1px solid rgba(255,255,255,0.09)',
    boxShadow: '0 4px 24px rgba(0,0,0,0.28)',
  };

  return (
    <div className="space-y-4 pb-6">

      {/* ── Header + Month Nav ── */}
      <div className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3" style={panelGlass}>
        <div>
          <h1 className="text-base font-bold text-white">Daily Meals</h1>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {isLiveMonth ? 'Select a date, then mark meals' : 'View only — past month'}
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-xl p-1"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            onTouchStart={onTouchStart('pm')} onTouchEnd={onTouchEnd('pm', prevMonth)}
            onClick={prevMonth}
            className="p-2 rounded-lg text-slate-400 active:text-white"
            style={{ WebkitTapHighlightColor: 'transparent' }}>
            <ChevronLeft size={15} />
          </button>
          <span className="text-white font-semibold px-2 text-xs whitespace-nowrap">
            {MONTHS_SHORT[month-1]} {year}
          </span>
          <button
            onTouchStart={onTouchStart('nm')} onTouchEnd={onTouchEnd('nm', nextMonth)}
            onClick={nextMonth}
            className="p-2 rounded-lg text-slate-400 active:text-white"
            style={{ WebkitTapHighlightColor: 'transparent' }}>
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* ── Calendar Strip ── */}
      <div className="rounded-2xl p-3" style={panelGlass}>
        <div ref={calendarRef}
          className="flex gap-1.5 overflow-x-auto"
          style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', paddingBottom: '2px' }}>
          {days.map(({ num, dateStr, dayIdx }) => {
            const isSel   = dateStr === selectedDate;
            const isToday = dateStr === todayStr;
            const hasMeal = members.some(m => {
              const d = mealData[`${m._id}_${dateStr}`];
              return d?.lunch || d?.dinner || d?.guestMeals > 0;
            });
            return (
              <button key={num} data-today={isToday ? 'true' : undefined}
                onTouchStart={onTouchStart('d'+num)}
                onTouchEnd={onTouchEnd('d'+num, () => setSelectedDate(dateStr))}
                onClick={() => setSelectedDate(dateStr)}
                className="flex flex-col items-center flex-shrink-0 rounded-xl"
                style={{
                  width: '42px', padding: '8px 4px',
                  background: isSel ? 'linear-gradient(135deg,#10b981,#059669)' : isToday ? 'rgba(16,185,129,0.10)' : 'rgba(255,255,255,0.03)',
                  border: isSel ? '1px solid rgba(16,185,129,0.6)' : isToday ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(255,255,255,0.06)',
                  boxShadow: isSel ? '0 4px 14px rgba(16,185,129,0.35)' : 'none',
                  WebkitTapHighlightColor: 'transparent',
                }}>
                <span className="text-[8px] font-bold uppercase mb-1"
                  style={{ color: isSel ? 'rgba(255,255,255,0.75)' : dayIdx === 0 ? '#f87171' : '#475569' }}>
                  {DAYS[dayIdx]}
                </span>
                <span className="text-sm font-bold"
                  style={{ color: isSel ? '#fff' : isToday ? '#34d399' : '#94a3b8' }}>
                  {num}
                </span>
                {hasMeal && (
                  <span className="w-1.5 h-1.5 rounded-full mt-1"
                    style={{ background: isSel ? 'rgba(255,255,255,0.8)' : '#10b981' }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Selected Date + Summary pills ── */}
      <div className="rounded-2xl px-4 py-3" style={panelGlass}>
        <p className="text-white font-semibold text-sm">
          {selDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <div className="flex gap-2 mt-2 flex-wrap">
          {[
            { label: 'Lunch',  val: lunchCount,  c: '#34d399' },
            { label: 'Dinner', val: dinnerCount, c: '#60a5fa' },
            { label: 'Guest',  val: guestCount,  c: '#f59e0b' },
            { label: 'Off',    val: offCount,    c: '#f87171' },
          ].map(({ label, val, c }) => (
            <div key={label} className="flex items-center gap-1.5 px-3 py-1 rounded-full"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <span className="text-sm font-bold" style={{ color: c }}>{val}</span>
              <span className="text-[10px] text-slate-500">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {!isLiveMonth && (
        <div className="rounded-2xl px-4 py-2.5 flex items-center gap-2"
          style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.18)' }}>
          <span className="text-amber-400">👁</span>
          <p className="text-amber-300 text-xs font-medium">View only — editing allowed in current month only</p>
        </div>
      )}

      {/* ── Member Cards ── */}
      {members.length === 0 ? (
        <div className="rounded-2xl py-16 flex flex-col items-center gap-3" style={panelGlass}>
          <Users size={36} className="text-slate-700" />
          <p className="text-slate-500 text-sm">No members found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {members.map(m => {
            const key       = `${m._id}_${selectedDate}`;
            const data      = mealData[key] || {};
            const isOff     = !!data.isOff;
            const hasLunch  = !!data.lunch;
            const hasDinner = !!data.dinner;
            const guests    = data.guestMeals || 0;
            const name      = rn(m.name);
            const showGuest = expandGuest[m._id];

            return (
              <div key={m._id} className="rounded-2xl overflow-hidden"
                style={{
                  ...panelGlass,
                  border: isOff
                    ? '1px solid rgba(248,113,113,0.22)'
                    : (hasLunch || hasDinner)
                    ? '1px solid rgba(16,185,129,0.18)'
                    : '1px solid rgba(255,255,255,0.09)',
                }}>

                {/* ── Top row: name + Off toggle ── */}
                <div className="flex items-center justify-between px-4 pt-3 pb-2">
                  <div className="flex items-center gap-2.5">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                      style={{
                        background: isOff ? 'rgba(248,113,113,0.18)' : 'rgba(16,185,129,0.18)',
                        border: `1px solid ${isOff ? 'rgba(248,113,113,0.30)' : 'rgba(16,185,129,0.28)'}`,
                      }}>
                      {name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm leading-tight">{name}</p>
                      <p className="text-[10px] text-slate-500">
                        {isOff ? '🔴 Day Off' : (hasLunch || hasDinner) ? `✅ ${(hasLunch?1:0)+(hasDinner?1:0)+guests} meal${(hasLunch?1:0)+(hasDinner?1:0)+guests!==1?'s':''}` : '—'}
                      </p>
                    </div>
                  </div>

                  {/* Off toggle switch */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold" style={{ color: isOff ? '#f87171' : '#475569' }}>
                      {isOff ? 'Off' : 'Off'}
                    </span>
                    <button
                      onTouchStart={onTouchStart('off_'+m._id)}
                      onTouchEnd={onTouchEnd('off_'+m._id, () => toggleOff(m._id))}
                      onClick={() => toggleOff(m._id)}
                      disabled={!isLiveMonth}
                      className="relative flex-shrink-0 disabled:opacity-30"
                      style={{
                        width: '44px', height: '24px',
                        borderRadius: '12px',
                        background: isOff ? 'rgba(248,113,113,0.35)' : 'rgba(255,255,255,0.10)',
                        border: isOff ? '1px solid rgba(248,113,113,0.50)' : '1px solid rgba(255,255,255,0.15)',
                        transition: 'background 0.2s, border 0.2s',
                        WebkitTapHighlightColor: 'transparent',
                        cursor: isLiveMonth ? 'pointer' : 'not-allowed',
                      }}>
                      <span style={{
                        position: 'absolute',
                        top: '3px',
                        left: isOff ? '22px' : '3px',
                        width: '16px', height: '16px',
                        borderRadius: '50%',
                        background: isOff ? '#f87171' : '#475569',
                        transition: 'left 0.2s, background 0.2s',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
                      }} />
                    </button>
                  </div>
                </div>

                {/* ── Meal buttons ── */}
                <div className="grid grid-cols-2 gap-2 px-4 pb-3">
                  {/* Lunch */}
                  <button
                    onTouchStart={onTouchStart('l_'+m._id)}
                    onTouchEnd={onTouchEnd('l_'+m._id, () => toggleMeal(m._id, 'lunch'))}
                    onClick={() => toggleMeal(m._id, 'lunch')}
                    disabled={isOff || !isLiveMonth}
                    className="rounded-xl py-4 flex flex-col items-center gap-1 disabled:opacity-40"
                    style={{
                      background: hasLunch
                        ? 'linear-gradient(145deg,rgba(16,185,129,0.30),rgba(5,150,105,0.20))'
                        : 'rgba(255,255,255,0.04)',
                      border: hasLunch
                        ? '1.5px solid rgba(16,185,129,0.55)'
                        : '1.5px solid rgba(255,255,255,0.08)',
                      boxShadow: hasLunch ? '0 0 18px rgba(16,185,129,0.18) inset' : 'none',
                      WebkitTapHighlightColor: 'transparent',
                      transition: 'background 0.18s, border 0.18s, box-shadow 0.18s',
                      cursor: (isOff || !isLiveMonth) ? 'not-allowed' : 'pointer',
                    }}>
                    <span className="text-2xl">🌤️</span>
                    <span className="text-xs font-bold" style={{ color: hasLunch ? '#34d399' : '#475569' }}>
                      Lunch
                    </span>
                    {hasLunch && (
                      <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(16,185,129,0.20)', color: '#6ee7b7' }}>
                        ON
                      </span>
                    )}
                  </button>

                  {/* Dinner */}
                  <button
                    onTouchStart={onTouchStart('d_'+m._id)}
                    onTouchEnd={onTouchEnd('d_'+m._id, () => toggleMeal(m._id, 'dinner'))}
                    onClick={() => toggleMeal(m._id, 'dinner')}
                    disabled={isOff || !isLiveMonth}
                    className="rounded-xl py-4 flex flex-col items-center gap-1 disabled:opacity-40"
                    style={{
                      background: hasDinner
                        ? 'linear-gradient(145deg,rgba(59,130,246,0.28),rgba(37,99,235,0.18))'
                        : 'rgba(255,255,255,0.04)',
                      border: hasDinner
                        ? '1.5px solid rgba(59,130,246,0.55)'
                        : '1.5px solid rgba(255,255,255,0.08)',
                      boxShadow: hasDinner ? '0 0 18px rgba(59,130,246,0.18) inset' : 'none',
                      WebkitTapHighlightColor: 'transparent',
                      transition: 'background 0.18s, border 0.18s, box-shadow 0.18s',
                      cursor: (isOff || !isLiveMonth) ? 'not-allowed' : 'pointer',
                    }}>
                    <span className="text-2xl">🌙</span>
                    <span className="text-xs font-bold" style={{ color: hasDinner ? '#60a5fa' : '#475569' }}>
                      Dinner
                    </span>
                    {hasDinner && (
                      <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(59,130,246,0.20)', color: '#93c5fd' }}>
                        ON
                      </span>
                    )}
                  </button>
                </div>

                {/* ── Guest row ── */}
                <div className="px-4 pb-3">
                  {!showGuest ? (
                    <button
                      onTouchStart={onTouchStart('gx_'+m._id)}
                      onTouchEnd={onTouchEnd('gx_'+m._id, () => setExpandGuest(p => ({ ...p, [m._id]: true })))}
                      onClick={() => setExpandGuest(p => ({ ...p, [m._id]: true }))}
                      disabled={isOff || !isLiveMonth}
                      className="text-[11px] font-semibold disabled:opacity-30"
                      style={{ color: guests > 0 ? '#f59e0b' : '#334155', WebkitTapHighlightColor: 'transparent' }}>
                      {guests > 0 ? `👤 ${guests} Guest${guests > 1 ? 's' : ''}` : '+ Add Guest'}
                    </button>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-slate-400 font-medium">👤 Guests</span>
                      <div className="flex items-center gap-2 rounded-xl px-3 py-1.5"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}>
                        <button
                          onTouchStart={onTouchStart('gm_'+m._id)}
                          onTouchEnd={onTouchEnd('gm_'+m._id, () => changeGuest(m._id, -1))}
                          onClick={() => changeGuest(m._id, -1)}
                          disabled={isOff || guests === 0 || !isLiveMonth}
                          className="w-7 h-7 rounded-lg flex items-center justify-center disabled:opacity-25"
                          style={{ background: 'rgba(255,255,255,0.08)', WebkitTapHighlightColor: 'transparent' }}>
                          <Minus size={12} className="text-slate-300" />
                        </button>
                        <span className="w-6 text-center text-sm font-bold"
                          style={{ color: guests > 0 ? '#f59e0b' : '#475569' }}>
                          {guests}
                        </span>
                        <button
                          onTouchStart={onTouchStart('gp_'+m._id)}
                          onTouchEnd={onTouchEnd('gp_'+m._id, () => changeGuest(m._id, +1))}
                          onClick={() => changeGuest(m._id, +1)}
                          disabled={isOff || guests >= 10 || !isLiveMonth}
                          className="w-7 h-7 rounded-lg flex items-center justify-center disabled:opacity-25"
                          style={{ background: 'rgba(255,255,255,0.08)', WebkitTapHighlightColor: 'transparent' }}>
                          <Plus size={12} className="text-slate-300" />
                        </button>
                      </div>
                      <button
                        onTouchStart={onTouchStart('gc_'+m._id)}
                        onTouchEnd={onTouchEnd('gc_'+m._id, () => setExpandGuest(p => ({ ...p, [m._id]: false })))}
                        onClick={() => setExpandGuest(p => ({ ...p, [m._id]: false }))}
                        className="text-[10px] text-slate-600"
                        style={{ WebkitTapHighlightColor: 'transparent' }}>
                        Done
                      </button>
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
