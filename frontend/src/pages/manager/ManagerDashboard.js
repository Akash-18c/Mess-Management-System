import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { Calendar, ChevronDown, Sparkles, UtensilsCrossed } from 'lucide-react';
import api from '../../api';
import DashboardShared from '../../components/DashboardShared';
import BirthdayBanner from '../../components/BirthdayBanner';
import { getCache, setCache, clearCache } from '../../utils/cache';

const rn = (name) => { const m = name?.match(/^\w+\s*\((.+)\)$/); return m ? m[1] : (name || ''); };

const MONTHS_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function buildMonthRange() {
  const now = new Date();
  const cur = { m: now.getMonth() + 1, y: now.getFullYear() };
  const list = [];
  for (let i = 12; i >= 1; i--) {
    let m = cur.m - i; let y = cur.y;
    while (m <= 0) { m += 12; y--; }
    list.push({ month: m, year: y });
  }
  list.push({ month: cur.m, year: cur.y });
  for (let i = 1; i <= 2; i++) {
    let m = cur.m + i; let y = cur.y;
    while (m > 12) { m -= 12; y++; }
    list.push({ month: m, year: y });
  }
  return list.reverse();
}
const MONTH_RANGE = buildMonthRange();

const BAR_COLORS = ['#f59e0b','#fbbf24','#fcd34d','#fde68a','#f97316','#fb923c','#fdba74','#fed7aa'];

const glass = {
  background: 'rgba(255,255,255,0.03)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.10)',
  boxShadow: '0 4px 20px rgba(0,0,0,0.30)',
};

function getNow() { const d = new Date(); return { m: d.getMonth() + 1, y: d.getFullYear() }; }

