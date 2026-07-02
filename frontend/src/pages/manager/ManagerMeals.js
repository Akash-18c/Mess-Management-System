import React, { useEffect, useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight, Users, Plus, Minus } from 'lucide-react';
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

// ── Scroll-safe tap hook ──────────────────────────────────────────────────────
// Returns { onTouchStart, onTouchEnd, onClick } props for a button.
// onTouchEnd fires the action only if the finger didn't scroll (dy < 10px).
// onClick is a no-op fallback for desktop (touch already handled it via flag).
function useSafeTap(action, disabled = false) {
  const origin = useRef(null);
  const fired  = useRef(false);

  const onTouchStart = (e) => {
    if (disabled) return;
    origin.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    fired.current = false;
  };
  const onTouchEnd = (e) => {
    if (disabled || !origin.current) return;
    const dy = Math.abs(e.changedTouches[0].clientY - origin.current.y);
    const dx = Math.abs(e.changedTouches[0].clientX - origin.current.x);
    origin.current = null;
    if (dy > 10 || dx > 10) return; // was a scroll, ignore
    e.preventDefault();
    fired.current = true;
    action();
  };
  const onClick = () => {
    if (disabled) return;
    if (fired.current) { fired.current = false; return; } // already fired by touch
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
  const pendingRef  = useRef({});
  const calendarRef = useRef(null);

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
      map[`${m.memberId?._id}_${m.date?.slice(0,10)}`] = m;
    });
    setMealData(map);
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
    if (!isLiveMonth) return;
    const key = `${memberId}_${selectedDate}`;
    const cur = mealData[key] || {};
    if (cur.isOff) return;
    const next = { ...cur, [type]: !cur[type] };
    setMealData(prev => ({ ...prev, [key]: next }));
    saveMeal(memberId, { lunch: next.lunch||false, dinner: next.dinner||false, isOff: false }, cur);
  };

  const toggleOff = (memberId) => {
    if (!isLiveMonth) return;
    const key = `${memberId}_${selectedDate}`;
    const cur = mealData[key] || {};
    const isOff = !cur.isOff;
    const next = { ...cur, isOff, lunch: isOff ? false : cur.lunch, dinner: isOff ? false : cur.dinner };
    setMealData(prev => ({ ...prev, [key]: next }));
    saveMeal(memberId, { lunch: next.lunch||false, dinner: next.dinner||false, isOff }, cur);
  };

  const changeGuest = (memberId, delta) => {
    if (!isLiveMonth) return;
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
    return { num: i+1, dateStr: `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`, dayIdx: d.getDay() };
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
            {isLiveMonth ? 'Mark attendance for each member' : 'View only — current month only'}
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
      <div className="rounded-2xl p-3" style={glass}>
        <div ref={calendarRef} className="flex gap-1.5 overflow-x-auto"
          style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', paddingBottom: 2 }}>
          {days.map(({ num, dateStr, dayIdx }) => {
            const isSel   = dateStr === selectedDate;
            const isToday = dateStr === todayStr;
            const hasMeal = members.some(m => {
              const d = mealData[`${m._id}_${dateStr}`];
              return d?.lunch || d?.dinner || d?.guestMeals > 0;
            });
            return (
              <CalDay key={num} num={num} dayIdx={dayIdx} isSel={isSel} isToday={isToday}
                hasMeal={hasMeal} onSelect={() => setSelectedDate(dateStr)} />
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

      {!isLiveMonth && (
        <div className="rounded-2xl px-4 py-2.5 flex items-center gap-2"
          style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.18)' }}>
          <span className="text-amber-400">👁</span>
          <p className="text-amber-300 text-xs font-medium">View only — editing allowed in current month only</p>
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
              isLive={isLiveMonth}
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
function CalDay({ num, dayIdx, isSel, isToday, hasMeal, onSelect }) {
  const tap = useSafeTap(onSelect);
  return (
    <button {...tap} data-today={isToday ? 'true' : undefined}
      className="flex flex-col items-center flex-shrink-0 rounded-xl"
      style={{
        width: 42, padding: '8px 4px',
        background: isSel ? 'linear-gradient(135deg,#10b981,#059669)' : isToday ? 'rgba(16,185,129,0.10)' : 'rgba(255,255,255,0.03)',
        border: isSel ? '1px solid rgba(16,185,129,0.6)' : isToday ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(255,255,255,0.06)',
        boxShadow: isSel ? '0 4px 14px rgba(16,185,129,0.30)' : 'none',
        WebkitTapHighlightColor: 'transparent',
      }}>
      <span className="text-[8px] font-bold uppercase mb-1"
        style={{ color: isSel ? 'rgba(255,255,255,0.75)' : dayIdx===0 ? '#f87171' : '#475569' }}>
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
}

// ── Member Card ───────────────────────────────────────────────────────────────
function MemberCard({ member, data, isLive, onToggleMeal, onToggleOff, onChangeGuest }) {
  const isOff    = !!data.isOff;
  const hasLunch = !!data.lunch;
  const hasDinner= !!data.dinner;
  const guests   = data.guestMeals || 0;
  const name     = rn(member.name);

  const lunchTap  = useSafeTap(() => onToggleMeal(member._id, 'lunch'),  isOff || !isLive);
  const dinnerTap = useSafeTap(() => onToggleMeal(member._id, 'dinner'), isOff || !isLive);
  const offTap    = useSafeTap(() => onToggleOff(member._id),            !isLive);
  const gMinusTap = useSafeTap(() => onChangeGuest(member._id, -1),      isOff || guests===0 || !isLive);
  const gPlusTap  = useSafeTap(() => onChangeGuest(member._id, +1),      isOff || guests>=10 || !isLive);

  return (
    <div className="rounded-2xl px-3 py-2.5" style={{
      background: 'rgba(255,255,255,0.04)',
      backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)',
      border: isOff
        ? '1px solid rgba(248,113,113,0.22)'
        : (hasLunch || hasDinner)
        ? '1px solid rgba(16,185,129,0.18)'
        : '1px solid rgba(255,255,255,0.08)',
      boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
      opacity: isOff ? 0.65 : 1,
      transition: 'opacity 0.2s, border 0.2s',
    }}>
      <div className="flex items-center gap-2">

        {/* Avatar */}
        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
          style={{
            background: isOff ? 'rgba(248,113,113,0.15)' : 'rgba(16,185,129,0.15)',
            border: `1px solid ${isOff ? 'rgba(248,113,113,0.25)' : 'rgba(16,185,129,0.22)'}`,
          }}>
          {name[0]?.toUpperCase()}
        </div>

        {/* Name */}
        <p className="text-white font-semibold text-xs leading-tight truncate flex-1 min-w-0">{name}</p>

        {/* Lunch pill */}
        <button {...lunchTap} disabled={isOff || !isLive}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex-shrink-0 disabled:opacity-30"
          style={{
            background: hasLunch ? 'rgba(16,185,129,0.18)' : 'rgba(255,255,255,0.05)',
            border: hasLunch ? '1px solid rgba(16,185,129,0.40)' : '1px solid rgba(255,255,255,0.08)',
            color: hasLunch ? '#34d399' : '#475569',
            WebkitTapHighlightColor: 'transparent',
            transition: 'background 0.15s, border 0.15s, color 0.15s',
          }}>
          ☀️ <span>L</span>
        </button>

        {/* Dinner pill */}
        <button {...dinnerTap} disabled={isOff || !isLive}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex-shrink-0 disabled:opacity-30"
          style={{
            background: hasDinner ? 'rgba(59,130,246,0.18)' : 'rgba(255,255,255,0.05)',
            border: hasDinner ? '1px solid rgba(59,130,246,0.40)' : '1px solid rgba(255,255,255,0.08)',
            color: hasDinner ? '#60a5fa' : '#475569',
            WebkitTapHighlightColor: 'transparent',
            transition: 'background 0.15s, border 0.15s, color 0.15s',
          }}>
          🌙 <span>D</span>
        </button>

        {/* Guest stepper */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button {...gMinusTap} disabled={isOff || guests===0 || !isLive}
            className="w-6 h-6 rounded-md flex items-center justify-center disabled:opacity-20"
            style={{ background: 'rgba(255,255,255,0.07)', WebkitTapHighlightColor: 'transparent' }}>
            <Minus size={10} className="text-slate-400" />
          </button>
          <span className="text-[11px] font-bold w-4 text-center"
            style={{ color: guests > 0 ? '#f59e0b' : '#334155' }}>{guests}</span>
          <button {...gPlusTap} disabled={isOff || guests>=10 || !isLive}
            className="w-6 h-6 rounded-md flex items-center justify-center disabled:opacity-20"
            style={{ background: 'rgba(255,255,255,0.07)', WebkitTapHighlightColor: 'transparent' }}>
            <Plus size={10} className="text-slate-400" />
          </button>
        </div>

        {/* Off pill */}
        <button {...offTap} disabled={!isLive}
          className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex-shrink-0 disabled:opacity-30"
          style={{
            background: isOff ? 'rgba(248,113,113,0.18)' : 'rgba(255,255,255,0.05)',
            border: isOff ? '1px solid rgba(248,113,113,0.40)' : '1px solid rgba(255,255,255,0.08)',
            color: isOff ? '#f87171' : '#475569',
            WebkitTapHighlightColor: 'transparent',
            transition: 'background 0.15s, border 0.15s, color 0.15s',
          }}>
          {isOff ? '✕ Off' : 'Off'}
        </button>

      </div>
    </div>
  );
}
