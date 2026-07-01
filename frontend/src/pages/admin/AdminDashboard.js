import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Unlock, ChevronDown, Calendar, Sparkles, Activity, UtensilsCrossed } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar } from 'recharts';
import api from '../../api';
import DashboardShared from '../../components/DashboardShared';
import PageLoader from '../../components/PageLoader';

const MONTHS      = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
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

const glass = {
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(32px)',
  WebkitBackdropFilter: 'blur(32px)',
  border: '1px solid rgba(255,255,255,0.10)',
  boxShadow: '0 8px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)',
};

const tooltipStyle = {
  background: 'rgba(8,14,28,0.97)',
  border: '1px solid rgba(20,184,166,0.20)',
  borderRadius: '12px',
  color: '#fff',
};

export default function AdminDashboard() {
  const now = new Date();
  const curMonth = now.getMonth() + 1;
  const curYear  = now.getFullYear();

  const [data,          setData]          = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(curMonth);
  const [selectedYear,  setSelectedYear]  = useState(curYear);
  const [monthData,     setMonthData]     = useState(null);
  const [allSummaries,  setAllSummaries]  = useState([]);
  const [dropdownOpen,  setDropdownOpen]  = useState(false);
  const [members,       setMembers]       = useState([]);
  const [meals,         setMeals]         = useState([]);
  const dropRef  = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const h = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropdownOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => {
    api.get('/admin/dashboard').then(r => setData(r.data));
    api.get('/summary/list').then(r => setAllSummaries(r.data)).catch(() => {});
    api.get('/admin/members').then(r => setMembers(r.data.filter(m => m.isActive))).catch(() => {});
  }, []);

  useEffect(() => {
    api.get(`/meals/${selectedMonth}/${selectedYear}`).then(r => setMeals(r.data)).catch(() => setMeals([]));
  }, [selectedMonth, selectedYear]);

  const isCurrentMonth = selectedMonth === curMonth && selectedYear === curYear;

  useEffect(() => {
    if (isCurrentMonth) { setMonthData(null); return; }
    api.get(`/admin/month-data/${selectedMonth}/${selectedYear}`)
      .then(r => setMonthData(r.data)).catch(() => setMonthData(null));
  }, [selectedMonth, selectedYear, isCurrentMonth]);

  if (!data) return <PageLoader />;

  const { totalMembers, currentSummary, currentManager, allAssignments, totalCollected, individualCosts } = data;

  const activeSummary         = isCurrentMonth ? currentSummary    : monthData?.summary;
  const activeTotalCollected  = isCurrentMonth ? totalCollected     : (monthData?.totalCollected ?? 0);
  const activeIndividualCosts = isCurrentMonth ? individualCosts    : (monthData?.individualCosts ?? []);

  const summaryMap = {};
  allSummaries.forEach(s => { summaryMap[`${s.year}-${s.month}`] = s; });
  const monthOptions = buildMonthRange().map(({ month, year }) => {
    const s = summaryMap[`${year}-${month}`];
    return { month, year, isClosed: s?.isClosed ?? false, isCurrent: month === curMonth && year === curYear, hasData: !!s };
  });

  const selectedLabel = `${MONTHS_FULL[selectedMonth - 1]} ${selectedYear}`;

  const rn = (name) => { const m = name?.match(/^\w+\s*\((.+)\)$/); return m ? m[1] : (name || ''); };
  const memberMealCounts = members.map(m => {
    const mm = meals.filter(ml => ml.memberId?._id === m._id && !ml.isOff);
    const lunch  = mm.filter(ml => ml.lunch).length;
    const dinner = mm.filter(ml => ml.dinner).length;
    return { name: rn(m.name).split(' ')[0], lunch, dinner, meals: lunch + dinner };
  });

  const chartData = [...allSummaries].reverse().map(s => ({
    name: `${MONTHS[s.month - 1]} '${String(s.year).slice(2)}`,
    expense: s.grandTotal,
    rate: s.mealRate,
  }));

  const groceryTotal = activeSummary?.groceryTotal || 0;
  const otherPaid    = activeSummary?.otherPaidTotal || activeSummary?.otherTotal || 0;
  const otherDue     = activeSummary?.otherDueTotal  || 0;
  const pieData = [
    { name: 'Grocery',    value: groceryTotal, color: '#14b8a6' },
    { name: 'Other Paid', value: otherPaid,    color: '#f97316' },
    { name: 'Other Due',  value: otherDue,     color: '#f43f5e' },
  ].filter(p => p.value > 0);

  return (
    <div className="space-y-6 relative">
      {/* ── Background Orbs ── */}
      <div aria-hidden="true" style={{ pointerEvents: 'none', position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '45vw', height: '45vw', maxWidth: 520, maxHeight: 520, background: 'radial-gradient(circle, rgba(20,184,166,0.09) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', bottom: '5%', right: '-8%', width: '40vw', height: '40vw', maxWidth: 480, maxHeight: 480, background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(48px)' }} />
        <div style={{ position: 'absolute', top: '40%', left: '35%', width: '30vw', height: '30vw', maxWidth: 360, maxHeight: 360, background: 'radial-gradient(circle, rgba(45,212,191,0.05) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(60px)' }} />
      </div>

      {/* ── Header ── */}
      <div className="relative" ref={dropRef}>
        <div className="flex items-start justify-between gap-3 rounded-2xl p-3 px-4" style={glass}>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Sparkles size={15} style={{ color: '#2dd4bf' }} className="flex-shrink-0" />
              <h1 style={{
                fontFamily: "'Dancing Script', cursive",
                fontSize: 'clamp(1.3rem,5vw,1.8rem)', fontWeight: 700,
                background: 'linear-gradient(135deg,#ffffff 0%,#99f6e4 40%,#2dd4bf 75%,#0d9488 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                lineHeight: 1.2,
              }}>Admin Dashboard</h1>
            </div>
            <p className="text-slate-500 text-[10px] mt-0.5 pl-5">Viewing · <span style={{ color: '#5eead4' }}>{selectedLabel}</span></p>
          </div>
          <button
            onClick={() => setDropdownOpen(o => !o)}
            className="flex items-center gap-2 text-xs font-semibold text-white flex-shrink-0"
            style={{
              background: 'rgba(20,184,166,0.12)',
              border: '1px solid rgba(20,184,166,0.30)',
              borderRadius: '12px', padding: '8px 10px',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <Calendar size={13} style={{ color: '#2dd4bf' }} />
            <span>{selectedLabel}</span>
            <ChevronDown size={12} className={`text-slate-400 ml-1 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-2 z-[9999] rounded-2xl overflow-hidden" style={{
            minWidth: '220px',
            background: 'rgba(6,10,22,0.98)',
            backdropFilter: 'blur(48px)', WebkitBackdropFilter: 'blur(48px)',
            border: '1px solid rgba(20,184,166,0.25)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.85)',
          }}>
            <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(20,184,166,0.08)' }}>
              <Calendar size={12} style={{ color: '#2dd4bf' }} />
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#2dd4bf' }}>Select Month</p>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: '260px', scrollbarWidth: 'thin' }}>
              {monthOptions.map(o => {
                const isSel = o.month === selectedMonth && o.year === selectedYear;
                return (
                  <button
                    key={`${o.month}-${o.year}`}
                    onClick={() => { setSelectedMonth(o.month); setSelectedYear(o.year); setDropdownOpen(false); }}
                    className="w-full text-left flex items-center justify-between"
                    style={{
                      padding: '10px 14px',
                      background: isSel ? 'rgba(20,184,166,0.12)' : 'transparent',
                      borderLeft: isSel ? '2px solid #14b8a6' : '2px solid transparent',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: o.hasData ? (o.isClosed ? '#f87171' : '#34d399') : '#334155' }} />
                      <span className="text-sm font-medium" style={{ color: isSel ? '#2dd4bf' : '#cbd5e1' }}>
                        {MONTHS_FULL[o.month - 1].slice(0,3)} {o.year}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                      {o.isCurrent && <span style={{ fontSize: '9px', background: 'rgba(20,184,166,0.22)', color: '#2dd4bf', border: '1px solid rgba(20,184,166,0.40)', padding: '2px 6px', borderRadius: '999px', fontWeight: 700 }}>LIVE</span>}
                      {o.hasData && (o.isClosed
                        ? <span style={{ fontSize: '9px', background: 'rgba(248,113,113,0.12)', color: '#fca5a5', border: '1px solid rgba(248,113,113,0.25)', padding: '2px 6px', borderRadius: '999px' }}>Closed</span>
                        : <span style={{ fontSize: '9px', background: 'rgba(52,211,153,0.12)', color: '#86efac', border: '1px solid rgba(52,211,153,0.25)', padding: '2px 6px', borderRadius: '999px' }}>Open</span>
                      )}
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

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Members', value: totalMembers,                                         emoji: '👥', accent: 'rgba(20,184,166,0.10)',  border: 'rgba(20,184,166,0.20)'  },
          { label: 'Meal Rate',     value: `₹${activeSummary?.mealRate?.toFixed(2) || '0.00'}`, emoji: '📊', accent: 'rgba(99,102,241,0.10)',  border: 'rgba(99,102,241,0.20)'  },
          { label: 'Manager',       value: currentManager?.managerId?.name || 'None',            emoji: '👑', accent: 'rgba(249,115,22,0.10)',  border: 'rgba(249,115,22,0.20)'  },
        ].map(({ label, value, emoji, accent, border }) => (
          <div key={label} className="rounded-2xl overflow-hidden"
            style={{ background: accent, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: `1px solid ${border}`, boxShadow: '0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)' }}>
            <div className="px-3 pt-3 pb-2.5">
              <div className="text-2xl mb-2 leading-none">{emoji}</div>
              <p className="text-base font-bold text-white leading-none tabular-nums truncate">{value}</p>
              <p className="text-[10px] text-slate-400 mt-1.5 leading-tight font-medium">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Shared Dashboard ── */}
      <DashboardShared
        summary={activeSummary}
        totalCollected={activeTotalCollected}
        mealRate={activeSummary?.mealRate}
        totalAllMeals={activeSummary?.totalMeals}
        individualCosts={activeIndividualCosts}
        canEditGas={isCurrentMonth}
        role="admin"
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
      />

      {/* ── Member Meal Bar Chart ── */}
      {memberMealCounts.some(m => m.meals > 0) && (
        <div className="rounded-2xl overflow-hidden" style={glass}>
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(45,212,191,0.15)', border: '1px solid rgba(45,212,191,0.25)' }}>
                  <UtensilsCrossed size={13} style={{ color: '#2dd4bf' }} />
                </div>
                <p className="text-sm font-bold text-white">Member Meal Count</p>
              </div>
              <p className="text-slate-500 text-xs mt-0.5 pl-9">{selectedLabel}</p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: '#2dd4bf' }}>
                <span className="w-2 h-2 rounded-sm inline-block" style={{ background: '#2dd4bf' }} /> Lunch
              </span>
              <span className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: '#34d399' }}>
                <span className="w-2 h-2 rounded-sm inline-block" style={{ background: '#34d399' }} /> Dinner
              </span>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                style={{ background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.18)' }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#2dd4bf' }} />
                <span className="text-[10px] font-semibold" style={{ color: '#2dd4bf' }}>{memberMealCounts.reduce((s,m)=>s+m.meals,0)} meals</span>
              </div>
            </div>
          </div>
          <div className="px-2 pb-3" style={{ overflowX: 'auto', overflowY: 'hidden' }}>
            <div style={{ minWidth: Math.max(memberMealCounts.length * 72, 300) + 'px', height: '240px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={memberMealCounts} margin={{ top: 24, right: 16, left: -8, bottom: 52 }} barCategoryGap="30%" barGap={3}>
                  <defs>
                    <linearGradient id="adm-lunch" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"  stopColor="#2dd4bf" stopOpacity={1} />
                      <stop offset="100%" stopColor="#2dd4bf" stopOpacity={0.5} />
                    </linearGradient>
                    <linearGradient id="adm-dinner" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"  stopColor="#34d399" stopOpacity={1} />
                      <stop offset="100%" stopColor="#34d399" stopOpacity={0.5} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickLine={false}
                    interval={0} angle={-38} textAnchor="end" height={56} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false}
                    allowDecimals={false} width={26} tickFormatter={v => v === 0 ? '' : v} />
                  <Tooltip
                    contentStyle={{ background: 'rgba(8,14,28,0.96)', border: '1px solid rgba(45,212,191,0.30)', borderRadius: '12px', color: '#fff', fontSize: '12px', padding: '8px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}
                    cursor={{ fill: 'rgba(255,255,255,0.04)', radius: 6 }}
                    formatter={(v, name) => [
                      <span style={{ color: name === 'lunch' ? '#2dd4bf' : '#34d399', fontWeight: 700 }}>{v} meals</span>,
                      name === 'lunch' ? '☀️ Lunch' : '🌙 Dinner'
                    ]}
                  />
                  <Bar dataKey="lunch"  name="lunch"  radius={[6,6,2,2]} maxBarSize={28} fill="url(#adm-lunch)"
                    label={{ position: 'top', fill: '#99f6e4', fontSize: 10, fontWeight: 700, formatter: v => v > 0 ? v : '' }} />
                  <Bar dataKey="dinner" name="dinner" radius={[6,6,2,2]} maxBarSize={28} fill="url(#adm-dinner)"
                    label={{ position: 'top', fill: '#6ee7b7', fontSize: 10, fontWeight: 700, formatter: v => v > 0 ? v : '' }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── Charts ── */}
      <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl p-5" style={glass}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Activity size={15} style={{ color: '#2dd4bf' }} /> Expense Trend
              </h3>
              <p className="text-slate-500 text-xs mt-0.5">All months overview</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: '#14b8a6', boxShadow: '0 0 6px #14b8a6' }} />Expense</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: '#f97316', boxShadow: '0 0 6px #f97316' }} />Rate</span>
            </div>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={chartData} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"  stopColor="#14b8a6" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"  stopColor="#f97316" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#f97316" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} dy={8} />
                <YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} width={50}
                  tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v} />
                <Tooltip
                  contentStyle={{ background: 'rgba(6,10,22,0.97)', border: '1px solid rgba(20,184,166,0.25)', borderRadius: '14px', color: '#fff', fontSize: '12px', padding: '10px 14px', boxShadow: '0 12px 32px rgba(0,0,0,0.6)' }}
                  cursor={{ stroke: 'rgba(255,255,255,0.06)', strokeWidth: 1, strokeDasharray: '4 4' }}
                  labelStyle={{ color: '#94a3b8', fontSize: 11, marginBottom: 4 }}
                  formatter={(v, name) => [`₹${v.toFixed(2)}`, name]}
                />
                <Area type="monotone" dataKey="expense" stroke="#14b8a6" strokeWidth={3}
                  fill="url(#gExpense)"
                  dot={{ fill: '#14b8a6', r: 4, strokeWidth: 2, stroke: 'rgba(20,184,166,0.35)' }}
                  activeDot={{ r: 6, fill: '#14b8a6', stroke: 'rgba(20,184,166,0.5)', strokeWidth: 3 }}
                  name="Total Expense" />
                <Area type="monotone" dataKey="rate" stroke="#f97316" strokeWidth={3}
                  fill="url(#gRate)"
                  dot={{ fill: '#f97316', r: 4, strokeWidth: 2, stroke: 'rgba(249,115,22,0.35)' }}
                  activeDot={{ r: 6, fill: '#f97316', stroke: 'rgba(249,115,22,0.5)', strokeWidth: 3 }}
                  name="Meal Rate" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[240px] flex flex-col items-center justify-center gap-2 text-slate-600 text-sm">
              <Activity size={28} className="text-slate-700" />
              No expense data yet
            </div>
          )}
        </div>

        <div className="rounded-2xl p-5" style={glass}>
          <h3 className="font-semibold text-white mb-0.5">{MONTHS[selectedMonth - 1]} Breakdown</h3>
          <p className="text-slate-500 text-xs mb-3">Grocery · Other Paid · Other Due</p>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={175}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={4} dataKey="value" strokeWidth={0}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={v => `₹${Number(v).toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2.5 mt-3">
                {pieData.map(({ name, value, color }) => {
                  const total = pieData.reduce((s, p) => s + p.value, 0);
                  const pct   = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                  return (
                    <div key={name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="flex items-center gap-1.5 text-xs text-slate-400">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                          {name}
                        </span>
                        <span className="text-xs font-bold text-white">₹{value.toFixed(0)} <span className="text-slate-500 font-normal">({pct}%)</span></span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color, transition: 'width 0.7s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="h-[210px] flex items-center justify-center text-slate-600 text-sm">No data yet</div>
          )}
        </div>
      </div>

      {/* ── All Months Cards ── */}
      <div className="relative rounded-2xl overflow-hidden" style={glass}>
        <div className="px-4 pt-4 pb-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div>
            <h3 className="font-semibold text-white text-sm">All Months</h3>
            <p className="text-slate-500 text-[11px] mt-0.5">{allSummaries.length} months recorded</p>
          </div>
          <button onClick={() => navigate('/admin/assignments')} className="btn-primary text-xs px-3 py-1.5">Assign Manager</button>
        </div>
        {allSummaries.length === 0 ? (
          <p className="py-10 text-center text-slate-600 text-sm">No months recorded yet</p>
        ) : (
          <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {allSummaries.map(s => {
              const mgr   = allAssignments.find(a => a.month === s.month && a.year === s.year);
              const isSel = s.month === selectedMonth && s.year === selectedYear;
              return (
                <button
                  key={s._id}
                  onClick={() => { setSelectedMonth(s.month); setSelectedYear(s.year); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="text-left rounded-xl p-3 transition-all w-full"
                  style={{
                    background: isSel ? 'rgba(20,184,166,0.12)' : 'rgba(255,255,255,0.03)',
                    border: isSel ? '1px solid rgba(20,184,166,0.35)' : '1px solid rgba(255,255,255,0.07)',
                    boxShadow: isSel ? '0 0 0 1px rgba(20,184,166,0.15)' : 'none',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  {/* Top row: month + status badge */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      {isSel && <span className="w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0" style={{ background: '#2dd4bf' }} />}
                      <span className="text-sm font-bold" style={{ color: isSel ? '#2dd4bf' : '#e2e8f0' }}>
                        {MONTHS_FULL[s.month - 1].slice(0,3)} {s.year}
                      </span>
                    </div>
                    {s.isClosed
                      ? <span className="badge-closed inline-flex items-center gap-1 text-[10px]"><Lock size={8} />Closed</span>
                      : <span className="badge-open  inline-flex items-center gap-1 text-[10px]"><Unlock size={8} />Open</span>
                    }
                  </div>
                  {/* Stats row */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-500 mb-0.5">Expense</p>
                      <p className="text-sm font-bold text-white tabular-nums">₹{s.grandTotal.toFixed(0)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-slate-500 mb-0.5">Rate</p>
                      <p className="text-sm font-bold tabular-nums" style={{ color: '#fbbf24' }}>₹{s.mealRate.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-500 mb-0.5">Manager</p>
                      <p className="text-[11px] font-semibold text-slate-300 truncate max-w-[80px]">{mgr?.managerId?.name || '—'}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
