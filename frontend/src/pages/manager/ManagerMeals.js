import React, { useEffect, useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight, Users, Plus, Minus } from 'lucide-react';
import api from '../../api';

const rn = (name) => { const m = name?.match(/^\w+\s*\((.+)\)$/); return m ? m[1] : (name || ''); };
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const glass = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.10)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
};

// ── Scroll-safe tap hook ──────────────────────────────────────────────────────
// Returns { onTouchStart, onTouchEnd, onClick } props for a button.
// onTouchEnd fires the action only if the finger didn't scroll (dy < 10px).
// onClick is a no-op fallback for desktop (touch already handled it via flag).
function useSafeTap(action, disabled = false) {
  const origin    = useRef(null);
  const lastTouch = useRef(0);

  const onTouchStart = (e) => {
    if (disabled) return;
    origin.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = (e) => {
    if (disabled || !origin.current) return;
    const dy = Math.abs(e.changedTouches[0].clientY - origin.current.y);
    const dx = Math.abs(e.changedTouches[0].clientX - origin.current.x);
    origin.current = null;
    if (dy > 10 || dx > 10) return;
    lastTouch.current = Date.now();
    action();
  };
  const onClick = () => {
    if (disabled) return;
    if (Date.now() - lastTouch.current < 500) return; // already fired by touch
    action();
  };

  return { onTouchStart, onTouchEnd, onClick };
}

export default function ManagerMeals() {
  const now = new Date();
  const curMonth = now.getMonth() + 1;
  const curYear  = now.getFullYear();
  const _p = n => String(n).padStart(2, '0');
  const todayLocal = `${now.getFullYear()}-${_p(now.getMonth()+1)}-${_p(now.getDate())}`;

  const [month, setMonth]               = useState(curMonth);
  const [year,  setYear]                = useState(curYear);
  const [members, setMembers]           = useState([]);
  const [mealData, setMealData]         = useState({});
  const [selectedDate, setSelectedDate] = useState(todayLocal);
  const [activeMonths, setActiveMonths] = useState([]);
  const [myAssignment, setMyAssignment] = useState(null);
  const pendingRef  = useRef({});
  const calendarRef = useRef(null);

  const isLiveMonth = month === curMonth && year === curYear;
  const daysInMonth = new Date(year, month, 0).getDate();

  // Match active period by month/year OR by date range overlapping the viewed month
  const activeMonthCfg = activeMonths.find(m => {
    if (m.month === month && m.year === year) return true;
    // cross-month period: check if viewed month overlaps startDate–endDate
    if (m.startDate || m.endDate) {
      const viewStart = `${year}-${String(month).padStart(2,'0')}-01`;
      const viewEnd   = `${year}-${String(month).padStart(2,'0')}-${String(new Date(year, month, 0).getDate()).padStart(2,'0')}`;
      const s = m.startDate || viewStart;
      const e = m.endDate   || viewEnd;
      return s <= viewEnd && e >= viewStart;
    }
    return false;
  });
  const rangeStart = activeMonthCfg?.startDate || null;
  const rangeEnd   = activeMonthCfg?.endDate   || null;

  // canEdit: active period covers this month OR manager is assigned for this month
  const canEdit = !!activeMonthCfg || (myAssignment?.month === month && myAssignment?.year === year);

  // A date is in range only if within admin-set start/end (if set)
  const isDateInRange = (dateStr) => {
    if (!rangeStart && !rangeEnd) return true;
    if (rangeStart && dateStr < rangeStart) return false;
    if (rangeEnd   && dateStr > rangeEnd)   return false;
    return true;
  };

  // When month/assignment loads, snap selectedDate into range if it's outside
  useEffect(() => {
    if (!rangeStart && !rangeEnd) return;
    if (!isDateInRange(selectedDate)) {
      setSelectedDate(rangeStart || todayLocal);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeStart, rangeEnd]);

  const loadData = useCallback(async () => {
    try {
      const [memsRes, mealsRes, activeRes, assignRes] = await Promise.all([
        api.get('/member/members-list'),
        api.get(`/meals/${month}/${year}`),
        api.get('/member/active-months'),
        api.get('/member/my-assignment'),
      ]);
      setMembers(Array.isArray(memsRes.data) ? memsRes.data : []);
      setActiveMonths(Array.isArray(activeRes.data) ? activeRes.data : []);
      setMyAssignment(assignRes.data || null);
      const map = {};
      const meals = Array.isArray(mealsRes.data) ? mealsRes.data : [];
      meals.forEach(m => {
        map[`${m.memberId?._id}_${m.date?.slice(0,10)}`] = m;
      });
      setMealData(map);
    } catch (err) {
      console.error('loadData failed', err);
    }
  }, [month, year]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (!calendarRef.current) return;
    const el = calendarRef.current.querySelector('[data-today="true"]');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [members]);

  // ── API save (debounced) ──
  const saveMeal = (memberId, patch, rollback) => {
    const k = memberId;
    if (pendingRef.current[k]) clearTimeout(pendingRef.current[k]);
    pendingRef.current[k] = setTimeout(async () => {
      try {
        await api.post('/meals/mark', { date: selectedDate, memberId, breakfast: false, month, year, ...patch });
      } catch {
        toast.error('Failed to save');
        setMealData(prev => ({ ...prev, [`${memberId}_${selectedDate}`]: rollback }));
      }
    }, 350);
  };

  const saveGuest = (memberId, guestMeals, rollback) => {
    const k = memberId + '_g';
    if (pendingRef.current[k]) clearTimeout(pendingRef.current[k]);
    pendingRef.current[k] = setTimeout(async () => {
      try {
        await api.post('/meals/guest', { date: selectedDate, memberId, guestMeals, month, year });
      } catch {
        toast.error('Failed to save');
        setMealData(prev => ({ ...prev, [`${memberId}_${selectedDate}`]: rollback }));
      }
    }, 350);
  };

  const toggleMeal = (memberId, type) => {
    if (!canEdit) return;
    const key = `${memberId}_${selectedDate}`;
    const cur = mealData[key] || {};
    if (cur.isOff) return;
    const next = { ...cur, [type]: !cur[type] };
    setMealData(prev => ({ ...prev, [key]: next }));
    saveMeal(memberId, { lunch: next.lunch||false, dinner: next.dinner||false, isOff: false }, cur);
  };

  const toggleOff = (memberId) => {
    if (!canEdit) return;
    const key = `${memberId}_${selectedDate}`;
    const cur = mealData[key] || {};
    const isOff = !cur.isOff;
    const next = { ...cur, isOff, lunch: isOff ? false : cur.lunch, dinner: isOff ? false : cur.dinner };
    setMealData(prev => ({ ...prev, [key]: next }));
    saveMeal(memberId, { lunch: next.lunch||false, dinner: next.dinner||false, isOff }, cur);
  };

  const changeGuest = (memberId, delta) => {
    if (!canEdit) return;
    const key = `${memberId}_${selectedDate}`;
    const cur = mealData[key] || {};
    if (cur.isOff) return;
    const next = Math.max(0, Math.min(10, (cur.guestMeals||0) + delta));
    setMealData(prev => ({ ...prev, [key]: { ...cur, guestMeals: next } }));
    saveGuest(memberId, next, cur);
  };

  const prevMonth = () => { if (month===1){setMonth(12);setYear(y=>y-1);}else setMonth(m=>m-1); };
  const nextMonth = () => { if (month===12){setMonth(1);setYear(y=>y+1);}else setMonth(m=>m+1); };

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(year, month-1, i+1);
    const p = n => String(n).padStart(2,'0');
    const dateStr = `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`;
    return { num: i+1, dateStr, dayIdx: d.getDay(), inRange: isDateInRange(dateStr) };
  });

  const p2 = n => String(n).padStart(2,'0');
  const todayStr    = `${now.getFullYear()}-${p2(now.getMonth()+1)}-${p2(now.getDate())}`;
  const selDate     = new Date(selectedDate + 'T00:00:00');
  const lunchCount  = members.filter(m => mealData[`${m._id}_${selectedDate}`]?.lunch).length;
  const dinnerCount = members.filter(m => mealData[`${m._id}_${selectedDate}`]?.dinner).length;
  const offCount    = members.filter(m => mealData[`${m._id}_${selectedDate}`]?.isOff).length;
  const guestCount  = members.reduce((s,m) => s + (mealData[`${m._id}_${selectedDate}`]?.guestMeals||0), 0);

  return (
    <div className="space-y-4 pb-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3" style={glass}>
        <div>
          <h1 className="text-base font-bold text-white">Daily Meals</h1>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {canEdit ? 'Mark attendance for each member' : 'View only — outside active period'}
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-xl p-1"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <MonthBtn action={prevMonth}><ChevronLeft size={15} /></MonthBtn>
          <span className="text-white font-semibold px-2 text-xs whitespace-nowrap">
            {MONTHS_SHORT[month-1]} {year}
          </span>
          <MonthBtn action={nextMonth}><ChevronRight size={15} /></MonthBtn>
        </div>
      </div>

      {/* ── Calendar Strip ── */}
      <div className="rounded-2xl px-2 py-2" style={glass}>
        <div ref={calendarRef} className="flex gap-0.5 overflow-x-auto"
          style={{ scrollbarWidth: 'none' }}>
          {days.map(({ num, dateStr, dayIdx, inRange }) => {
            const isSel   = dateStr === selectedDate;
            const isToday = dateStr === todayStr;
            const hasMeal = members.some(m => {
              const d = mealData[`${m._id}_${dateStr}`];
              return d?.lunch || d?.dinner || d?.guestMeals > 0;
            });
            return (
              <CalDay key={num} num={num} dayIdx={dayIdx} isSel={isSel} isToday={isToday}
                hasMeal={hasMeal} inRange={inRange} onSelect={() => inRange && setSelectedDate(dateStr)} />
            );
          })}
        </div>
      </div>

      {/* ── Date + Summary ── */}
      <div className="rounded-2xl px-4 py-3" style={glass}>
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

      {!canEdit && (
        <div className="rounded-2xl px-4 py-2.5 flex items-center gap-2"
          style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.18)' }}>
          <span className="text-amber-400">👁</span>
          <p className="text-amber-300 text-xs font-medium">View only — editing allowed within the active mess period only</p>
        </div>
      )}

      {/* ── Member Cards ── */}
      {members.length === 0 ? (
        <div className="rounded-2xl py-16 flex flex-col items-center gap-3" style={glass}>
          <Users size={36} className="text-slate-700" />
          <p className="text-slate-500 text-sm">No members found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {members.map(m => (
            <MemberCard
              key={m._id}
              member={m}
              data={mealData[`${m._id}_${selectedDate}`] || {}}
              isLive={canEdit}
              onToggleMeal={toggleMeal}
              onToggleOff={toggleOff}
              onChangeGuest={changeGuest}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Month nav button ──────────────────────────────────────────────────────────
function MonthBtn({ action, children }) {
  const tap = useSafeTap(action);
  return (
    <button {...tap} className="p-2 rounded-lg text-slate-400 active:text-white"
      style={{ WebkitTapHighlightColor: 'transparent' }}>
      {children}
    </button>
  );
}

// ── Calendar day button ───────────────────────────────────────────────────────
function CalDay({ num, dayIdx, isSel, isToday, hasMeal, inRange, onSelect }) {
  const tap = useSafeTap(onSelect, !inRange);
  return (
    <button {...tap} data-today={isToday ? 'true' : undefined}
      className="flex flex-col items-center flex-shrink-0 rounded-xl"
      style={{
        width: 44, padding: '7px 4px',
        opacity: inRange === false ? 0.25 : 1,
        cursor: inRange === false ? 'not-allowed' : 'pointer',
        background: isSel
          ? 'linear-gradient(160deg,#10b981,#059669)'
          : isToday
          ? 'rgba(16,185,129,0.12)'
          : 'transparent',
        border: isSel
          ? '1px solid rgba(16,185,129,0.50)'
          : isToday
          ? '1px solid rgba(16,185,129,0.22)'
          : '1px solid transparent',
        WebkitTapHighlightColor: 'transparent',
      }}>
      <span className="text-[9px] font-semibold uppercase mb-0.5"
        style={{ color: isSel ? 'rgba(255,255,255,0.65)' : dayIdx===0 ? '#f87171' : '#4b5563' }}>
        {DAYS[dayIdx]}
      </span>
      <span className="text-[13px] font-bold"
        style={{ color: isSel ? '#fff' : isToday ? '#34d399' : '#9ca3af' }}>
        {num}
      </span>
      <span className="w-1 h-1 rounded-full mt-1"
        style={{ background: hasMeal ? (isSel ? 'rgba(255,255,255,0.7)' : '#10b981') : 'transparent' }} />
    </button>
  );
}

// ── Member Card ───────────────────────────────────────────────────────────────
function MemberCard({ member, data, isLive, onToggleMeal, onToggleOff, onChangeGuest }) {
  const isOff     = !!data.isOff;
  const hasLunch  = !!data.lunch;
  const hasDinner = !!data.dinner;
  const guests    = data.guestMeals || 0;
  const name      = rn(member.name);
  const totalMeals = (hasLunch?1:0) + (hasDinner?1:0) + guests;

  const lunchTap  = useSafeTap(() => onToggleMeal(member._id, 'lunch'),  isOff || !isLive);
  const dinnerTap = useSafeTap(() => onToggleMeal(member._id, 'dinner'), isOff || !isLive);
  const offTap    = useSafeTap(() => onToggleOff(member._id),            !isLive);
  const gMinusTap = useSafeTap(() => onChangeGuest(member._id, -1),      isOff || guests===0 || !isLive);
  const gPlusTap  = useSafeTap(() => onChangeGuest(member._id, +1),      isOff || guests>=10 || !isLive);

  return (
    <div className="rounded-2xl px-3 pt-2.5 pb-2" style={{
      background: 'rgba(255,255,255,0.06)',
      border: isOff
        ? '1px solid rgba(248,113,113,0.22)'
        : (hasLunch || hasDinner)
        ? '1px solid rgba(16,185,129,0.18)'
        : '1px solid rgba(255,255,255,0.08)',
      boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
      opacity: isOff ? 0.65 : 1,
    }}>

      {/* Row 1 — avatar + full name + status badge */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
          style={{
            background: isOff ? 'rgba(248,113,113,0.15)' : 'rgba(16,185,129,0.15)',
            border: `1px solid ${isOff ? 'rgba(248,113,113,0.25)' : 'rgba(16,185,129,0.22)'}`,
          }}>
          {name[0]?.toUpperCase()}
        </div>
        <p className="text-white font-semibold text-sm leading-tight flex-1 min-w-0">{name}</p>
        {isOff ? (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
            style={{ background: 'rgba(248,113,113,0.12)', color: '#f87171', border: '1px solid rgba(248,113,113,0.22)' }}>
            Day Off
          </span>
        ) : totalMeals > 0 ? (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
            style={{ background: 'rgba(16,185,129,0.10)', color: '#34d399', border: '1px solid rgba(16,185,129,0.20)' }}>
            {totalMeals} meal{totalMeals !== 1 ? 's' : ''}
          </span>
        ) : null}
      </div>

      {/* Row 2 — action buttons */}
      <div className="flex items-center gap-1.5">

        {/* Lunch */}
        <button {...lunchTap} disabled={isOff || !isLive}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-bold disabled:opacity-30"
          style={{
            background: hasLunch ? 'rgba(16,185,129,0.18)' : 'rgba(255,255,255,0.05)',
            border: hasLunch ? '1px solid rgba(16,185,129,0.38)' : '1px solid rgba(255,255,255,0.08)',
            color: hasLunch ? '#34d399' : '#475569',
            WebkitTapHighlightColor: 'transparent',
          }}>
          ☀️ Lunch
        </button>

        {/* Dinner */}
        <button {...dinnerTap} disabled={isOff || !isLive}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-bold disabled:opacity-30"
          style={{
            background: hasDinner ? 'rgba(59,130,246,0.18)' : 'rgba(255,255,255,0.05)',
            border: hasDinner ? '1px solid rgba(59,130,246,0.38)' : '1px solid rgba(255,255,255,0.08)',
            color: hasDinner ? '#60a5fa' : '#475569',
            WebkitTapHighlightColor: 'transparent',
          }}>
          🌙 Dinner
        </button>

        {/* Guest stepper */}
        <div className="flex items-center gap-1 px-1.5 py-1 rounded-lg flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <button {...gMinusTap} disabled={isOff || guests===0 || !isLive}
            className="w-5 h-5 rounded flex items-center justify-center disabled:opacity-20"
            style={{ background: 'rgba(255,255,255,0.08)', WebkitTapHighlightColor: 'transparent' }}>
            <Minus size={9} className="text-slate-400" />
          </button>
          <span className="text-[11px] font-bold w-4 text-center"
            style={{ color: guests > 0 ? '#f59e0b' : '#334155' }}>{guests}</span>
          <button {...gPlusTap} disabled={isOff || guests>=10 || !isLive}
            className="w-5 h-5 rounded flex items-center justify-center disabled:opacity-20"
            style={{ background: 'rgba(255,255,255,0.08)', WebkitTapHighlightColor: 'transparent' }}>
            <Plus size={9} className="text-slate-400" />
          </button>
        </div>

        {/* Off */}
        <button {...offTap} disabled={!isLive}
          className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex-shrink-0 disabled:opacity-30"
          style={{
            background: isOff ? 'rgba(248,113,113,0.18)' : 'rgba(255,255,255,0.05)',
            border: isOff ? '1px solid rgba(248,113,113,0.38)' : '1px solid rgba(255,255,255,0.08)',
            color: isOff ? '#f87171' : '#475569',
            WebkitTapHighlightColor: 'transparent',
          }}>
          {isOff ? '✕ Off' : 'Off'}
        </button>

      </div>
    </div>
  );
}
