import React, { useEffect, useState, useRef } from 'react';
import { UtensilsCrossed, IndianRupee, TrendingUp, Wallet, Calendar, ChevronDown, Sparkles } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../api';
import DashboardShared from '../../components/DashboardShared';
import useAuthStore from '../../store/authStore';

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

const glass = {
  background: 'rgba(255,255,255,0.03)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(255,255,255,0.08)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
};

export default function MemberDashboard() {
  const { user } = useAuthStore();
  const now = new Date();
  const curMonth = now.getMonth() + 1;
  const curYear = now.getFullYear();

  const [data, setData] = useState(null);
  const [allSummaries, setAllSummaries] = useState([]);
  const [monthData, setMonthData] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(curMonth);
  const [selectedYear, setSelectedYear] = useState(curYear);
  const dropRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropdownOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    api.get('/member/dashboard').then(r => setData(r.data));
    api.get('/summary/list').then(r => setAllSummaries(r.data)).catch(() => {});
  }, []);

  const isCurrentMonth = selectedMonth === curMonth && selectedYear === curYear;

  useEffect(() => {
    if (isCurrentMonth) { setMonthData(null); return; }
    api.get(`/member/month-data/${selectedMonth}/${selectedYear}`)
      .then(r => setMonthData(r.data))
      .catch(() => setMonthData(null));
  }, [selectedMonth, selectedYear, isCurrentMonth]);

  if (!data) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-green-500/30 border-t-green-400 rounded-full animate-spin" />
        <span className="text-slate-400 text-sm">Loading…</span>
      </div>
    </div>
  );

  const { lunch, dinner, mealRate, estimatedBill, advance, totalCollected, memberMealCounts, summary, individualCosts } = data;
  const totalMeals = lunch + dinner;
  // find logged-in user's masiSalary from individualCosts
  const myRow = individualCosts?.find(c => c._id === user?._id || c._id?.toString() === user?._id?.toString());
  const masiSalary = myRow?.masiSalary || 0;
  const due = estimatedBill + masiSalary - advance;

  const activeSummary = isCurrentMonth ? summary : monthData?.summary;
  const activeTotalCollected = isCurrentMonth ? totalCollected : (monthData?.totalCollected ?? 0);
  const activeIndividualCosts = isCurrentMonth ? individualCosts : (monthData?.individualCosts ?? []);
  const activeMealRate = activeSummary?.mealRate ?? (isCurrentMonth ? mealRate : 0);

  const selectedLabel = `${MONTHS_FULL[selectedMonth - 1]} ${selectedYear}`;

  const summaryMap = {};
  allSummaries.forEach(s => { summaryMap[`${s.year}-${s.month}`] = s; });
  const monthOptions = buildMonthRange().map(({ month, year }) => {
    const s = summaryMap[`${year}-${month}`];
    return { month, year, isClosed: s?.isClosed ?? false, isCurrent: month === curMonth && year === curYear, hasData: !!s };
  });

  return (
    <div className="space-y-6">

      {/* ── Header + Dropdown ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-green-400" />
            <h1 style={{
              fontFamily: "'Dancing Script', cursive", fontSize: '2rem', fontWeight: 700,
              background: 'linear-gradient(135deg,#ffffff 0%,#bbf7d0 40%,#34d399 75%,#059669 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>My Dashboard</h1>
          </div>
          <p className="text-slate-500 text-xs mt-0.5 pl-6">Viewing · {selectedLabel}</p>
        </div>

        <div className="relative" ref={dropRef}>
          <button
            onClick={() => setDropdownOpen(o => !o)}
            className="flex items-center gap-2.5 text-sm font-semibold text-white"
            style={{
              background: 'rgba(34,197,94,0.08)',
              backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(34,197,94,0.28)',
              borderRadius: '14px', padding: '10px 16px', minWidth: '215px',
              justifyContent: 'space-between',
              boxShadow: '0 4px 20px rgba(34,197,94,0.10)',
            }}
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.18)' }}>
                <Calendar size={14} className="text-green-400" />
              </div>
              <span>{selectedLabel}</span>
            </div>
            <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 z-50 rounded-2xl overflow-hidden" style={{
              minWidth: '240px',
              background: 'rgba(8,14,28,0.97)',
              backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)',
              border: '1px solid rgba(34,197,94,0.18)',
              boxShadow: '0 24px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(34,197,94,0.06)',
            }}>
              <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(34,197,94,0.07)' }}>
                <Calendar size={13} className="text-green-400" />
                <p className="text-xs font-bold text-green-300 uppercase tracking-widest">Select Month</p>
              </div>
              <div className="max-h-72 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                {monthOptions.map(o => {
                  const isSel = o.month === selectedMonth && o.year === selectedYear;
                  return (
                    <button
                      key={`${o.month}-${o.year}`}
                      onClick={() => { setSelectedMonth(o.month); setSelectedYear(o.year); setDropdownOpen(false); }}
                      className="w-full text-left flex items-center justify-between transition-all duration-150"
                      style={{
                        padding: '10px 16px',
                        background: isSel ? 'rgba(34,197,94,0.14)' : 'transparent',
                        borderLeft: isSel ? '2px solid #22c55e' : '2px solid transparent',
                      }}
                      onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                      onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: o.hasData ? (o.isClosed ? '#f87171' : '#34d399') : '#334155' }} />
                        <span className="text-sm font-medium" style={{ color: isSel ? '#86efac' : '#e2e8f0' }}>
                          {MONTHS_FULL[o.month - 1]} {o.year}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                        {o.isCurrent && <span style={{ fontSize: '9px', background: 'rgba(34,197,94,0.22)', color: '#86efac', border: '1px solid rgba(34,197,94,0.40)', padding: '2px 6px', borderRadius: '999px', fontWeight: 700 }}>LIVE</span>}
                        {o.hasData && (o.isClosed
                          ? <span style={{ fontSize: '9px', background: 'rgba(248,113,113,0.12)', color: '#fca5a5', border: '1px solid rgba(248,113,113,0.25)', padding: '2px 6px', borderRadius: '999px' }}>Closed</span>
                          : <span style={{ fontSize: '9px', background: 'rgba(52,211,153,0.12)', color: '#6ee7b7', border: '1px solid rgba(52,211,153,0.25)', padding: '2px 6px', borderRadius: '999px' }}>Open</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="px-4 py-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <p className="text-[10px] text-slate-600">● Data exists &nbsp; ○ No data yet</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Shared Dashboard ── */}
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

      {/* ── Personal Stats (current month only) ── */}
      {isCurrentMonth && (
        <div className="rounded-2xl p-5" style={glass}>
          <h3 className="font-semibold text-white mb-4">My Meal Summary — {selectedLabel}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: UtensilsCrossed, value: totalMeals,   label: 'My Meals',  sub: `L:${lunch}  D:${dinner}`,
                color: due > 0 ? '#f87171' : '#4ade80' },
              { icon: TrendingUp,      value: `₹${mealRate.toFixed(2)}`,       label: 'Per Meal' },
              { icon: IndianRupee,     value: `₹${(estimatedBill + masiSalary).toFixed(2)}`,  label: 'My Bill', sub: masiSalary > 0 ? `Masi: ₹${masiSalary.toFixed(2)}` : undefined },
              { icon: Wallet,
                value: due > 0 ? `-₹${due.toFixed(2)}` : `+₹${Math.abs(due).toFixed(2)}`,
                label: due > 0 ? 'I Owe' : 'My Credit',
                sub: `Paid: ₹${advance.toFixed(2)}`,
                color: due > 0 ? '#f87171' : '#4ade80' },
            ].map(({ icon: Icon, value, label, sub, color }) => (
              <div key={label} className="rounded-xl p-4 text-center" style={glass}>
                <Icon size={18} className="mx-auto mb-2 text-slate-400" />
                <p className="text-xl font-bold text-white" style={color ? { color } : {}}>{value}</p>
                <p className="text-slate-400 text-xs mt-1">{label}</p>
                {sub && <p className="text-slate-600 text-xs mt-0.5">{sub}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Bar Chart (current month only) ── */}
      {isCurrentMonth && memberMealCounts?.some(m => m.meals > 0) && (
        <div className="rounded-2xl p-5" style={glass}>
          <h3 className="font-semibold text-white mb-1">Member Meal Count</h3>
          <p className="text-slate-500 text-xs mb-4">{selectedLabel}</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={memberMealCounts}>
              <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'rgba(8,14,28,0.97)', border: '1px solid rgba(34,197,94,0.20)', borderRadius: '12px', color: '#fff' }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="meals" fill="#22c55e" radius={[5,5,0,0]} name="Total Meals" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