export default function ManagerDashboard() {
  const [cur, setCur] = useState(getNow);
  const curMonth = cur.m;
  const curYear  = cur.y;

  const [today, setToday] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedMonth, setSelectedMonth] = useState(() => getNow().m);
  const [selectedYear,  setSelectedYear]  = useState(() => getNow().y);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [allSummaries, setAllSummaries] = useState([]);
  const [summary, setSummary] = useState(null);
  const [meals, setMeals] = useState([]);
  const [members, setMembers] = useState([]);
  const [totalCollected, setTotalCollected] = useState(0);
  const [individualCosts, setIndividualCosts] = useState([]);
  const [advancePaid, setAdvancePaid] = useState(null);
  const dropRef = useRef(null);
  const navigate = useNavigate();

  const isCurrentMonth = selectedMonth === curMonth && selectedYear === curYear;

  // ── midnight date reset
  useEffect(() => {
    const msUntilMidnight = () => {
      const n = new Date();
      return new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1) - n;
    };
    const schedule = () => {
      const t = setTimeout(() => {
        const next = getNow();
        setToday(new Date().toISOString().slice(0, 10));
        setSelectedMonth(prev => prev === curMonth ? next.m : prev);
        setSelectedYear(prev => prev === curYear ? next.y : prev);
        setCur(next);
        clearCache();
        schedule();
      }, msUntilMidnight() + 500);
      return t;
    };
    const t = schedule();
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── auto-refresh every 60s for current month
  useEffect(() => {
    if (!isCurrentMonth) return;
    const t = setInterval(() => { clearCache(); load(); }, 60000);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCurrentMonth]);

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchend', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchend', handler);
    };
  }, []);

  useEffect(() => {
    const cached = getCache('summaries');
    if (cached) { setAllSummaries(cached); } else {
      api.get('/summary/list').then(r => { setAllSummaries(r.data); setCache('summaries', r.data); }).catch(() => {});
    }
    const cachedM = getCache('members');
    if (cachedM) { setMembers(cachedM); } else {
      api.get('/admin/members')
        .then(r => { const d = r.data.filter(m => m.isActive); setMembers(d); setCache('members', d); })
        .catch(() => api.get('/members').then(r => { setMembers(r.data); setCache('members', r.data); }).catch(() => {}));
    }
  }, []);

  const load = useCallback(() => {
    const sk = `summary-${selectedMonth}-${selectedYear}`;
    const mk = `meals-${selectedMonth}-${selectedYear}`;
    const dk = isCurrentMonth ? 'dashboard' : `monthdata-${selectedMonth}-${selectedYear}`;

    const cs = getCache(sk);
    if (cs) setSummary(cs); else
      api.get(`/summary/${selectedMonth}/${selectedYear}`).then(r => { setSummary(r.data); setCache(sk, r.data); }).catch(() => setSummary(null));

    const cm = getCache(mk);
    if (cm) setMeals(cm); else
      api.get(`/meals/${selectedMonth}/${selectedYear}`).then(r => { setMeals(r.data); setCache(mk, r.data); }).catch(() => setMeals([]));

    const cd = getCache(dk);
    if (cd) { setTotalCollected(cd.tc); setIndividualCosts(cd.ic); if (cd.adv != null) setAdvancePaid(cd.adv); } else {
      if (isCurrentMonth) {
        api.get('/member/dashboard').then(r => {
          setTotalCollected(r.data.totalCollected || 0);
          setIndividualCosts(r.data.individualCosts || []);
          setAdvancePaid(r.data.advance ?? null);
          setCache(dk, { tc: r.data.totalCollected || 0, ic: r.data.individualCosts || [], adv: r.data.advance ?? null });
        }).catch(() => {});
      } else {
        api.get(`/member/month-data/${selectedMonth}/${selectedYear}`).then(r => {
          setTotalCollected(r.data.totalCollected ?? 0);
          setIndividualCosts(r.data.individualCosts ?? []);
          setCache(dk, { tc: r.data.totalCollected ?? 0, ic: r.data.individualCosts ?? [] });
        }).catch(() => { setTotalCollected(0); setIndividualCosts([]); });
      }
    }
  }, [selectedMonth, selectedYear, isCurrentMonth]);

  useEffect(() => { load(); }, [load]);

  const memberMealCounts = members.map(m => {
    const mm = meals.filter(ml => {
      const mid = ml.memberId?._id || ml.memberId;
      return mid?.toString() === m._id?.toString() && !ml.isOff;
    });
    const lunch  = mm.filter(ml => ml.lunch).length;
    const dinner = mm.filter(ml => ml.dinner).length;
    return { name: rn(m.name).split(' ')[0], lunch, dinner, meals: lunch + dinner };
  });

  const todayTotal = meals.filter(m => m.date?.slice(0, 10) === today)
    .reduce((s, m) => s + (m.lunch ? 1 : 0) + (m.dinner ? 1 : 0), 0);

  const selectedLabel = `${MONTHS_FULL[selectedMonth - 1]} ${selectedYear}`;

  const summaryMap = {};
  allSummaries.forEach(s => { summaryMap[`${s.year}-${s.month}`] = s; });
  const monthOptions = MONTH_RANGE.map(({ month, year }) => {
    const s = summaryMap[`${year}-${month}`];
    return { month, year, isClosed: s?.isClosed ?? false, isCurrent: month === curMonth && year === curYear, hasData: !!s };
  });

  return (
    <div className="space-y-4">
      {/* ── Birthday Banner ── */}
      <BirthdayBanner />
      {/* ── Header + Dropdown ── */}
      <div className="relative" ref={dropRef}>
        <div className="flex items-start justify-between gap-3 rounded-2xl p-3 px-4" style={glass}>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Sparkles size={15} className="text-amber-400 flex-shrink-0" />
              <h1 style={{
                fontFamily: "'Dancing Script', cursive", fontSize: 'clamp(1.3rem, 5vw, 1.8rem)', fontWeight: 700,
                background: 'linear-gradient(135deg,#ffffff 0%,#fef3c7 40%,#fbbf24 75%,#d97706 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                lineHeight: 1.2,
              }}>Manager Dashboard</h1>
            </div>
            <p className="text-slate-500 text-[10px] mt-0.5 pl-5">Viewing · {selectedLabel}</p>
          </div>
          <button
            onTouchEnd={(e) => { e.preventDefault(); setDropdownOpen(o => !o); }}
            onClick={() => setDropdownOpen(o => !o)}
            className="flex items-center gap-2 text-xs font-semibold text-white flex-shrink-0"
            style={{
              background: 'rgba(245,158,11,0.12)',
              border: '1px solid rgba(245,158,11,0.30)',
              borderRadius: '12px', padding: '8px 10px',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <Calendar size={13} className="text-amber-400" />
            <span>{selectedLabel}</span>
            <ChevronDown size={12} className={`text-slate-400 ml-1 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-2 z-[200] rounded-2xl overflow-hidden" style={{
            minWidth: '220px',
            background: 'rgba(8,14,28,0.98)',
            backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)',
            border: '1px solid rgba(245,158,11,0.20)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.8)',
          }}>
            <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(245,158,11,0.08)' }}>
              <Calendar size={12} className="text-amber-400" />
              <p className="text-[10px] font-bold text-amber-300 uppercase tracking-widest">Select Month</p>
            </div>
            <div className="max-h-64 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
              {monthOptions.map(o => {
                const isSel = o.month === selectedMonth && o.year === selectedYear;
                return (
                  <button
                    key={`${o.month}-${o.year}`}
                    onTouchEnd={(e) => { e.preventDefault(); setSelectedMonth(o.month); setSelectedYear(o.year); setDropdownOpen(false); }}
                    onClick={() => { setSelectedMonth(o.month); setSelectedYear(o.year); setDropdownOpen(false); }}
                    className="w-full text-left flex items-center justify-between"
                    style={{
                      padding: '10px 14px',
                      background: isSel ? 'rgba(245,158,11,0.12)' : 'transparent',
                      borderLeft: isSel ? '2px solid #f59e0b' : '2px solid transparent',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: o.hasData ? (o.isClosed ? '#f87171' : '#34d399') : '#334155' }} />
                      <span className="text-sm font-medium" style={{ color: isSel ? '#fcd34d' : '#cbd5e1' }}>
                        {MONTHS_FULL[o.month - 1].slice(0,3)} {o.year}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                      {o.isCurrent && <span style={{ fontSize: '9px', background: 'rgba(245,158,11,0.22)', color: '#fcd34d', border: '1px solid rgba(245,158,11,0.40)', padding: '2px 6px', borderRadius: '999px', fontWeight: 700 }}>LIVE</span>}
                      {o.hasData && o.isClosed && <span style={{ fontSize: '9px', background: 'rgba(248,113,113,0.12)', color: '#fca5a5', border: '1px solid rgba(248,113,113,0.25)', padding: '2px 6px', borderRadius: '999px' }}>Closed</span>}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-4 px-4 py-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.15)' }}>
              {[['#34d399','Open'],['#f87171','Closed'],['#334155','No data']].map(([c,l]) => (
                <span key={l} className="flex items-center gap-1.5 text-[9px] text-slate-500">
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: c }} />{l}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Shared Dashboard ── */}
      <DashboardShared
        summary={summary}
        totalCollected={totalCollected}
        mealRate={summary?.mealRate}
        totalAllMeals={summary?.totalMeals}
        individualCosts={individualCosts}
        canEditGas={isCurrentMonth}
        role="manager"
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        advancePaid={isCurrentMonth ? advancePaid : null}
      />

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Today's Meals", value: isCurrentMonth ? todayTotal : '—', emoji: '🍽️', accent: 'rgba(34,197,94,0.10)',  border: 'rgba(34,197,94,0.18)',  top: 'rgba(34,197,94,0.06)'  },
          { label: 'Total Expense',  value: `₹${summary?.grandTotal?.toFixed(0) || '0'}`, emoji: '💸', accent: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.18)', top: 'rgba(245,158,11,0.06)' },
          { label: 'Members',        value: members.length, emoji: '👥', accent: 'rgba(96,165,250,0.10)',  border: 'rgba(96,165,250,0.18)',  top: 'rgba(96,165,250,0.06)'  },
        ].map(({ label, value, emoji, accent, border, top }) => (
          <div key={label} className="rounded-2xl overflow-hidden"
            style={{ background: accent, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: `1px solid ${border}`, boxShadow: '0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)' }}>
            <div className="px-3 pt-3 pb-2.5">
              <div className="text-2xl mb-2 leading-none">{emoji}</div>
              <p className="text-lg font-bold text-white leading-none tabular-nums truncate">{value}</p>
              <p className="text-[10px] text-slate-400 mt-1.5 leading-tight font-medium">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Bar Chart ── */}
      {memberMealCounts.some(m => m.meals > 0) && (
        <div className="rounded-2xl overflow-hidden" style={glass}>
          {/* header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.25)' }}>
                  <UtensilsCrossed size={13} className="text-amber-400" />
                </div>
                <p className="text-sm font-bold text-white">Member Meal Count</p>
              </div>
              <p className="text-slate-500 text-xs mt-0.5 pl-9">{selectedLabel}</p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-300">
                <span className="w-2 h-2 rounded-sm inline-block" style={{ background: '#f59e0b' }} /> Lunch
              </span>
              <span className="flex items-center gap-1 text-[10px] font-semibold text-orange-300">
                <span className="w-2 h-2 rounded-sm inline-block" style={{ background: '#fb923c' }} /> Dinner
              </span>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.18)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span className="text-[10px] font-semibold text-amber-400">{memberMealCounts.reduce((s,m)=>s+m.meals,0)} meals</span>
              </div>
            </div>
          </div>
          {/* chart */}
          <div className="px-2 pb-3" style={{ overflowX: 'auto', overflowY: 'hidden' }}>
            <div style={{ minWidth: Math.max(memberMealCounts.length * 72, 300) + 'px', height: '240px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={memberMealCounts} margin={{ top: 24, right: 16, left: -8, bottom: 52 }} barCategoryGap="30%" barGap={3}>
                  <defs>
                    <linearGradient id="mgr-lunch" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"  stopColor="#f59e0b" stopOpacity={1} />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.5} />
                    </linearGradient>
                    <linearGradient id="mgr-dinner" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"  stopColor="#fb923c" stopOpacity={1} />
                      <stop offset="100%" stopColor="#fb923c" stopOpacity={0.5} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickLine={false}
                    interval={0} angle={-38} textAnchor="end" height={56} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false}
                    allowDecimals={false} width={26} tickFormatter={v => v === 0 ? '' : v} />
                  <Tooltip
                    contentStyle={{ background: 'rgba(8,14,28,0.96)', border: '1px solid rgba(245,158,11,0.30)', borderRadius: '12px', color: '#fff', fontSize: '12px', padding: '8px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}
                    cursor={{ fill: 'rgba(255,255,255,0.04)', radius: 6 }}
                    formatter={(v, name) => [
                      <span style={{ color: name === 'lunch' ? '#f59e0b' : '#fb923c', fontWeight: 700 }}>{v} meals</span>,
                      name === 'lunch' ? '☀️ Lunch' : '🌙 Dinner'
                    ]}
                  />
                  <Bar dataKey="lunch"  name="lunch"  radius={[6,6,2,2]} maxBarSize={28} fill="url(#mgr-lunch)"
                    label={{ position: 'top', fill: '#fcd34d', fontSize: 10, fontWeight: 700, formatter: v => v > 0 ? v : '' }} />
                  <Bar dataKey="dinner" name="dinner" radius={[6,6,2,2]} maxBarSize={28} fill="url(#mgr-dinner)"
                    label={{ position: 'top', fill: '#fdba74', fontSize: 10, fontWeight: 700, formatter: v => v > 0 ? v : '' }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── Quick Actions ── */}
      <div className="rounded-2xl p-4" style={glass}>
        <h3 className="font-semibold text-white mb-3 text-sm">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Mark Meals',      path: '/manager/meals',     emoji: '🍽', color: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.30)', text: '#6ee7b7' },
            { label: 'Add Expense',     path: '/manager/expenses',  emoji: '💰', color: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.30)', text: '#fcd34d' },
            { label: 'Record Payment',  path: '/manager/payments',  emoji: '💳', color: 'rgba(96,165,250,0.15)',  border: 'rgba(96,165,250,0.30)',  text: '#93c5fd' },
            { label: 'Generate Bills',  path: '/manager/bills',     emoji: '🧳', color: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.30)', text: '#c4b5fd' },
          ].map(({ label, path, emoji, color, border, text }) => (
            <button
              key={label}
              onTouchEnd={(e) => { e.preventDefault(); navigate(path); }}
              onClick={() => navigate(path)}
              className="flex items-center gap-3 rounded-xl p-3 text-left active:scale-95"
              style={{
                background: color,
                border: `1px solid ${border}`,
                transition: 'transform 0.1s',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <span className="text-2xl leading-none flex-shrink-0">{emoji}</span>
              <span className="text-sm font-semibold leading-tight" style={{ color: text }}>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
