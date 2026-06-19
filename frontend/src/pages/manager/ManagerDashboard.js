import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, ChevronDown, Sparkles } from 'lucide-react';
import api from '../../api';
import DashboardShared from '../../components/DashboardShared';

const rn = (name) => { const m = name?.match(/^\w+\s*\((.+)\)$/); return m ? m[1] : (name || ''); };

const MONTHS_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// simple in-memory cache
const cache = {};
function getCache(key) { const e = cache[key]; return e && Date.now() - e.ts < 30000 ? e.data : null; }
function setCache(key, data) { cache[key] = { data, ts: Date.now() }; }

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

const glass = {
  background: 'rgba(255,255,255,0.05)',
  backdropFilter: 'blur(40px)',
  WebkitBackdropFilter: 'blur(40px)',
  border: '1px solid rgba(255,255,255,0.12)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.10)',
};

export default function ManagerDashboard() {
  const now = new Date();
  const curMonth = now.getMonth() + 1;
  const curYear = now.getFullYear();

  const [today, setToday] = useState(now.toISOString().slice(0, 10));
  const [selectedMonth, setSelectedMonth] = useState(curMonth);
  const [selectedYear, setSelectedYear] = useState(curYear);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [allSummaries, setAllSummaries] = useState([]);
  const [summary, setSummary] = useState(null);
  const [meals, setMeals] = useState([]);
  const [members, setMembers] = useState([]);
  const [totalCollected, setTotalCollected] = useState(0);
  const [individualCosts, setIndividualCosts] = useState([]);
  const dropRef = useRef(null);
  const navigate = useNavigate();

  const isCurrentMonth = selectedMonth === curMonth && selectedYear === curYear;

  // ── midnight date reset
  useEffect(() => {
    const msUntilMidnight = () => {
      const n = new Date();
      return new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1) - n;
    };
    const tick = () => {
      setToday(new Date().toISOString().slice(0, 10));
      // clear cache so fresh data loads
      Object.keys(cache).forEach(k => delete cache[k]);
    };
    const t = setTimeout(() => { tick(); }, msUntilMidnight());
    return () => clearTimeout(t);
  }, [today]);

  // ── auto-refresh every 60s for current month
  useEffect(() => {
    if (!isCurrentMonth) return;
    const t = setInterval(() => { Object.keys(cache).forEach(k => delete cache[k]); load(); }, 60000);
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
    if (cd) { setTotalCollected(cd.tc); setIndividualCosts(cd.ic); } else {
      if (isCurrentMonth) {
        api.get('/member/dashboard').then(r => {
          setTotalCollected(r.data.totalCollected || 0);
          setIndividualCosts(r.data.individualCosts || []);
          setCache(dk, { tc: r.data.totalCollected || 0, ic: r.data.individualCosts || [] });
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
    const mm = meals.filter(ml => ml.memberId?._id === m._id && !ml.isOff);
    return { name: rn(m.name).split(' ')[0], meals: mm.reduce((s, ml) => s + (ml.lunch ? 1 : 0) + (ml.dinner ? 1 : 0), 0) };
  });

  const todayTotal = meals.filter(m => m.date?.slice(0, 10) === today)
    .reduce((s, m) => s + (m.lunch ? 1 : 0) + (m.dinner ? 1 : 0), 0);

  const selectedLabel = `${MONTHS_FULL[selectedMonth - 1]} ${selectedYear}`;

  const summaryMap = {};
  allSummaries.forEach(s => { summaryMap[`${s.year}-${s.month}`] = s; });
  const monthOptions = buildMonthRange().map(({ month, year }) => {
    const s = summaryMap[`${year}-${month}`];
    return { month, year, isClosed: s?.isClosed ?? false, isCurrent: month === curMonth && year === curYear, hasData: !!s };
  });

  return (
    <div className="space-y-4">

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
            background: 'rgba(8,14,28,0.97)',
            backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)',
            border: '1px solid rgba(245,158,11,0.20)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.8)',
          }}>
            <div className="px-3 py-2.5 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(245,158,11,0.08)' }}>
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
                      padding: '9px 14px',
                      background: isSel ? 'rgba(245,158,11,0.15)' : 'transparent',
                      borderLeft: isSel ? '2px solid #f59e0b' : '2px solid transparent',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: o.hasData ? (o.isClosed ? '#f87171' : '#34d399') : '#334155' }} />
                      <span className="text-xs font-medium" style={{ color: isSel ? '#fcd34d' : '#e2e8f0' }}>
                        {MONTHS_FULL[o.month - 1]} {o.year}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                      {o.isCurrent && <span style={{ fontSize: '8px', background: 'rgba(245,158,11,0.25)', color: '#fcd34d', border: '1px solid rgba(245,158,11,0.40)', padding: '2px 5px', borderRadius: '999px', fontWeight: 700 }}>LIVE</span>}
                      {o.hasData && o.isClosed && <span style={{ fontSize: '8px', background: 'rgba(248,113,113,0.12)', color: '#fca5a5', border: '1px solid rgba(248,113,113,0.25)', padding: '2px 5px', borderRadius: '999px' }}>Closed</span>}
                    </div>
                  </button>
                );
              })}
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
      />

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-3 gap-2.5">
        {[
          { label: "Today's Meals", value: isCurrentMonth ? todayTotal : '—', emoji: '🍽' },
          { label: 'Total Expense', value: `₹${summary?.grandTotal?.toFixed(0) || '0'}`, emoji: '💸' },
          { label: 'Members', value: members.length, emoji: '👥' },
        ].map(({ label, value, emoji }) => (
          <div key={label} className="rounded-2xl p-3" style={glass}>
            <div className="text-lg mb-1">{emoji}</div>
            <p className="text-base font-bold text-white leading-none truncate">{value}</p>
            <p className="text-[10px] text-slate-500 mt-1 leading-tight">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Bar Chart ── */}
      {memberMealCounts.some(m => m.meals > 0) && (
        <div className="rounded-2xl p-3" style={glass}>
          <h3 className="font-semibold text-white text-sm mb-0.5">Member Meal Count</h3>
          <p className="text-slate-500 text-xs mb-3">{selectedLabel}</p>
          <div style={{ overflowX: 'auto', overflowY: 'hidden' }}>
            <div style={{ minWidth: Math.max(memberMealCounts.length * 36, 300) + 'px', height: '200px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={memberMealCounts}
                  margin={{ top: 4, right: 8, left: -18, bottom: 48 }}
                  barCategoryGap="20%"
                >
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#64748b', fontSize: 9 }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    angle={-40}
                    textAnchor="end"
                    height={52}
                  />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 9 }}
                    axisLine={false}
                    tickLine={false}
                    width={28}
                  />
                  <Tooltip
                    contentStyle={{ background: 'rgba(8,14,28,0.97)', border: '1px solid rgba(245,158,11,0.20)', borderRadius: '10px', color: '#fff', fontSize: '11px' }}
                    cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                  />
                  <Bar dataKey="meals" fill="#f59e0b" radius={[4,4,0,0]} name="Meals" maxBarSize={28} />
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
