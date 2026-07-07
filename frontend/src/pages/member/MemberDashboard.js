import React, { useEffect, useState, useRef } from 'react';
import { UtensilsCrossed, IndianRupee, TrendingUp, Wallet, Calendar, ChevronDown, Sparkles, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api from '../../api';
import DashboardShared from '../../components/DashboardShared';
import PageLoader from '../../components/PageLoader';
import useAuthStore from '../../store/authStore';
import BirthdayBanner from '../../components/BirthdayBanner';

const MONTHS_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function buildMonthRange() {
  const now = new Date();
  const cur = { m: now.getMonth() + 1, y: now.getFullYear() };
  const list = [];
  for (let i = 12; i >= 1; i--) {
    let m = cur.m - i, y = cur.y;
    while (m <= 0) { m += 12; y--; }
    list.push({ month: m, year: y });
  }
  list.push({ month: cur.m, year: cur.y });
  for (let i = 1; i <= 2; i++) {
    let m = cur.m + i, y = cur.y;
    while (m > 12) { m -= 12; y++; }
    list.push({ month: m, year: y });
  }
  return list.reverse();
}

const BAR_COLORS = ['#22c55e','#34d399','#4ade80','#86efac','#6ee7b7','#10b981','#059669','#16a34a'];

function getNow() { const d = new Date(); return { m: d.getMonth() + 1, y: d.getFullYear() }; }

export default function MemberDashboard() {
  const { user } = useAuthStore();
  const [cur, setCur] = useState(getNow);
  const curMonth = cur.m;
  const curYear  = cur.y;

  const [data,          setData]          = useState(null);
  const [allSummaries,  setAllSummaries]  = useState([]);
  const [monthData,     setMonthData]     = useState(null);
  const [myCharges,     setMyCharges]     = useState([]);
  const [dropdownOpen,  setDropdownOpen]  = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => getNow().m);
  const [selectedYear,  setSelectedYear]  = useState(() => getNow().y);
  const dropRef = useRef(null);

  useEffect(() => {
    const h = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropdownOpen(false); };
    document.addEventListener('mousedown', h);
    document.addEventListener('touchstart', h, { passive: true });
    return () => { document.removeEventListener('mousedown', h); document.removeEventListener('touchstart', h); };
  }, []);

  // Auto-advance month at midnight
  useEffect(() => {
    const msUntilMidnight = () => {
      const n = new Date();
      return new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1) - n;
    };
    const schedule = () => {
      const t = setTimeout(() => {
        const next = getNow();
        setSelectedMonth(prev => prev === curMonth ? next.m : prev);
        setSelectedYear(prev => prev === curYear ? next.y : prev);
        setCur(next);
        schedule();
      }, msUntilMidnight() + 500);
      return t;
    };
    const t = schedule();
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    api.get('/member/dashboard').then(r => setData(r.data));
    api.get('/summary/list').then(r => setAllSummaries(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    api.get(`/expenses/charges/my/${selectedMonth}/${selectedYear}`)
      .then(r => setMyCharges(r.data)).catch(() => setMyCharges([]));
  }, [selectedMonth, selectedYear]);

  const isCurrentMonth = selectedMonth === curMonth && selectedYear === curYear;

  useEffect(() => {
    if (isCurrentMonth) { setMonthData(null); return; }
    api.get(`/member/month-data/${selectedMonth}/${selectedYear}`)
      .then(r => setMonthData(r.data))
      .catch(() => setMonthData(null));
  }, [selectedMonth, selectedYear, isCurrentMonth]);

  if (!data) return <PageLoader />;

  const { lunch, dinner, mealRate, estimatedBill, myOtherCharges, masiPerMember, advance,
          totalCollected, memberMealCounts, summary, individualCosts, gasCharge, riceCharge } = data;

  const totalMeals   = lunch + dinner;
  const myRow        = individualCosts?.find(c => c._id?.toString() === user?._id?.toString());
  const masiSalary   = myRow?.masiSalary   ?? masiPerMember ?? 0;
  const myOther      = myRow?.otherCharges ?? myOtherCharges ?? 0;
  const myGasCharge  = myRow?.gasCharge    ?? gasCharge  ?? 0;
  const myRiceCharge = myRow?.riceCharge   ?? riceCharge ?? 0;
  const due          = estimatedBill + masiSalary + myOther + myGasCharge + myRiceCharge - advance;

  const activeSummary         = isCurrentMonth ? summary         : monthData?.summary;
  const activeTotalCollected  = isCurrentMonth ? totalCollected  : (monthData?.totalCollected ?? 0);
  const activeIndividualCosts = isCurrentMonth ? individualCosts : (monthData?.individualCosts ?? []);
  const activeMealRate        = activeSummary?.mealRate ?? (isCurrentMonth ? mealRate : 0);
  const selectedLabel         = `${MONTHS_FULL[selectedMonth - 1]} ${selectedYear}`;

  const summaryMap = {};
  allSummaries.forEach(s => { summaryMap[`${s.year}-${s.month}`] = s; });
  const monthOptions = buildMonthRange().map(({ month, year }) => {
    const s = summaryMap[`${year}-${month}`];
    const isCurrent = month === curMonth && year === curYear;
    return { month, year, isClosed: s?.isClosed ?? false, isCurrent, hasData: !!s || isCurrent };
  });

  const billSubs = [
    masiSalary   > 0 ? `Masi ₹${masiSalary.toFixed(0)}`   : '',
    myGasCharge  > 0 ? `Gas ₹${myGasCharge.toFixed(0)}`   : '',
    myRiceCharge > 0 ? `Rice ₹${myRiceCharge.toFixed(0)}` : '',
    myOther      > 0 ? `Other ₹${myOther.toFixed(0)}`     : '',
  ].filter(Boolean).join(' · ');

  const totalCharges = myCharges.reduce((s, c) => s + c.amount, 0);

  // bar chart: ensure names are short (first name only)
  const chartData = (memberMealCounts || []).map(m => ({
    name: m.name?.split(' ')[0] ?? m.name,
    lunch: m.lunch ?? 0,
    dinner: m.dinner ?? 0,
    meals: (m.lunch ?? 0) + (m.dinner ?? 0),
  }));

  return (
    <div className="space-y-4 pb-8">
      {/* ── Birthday Banner ── */}
      <BirthdayBanner />
      {/* ── Header row ── */}
      <div className="flex items-center justify-between gap-3">
        {/* Title */}
        <div>
          <div className="flex items-center gap-2">
            <Sparkles size={15} className="text-green-400 flex-shrink-0" />
            <h1 style={{
              fontFamily: "'Dancing Script', cursive", fontSize: 'clamp(1.4rem,5vw,1.75rem)', fontWeight: 700,
              background: 'linear-gradient(135deg,#ffffff 0%,#bbf7d0 40%,#34d399 75%,#059669 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              lineHeight: 1.2,
            }}>My Dashboard</h1>
          </div>
          <p className="text-slate-500 text-xs mt-0.5 pl-5">Viewing · {selectedLabel}</p>
        </div>

        {/* Month Dropdown */}
        <div className="relative flex-shrink-0" ref={dropRef}>
          <button
            onTouchEnd={e => { e.preventDefault(); setDropdownOpen(o => !o); }}
            onClick={() => setDropdownOpen(o => !o)}
            className="flex items-center gap-2 text-sm font-semibold text-white"
            style={{
              background: 'rgba(34,197,94,0.08)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(34,197,94,0.25)',
              borderRadius: '12px', padding: '8px 12px',
              minWidth: '160px',
              justifyContent: 'space-between',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Calendar size={13} className="text-green-400 flex-shrink-0" />
              <span className="truncate text-sm">{selectedLabel}</span>
            </div>
            <ChevronDown size={13} className={`text-slate-400 flex-shrink-0 transition-transform duration-200 ml-1 ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div
              className="absolute right-0 top-full mt-2 z-[200] rounded-2xl overflow-hidden"
              style={{
                width: '210px',
                background: 'rgba(8,14,28,0.98)',
                backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)',
                border: '1px solid rgba(34,197,94,0.20)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.85)',
              }}
            >
              {/* Dropdown header */}
              <div className="flex items-center gap-2 px-4 py-3"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(34,197,94,0.07)' }}>
                <Calendar size={12} className="text-green-400" />
                <p className="text-[10px] font-bold text-green-300 uppercase tracking-widest">Select Month</p>
              </div>

              {/* Month list */}
              <div className="overflow-y-auto" style={{ maxHeight: '260px', scrollbarWidth: 'thin' }}>
                {monthOptions.map(o => {
                  const isSel = o.month === selectedMonth && o.year === selectedYear;
                  return (
                    <button
                      key={`${o.month}-${o.year}`}
                      onTouchEnd={e => { e.preventDefault(); setSelectedMonth(o.month); setSelectedYear(o.year); setDropdownOpen(false); }}
                      onClick={() => { setSelectedMonth(o.month); setSelectedYear(o.year); setDropdownOpen(false); }}
                      className="w-full flex items-center justify-between"
                      style={{
                        padding: '10px 16px',
                        background: isSel ? 'rgba(34,197,94,0.12)' : 'transparent',
                        borderLeft: isSel ? '2px solid #22c55e' : '2px solid transparent',
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        WebkitTapHighlightColor: 'transparent',
                        transition: 'background 0.15s',
                      }}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ background: o.hasData ? (o.isClosed ? '#f87171' : '#34d399') : '#334155' }} />
                        <span className="text-sm font-medium" style={{ color: isSel ? '#86efac' : '#cbd5e1' }}>
                          {MONTHS_FULL[o.month - 1].slice(0, 3)} {o.year}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                        {o.isCurrent && (
                          <span style={{ fontSize: '9px', background: 'rgba(34,197,94,0.22)', color: '#86efac', border: '1px solid rgba(34,197,94,0.40)', padding: '2px 6px', borderRadius: '999px', fontWeight: 700, letterSpacing: '0.03em' }}>LIVE</span>
                        )}
                        {o.hasData && o.isClosed && (
                          <span style={{ fontSize: '9px', background: 'rgba(248,113,113,0.12)', color: '#fca5a5', border: '1px solid rgba(248,113,113,0.25)', padding: '2px 6px', borderRadius: '999px' }}>Closed</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Dropdown footer legend */}
              <div className="px-4 py-2.5 flex items-center gap-3"
                style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)' }}>
                <span className="flex items-center gap-1 text-[9px] text-slate-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" /> Open
                </span>
                <span className="flex items-center gap-1 text-[9px] text-slate-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" /> Closed
                </span>
                <span className="flex items-center gap-1 text-[9px] text-slate-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-600 inline-block" /> No data
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Shared Dashboard (welcome banner + summary cards + expense cards + messy kitchen card) ── */}
      <DashboardShared
        summary={activeSummary}
        totalCollected={activeTotalCollected}
        mealRate={activeMealRate}
        totalAllMeals={activeSummary?.totalMeals}
        individualCosts={activeIndividualCosts}
        canEditGas={false}
        role="member"
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
      />

      {/* ── My Other Charges ── */}
      {myCharges.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{
          background: 'rgba(245,158,11,0.05)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(245,158,11,0.15)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}>
          {/* Card header */}
          <div className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid rgba(245,158,11,0.12)', background: 'rgba(245,158,11,0.08)' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(245,158,11,0.18)', border: '1px solid rgba(245,158,11,0.28)' }}>
                <AlertCircle size={15} className="text-amber-400" />
              </div>
              <p className="text-sm font-semibold text-white">My Other Charges</p>
            </div>
            <span className="text-sm font-bold text-amber-400 tabular-nums">₹{totalCharges.toFixed(2)}</span>
          </div>
          {/* Rows */}
          <div>
            {myCharges.map((c, i) => (
              <div key={c._id} className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: i < myCharges.length - 1 ? '1px solid rgba(245,158,11,0.08)' : 'none' }}>
                <div className="min-w-0 flex-1">
                  <p className="text-white text-sm font-medium truncate">{c.reason}</p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    {new Date(c.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <span className="text-amber-400 font-bold text-sm ml-4 flex-shrink-0 tabular-nums">₹{c.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Personal Meal Summary (current month only) ── */}
      {isCurrentMonth && (
        <div className="rounded-2xl p-4" style={{
          background: 'rgba(255,255,255,0.03)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.10)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)',
        }}>
          {/* Section label */}
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.07)' }} />
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2">My Meal Summary</p>
            <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.07)' }} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              {
                icon: UtensilsCrossed,
                label: 'My Meals',
                value: totalMeals,
                sub: `Lunch: ${lunch}  ·  Dinner: ${dinner}`,
                accent: '#4ade80',
                bg: 'rgba(74,222,128,0.08)',
                border: 'rgba(74,222,128,0.15)',
              },
              {
                icon: TrendingUp,
                label: 'Per Meal Rate',
                value: `₹${mealRate.toFixed(2)}`,
                sub: 'Current rate',
                accent: '#a78bfa',
                bg: 'rgba(167,139,250,0.08)',
                border: 'rgba(167,139,250,0.15)',
              },
              {
                icon: IndianRupee,
                label: 'My Bill',
                value: `₹${(estimatedBill + masiSalary + myOther + myGasCharge + myRiceCharge).toFixed(2)}`,
                sub: billSubs || 'Meal charges only',
                accent: '#fbbf24',
                bg: 'rgba(251,191,36,0.08)',
                border: 'rgba(251,191,36,0.15)',
              },
              {
                icon: Wallet,
                label: due > 0 ? 'I Owe' : 'My Credit',
                value: `₹${Math.abs(due).toFixed(2)}`,
                sub: `Advance paid: ₹${advance.toFixed(2)}`,
                accent: due > 0 ? '#f87171' : '#4ade80',
                bg: due > 0 ? 'rgba(248,113,113,0.08)' : 'rgba(74,222,128,0.08)',
                border: due > 0 ? 'rgba(248,113,113,0.15)' : 'rgba(74,222,128,0.15)',
              },
            ].map(({ icon: Icon, value, label, sub, accent, bg, border }) => (
              <div key={label} className="rounded-xl p-3.5 flex flex-col gap-2"
                style={{
                  background: bg,
                  border: `1px solid ${border}`,
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.07)',
                }}>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <Icon size={13} style={{ color: accent }} />
                  </div>
                  <p className="text-slate-400 text-xs font-medium leading-tight">{label}</p>
                </div>
                <p className="text-lg font-bold leading-none tabular-nums" style={{ color: accent }}>{value}</p>
                {sub && <p className="text-slate-500 text-[10px] leading-snug">{sub}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Member Meal Count Bar Chart (current month only) ── */}
      {isCurrentMonth && chartData.some(m => m.meals > 0) && (
        <div className="rounded-2xl overflow-hidden" style={{
          background: 'rgba(255,255,255,0.03)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.10)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)',
        }}>
          {/* Chart header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.25)' }}>
                  <UtensilsCrossed size={13} className="text-green-400" />
                </div>
                <p className="text-sm font-bold text-white">Member Meal Count</p>
              </div>
              <p className="text-slate-500 text-xs mt-0.5 pl-9">{selectedLabel}</p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="flex items-center gap-1 text-[10px] font-semibold text-green-300">
                <span className="w-2 h-2 rounded-sm inline-block bg-green-400" /> Lunch
              </span>
              <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-300">
                <span className="w-2 h-2 rounded-sm inline-block" style={{ background: '#34d399' }} /> Dinner
              </span>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                <span className="text-[10px] font-semibold text-green-400">{chartData.reduce((s,m)=>s+m.meals,0)} meals</span>
              </div>
            </div>
          </div>

          {/* Scrollable chart */}
          <div className="px-2 pb-3" style={{ overflowX: 'auto', overflowY: 'hidden' }}>
            <div style={{ minWidth: Math.max(chartData.length * 72, 300) + 'px', height: '240px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 24, right: 16, left: -8, bottom: 52 }} barCategoryGap="30%" barGap={3}>
                  <defs>
                    <linearGradient id="mem-lunch" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"  stopColor="#22c55e" stopOpacity={1} />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity={0.55} />
                    </linearGradient>
                    <linearGradient id="mem-dinner" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"  stopColor="#34d399" stopOpacity={1} />
                      <stop offset="100%" stopColor="#34d399" stopOpacity={0.55} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                    tickLine={false}
                    interval={0}
                    angle={-38}
                    textAnchor="end"
                    height={56}
                  />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                    width={26}
                    tickFormatter={v => v === 0 ? '' : v}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(8,14,28,0.96)',
                      border: '1px solid rgba(34,197,94,0.30)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                      padding: '8px 14px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                    }}
                    cursor={{ fill: 'rgba(255,255,255,0.04)', radius: 6 }}
                    formatter={(v, name) => [
                      <span style={{ color: name === 'lunch' ? '#22c55e' : '#34d399', fontWeight: 700 }}>{v} meals</span>,
                      name === 'lunch' ? '☀️ Lunch' : '🌙 Dinner'
                    ]}
                  />
                  <Bar dataKey="lunch"  name="lunch"  radius={[6,6,2,2]} maxBarSize={28} fill="url(#mem-lunch)"
                    label={{ position: 'top', fill: '#86efac', fontSize: 10, fontWeight: 700, formatter: v => v > 0 ? v : '' }} />
                  <Bar dataKey="dinner" name="dinner" radius={[6,6,2,2]} maxBarSize={28} fill="url(#mem-dinner)"
                    label={{ position: 'top', fill: '#6ee7b7', fontSize: 10, fontWeight: 700, formatter: v => v > 0 ? v : '' }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
