import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, TrendingUp, Crown, Lock, Unlock, ChevronDown, Calendar, Sparkles, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../../api';
import DashboardShared from '../../components/DashboardShared';

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
  background: 'rgba(255,255,255,0.03)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(255,255,255,0.07)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
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
  }, []);

  const isCurrentMonth = selectedMonth === curMonth && selectedYear === curYear;

  useEffect(() => {
    if (isCurrentMonth) { setMonthData(null); return; }
    api.get(`/admin/month-data/${selectedMonth}/${selectedYear}`)
      .then(r => setMonthData(r.data)).catch(() => setMonthData(null));
  }, [selectedMonth, selectedYear, isCurrentMonth]);

  if (!data) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-teal-500/30 border-t-teal-400 rounded-full animate-spin" />
        <span className="text-slate-400 text-sm">Loading dashboard…</span>
      </div>
    </div>
  );

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

  const chartData = [...allSummaries].reverse().map(s => ({
    name: `${MONTHS[s.month - 1]} '${String(s.year).slice(2)}`,
    expense: s.grandTotal,
    rate: s.mealRate,
  }));

  const pieData = activeSummary
    ? [{ name: 'Grocery', value: activeSummary.groceryTotal }, { name: 'Other', value: activeSummary.otherTotal }].filter(p => p.value > 0)
    : [];

  const statCards = [
    { label: 'Total Members',   value: totalMembers,                                           icon: Users },
    { label: 'Meal Rate',       value: `₹${activeSummary?.mealRate?.toFixed(2) || '0.00'}`,   icon: TrendingUp },
    { label: 'Current Manager', value: currentManager?.managerId?.name || 'Unassigned',        icon: Crown, truncate: true },
  ];

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles size={18} style={{ color: '#2dd4bf' }} />
            <h1 style={{
              fontFamily: "'Dancing Script', cursive",
              fontSize: '2rem', fontWeight: 700,
              background: 'linear-gradient(135deg,#ffffff 0%,#99f6e4 40%,#2dd4bf 75%,#0d9488 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>Admin Dashboard</h1>
          </div>
          <p className="text-slate-500 text-xs mt-0.5 pl-6">Viewing · {selectedLabel}</p>
        </div>

        {/* ── Month Dropdown ── */}
        <div className="relative" ref={dropRef}>
          <button
            onClick={() => setDropdownOpen(o => !o)}
            className="flex items-center gap-2.5 text-sm font-semibold text-white transition-all duration-200"
            style={{
              background: 'rgba(20,184,166,0.10)',
              backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(20,184,166,0.28)',
              borderRadius: '14px', padding: '10px 16px', minWidth: '215px',
              justifyContent: 'space-between',
              boxShadow: '0 4px 20px rgba(20,184,166,0.12)',
            }}
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(20,184,166,0.18)' }}>
                <Calendar size={14} style={{ color: '#2dd4bf' }} />
              </div>
              <span>{selectedLabel}</span>
            </div>
            <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 z-50 rounded-2xl overflow-hidden" style={{
              minWidth: '244px',
              background: 'rgba(8,14,28,0.97)',
              backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)',
              border: '1px solid rgba(20,184,166,0.20)',
              boxShadow: '0 24px 60px rgba(0,0,0,0.8)',
            }}>
              <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(20,184,166,0.07)' }}>
                <Calendar size={13} style={{ color: '#2dd4bf' }} />
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#2dd4bf' }}>Select Month</p>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {monthOptions.map(o => {
                  const isSel = o.month === selectedMonth && o.year === selectedYear;
                  return (
                    <button
                      key={`${o.month}-${o.year}`}
                      onClick={() => { setSelectedMonth(o.month); setSelectedYear(o.year); setDropdownOpen(false); }}
                      className="w-full text-left flex items-center justify-between transition-all duration-150"
                      style={{
                        padding: '10px 16px',
                        background: isSel ? 'rgba(20,184,166,0.12)' : 'transparent',
                        borderLeft: isSel ? '2px solid #14b8a6' : '2px solid transparent',
                      }}
                      onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                      onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ background: o.hasData ? (o.isClosed ? '#f87171' : '#34d399') : '#334155' }} />
                        <span className="text-sm font-medium" style={{ color: isSel ? '#2dd4bf' : '#e2e8f0' }}>
                          {MONTHS_FULL[o.month - 1]} {o.year}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                        {o.isCurrent && (
                          <span style={{ fontSize: '9px', background: 'rgba(20,184,166,0.20)', color: '#2dd4bf', border: '1px solid rgba(20,184,166,0.35)', padding: '2px 7px', borderRadius: '999px', fontWeight: 700 }}>LIVE</span>
                        )}
                        {o.hasData && (o.isClosed
                          ? <span style={{ fontSize: '9px', background: 'rgba(248,113,113,0.12)', color: '#f87171', border: '1px solid rgba(248,113,113,0.25)', padding: '2px 7px', borderRadius: '999px' }}>Closed</span>
                          : <span style={{ fontSize: '9px', background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.25)', padding: '2px 7px', borderRadius: '999px' }}>Open</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="px-4 py-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <p className="text-[10px] text-slate-600">● Has data &nbsp;○ No data yet</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map(({ label, value, icon: Icon, truncate }) => (
          <div key={label} className="rounded-2xl p-5" style={glass}>
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.09)' }}>
                <Icon size={18} className="text-slate-300" />
              </div>
            </div>
            <p className={`font-bold text-white mb-1 ${truncate ? 'text-base truncate' : 'text-2xl'}`}>{value}</p>
            <p className="text-xs text-slate-500 font-medium">{label}</p>
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

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl p-5" style={glass}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Activity size={15} style={{ color: '#2dd4bf' }} /> Expense Trend
              </h3>
              <p className="text-slate-500 text-xs mt-0.5">All months overview</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full inline-block bg-teal-400" />Expense</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full inline-block bg-orange-400" />Rate</span>
            </div>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#14b8a6" stopOpacity={0.30} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f97316" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} dy={6} />
                <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} width={48} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1 }}
                  formatter={(v, name) => [`₹${v.toFixed(2)}`, name]}
                />
                <Area type="monotone" dataKey="expense" stroke="#14b8a6" strokeWidth={2.5} fill="url(#gExpense)" dot={{ fill: '#14b8a6', r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: '#14b8a6' }} name="Total Expense" />
                <Area type="monotone" dataKey="rate"    stroke="#f97316" strokeWidth={2.5} fill="url(#gRate)"    dot={{ fill: '#f97316', r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: '#f97316' }} name="Meal Rate" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex flex-col items-center justify-center gap-2 text-slate-600 text-sm">
              <Activity size={28} className="text-slate-700" />
              No expense data yet
            </div>
          )}
        </div>

        <div className="rounded-2xl p-5" style={glass}>
          <h3 className="font-semibold text-white mb-1">{MONTHS[selectedMonth - 1]} Breakdown</h3>
          <p className="text-slate-500 text-xs mb-3">Grocery vs Other expenses</p>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="44%" innerRadius={52} outerRadius={78} paddingAngle={5} dataKey="value" strokeWidth={0}>
                  <Cell fill="#14b8a6" />
                  <Cell fill="#f97316" />
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={v => `₹${v.toFixed(2)}`} />
                <Legend formatter={v => <span className="text-slate-400 text-xs">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[210px] flex items-center justify-center text-slate-600 text-sm">No data yet</div>
          )}
        </div>
      </div>

      {/* ── All Months Table ── */}
      <div className="rounded-2xl overflow-hidden" style={glass}>
        <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <h3 className="font-semibold text-white">All Months</h3>
            <p className="text-slate-500 text-xs mt-0.5">{allSummaries.length} months recorded — click to view</p>
          </div>
          <button onClick={() => navigate('/admin/assignments')} className="btn-primary text-sm px-4 py-2">Assign Manager</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {['Month','Manager','Expense','Rate','Status'].map((h, i) => (
                  <th key={h} className={`py-3 px-4 text-slate-500 font-semibold text-xs uppercase tracking-wider ${i >= 2 ? 'text-right' : ''} ${i === 4 ? 'text-center' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allSummaries.map(s => {
                const mgr   = allAssignments.find(a => a.month === s.month && a.year === s.year);
                const isSel = s.month === selectedMonth && s.year === selectedYear;
                return (
                  <tr
                    key={s._id}
                    onClick={() => { setSelectedMonth(s.month); setSelectedYear(s.year); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="cursor-pointer transition-colors"
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      background: isSel ? 'rgba(20,184,166,0.07)' : 'transparent',
                      borderLeft: isSel ? '2px solid #14b8a6' : '2px solid transparent',
                    }}
                    onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; }}
                    onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td className="py-3 px-4 font-semibold" style={{ color: isSel ? '#2dd4bf' : '#f1f5f9' }}>
                      {isSel && <span className="inline-block w-1.5 h-1.5 rounded-full mr-2 mb-0.5 animate-pulse" style={{ background: '#2dd4bf' }} />}
                      {MONTHS_FULL[s.month - 1]} {s.year}
                    </td>
                    <td className="py-3 px-4 text-slate-400">{mgr?.managerId?.name || <span className="text-slate-600">—</span>}</td>
                    <td className="py-3 px-4 text-right text-white font-medium">₹{s.grandTotal.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-medium" style={{ color: '#f97316' }}>₹{s.mealRate.toFixed(2)}</td>
                    <td className="py-3 px-4 text-center">
                      {s.isClosed
                        ? <span className="badge-closed inline-flex items-center gap-1"><Lock size={9} />Closed</span>
                        : <span className="badge-open  inline-flex items-center gap-1"><Unlock size={9} />Open</span>
                      }
                    </td>
                  </tr>
                );
              })}
              {allSummaries.length === 0 && (
                <tr><td colSpan={5} className="py-12 text-center text-slate-600 text-sm">No months recorded yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
