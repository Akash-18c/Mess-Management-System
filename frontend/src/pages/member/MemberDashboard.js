import React, { useEffect, useState, useRef } from 'react';
import { UtensilsCrossed, IndianRupee, TrendingUp, Wallet, Calendar, ChevronDown, Sparkles } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api from '../../api';
import DashboardShared from '../../components/DashboardShared';
import useAuthStore from '../../store/authStore';

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
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(255,255,255,0.09)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)',
};

// Global loading screen — logo + spinner
function PageLoader() {
  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-5"
      style={{ background: '#0a0f1e' }}>
      <div className="relative flex items-center justify-center">
        <div className="w-16 h-16 rounded-full border-2 border-green-500/20 border-t-green-400 animate-spin" />
        <img src="/messy-logo.png" alt="logo"
          className="absolute w-9 h-9 object-contain"
          onError={e => { e.target.style.display = 'none'; }} />
      </div>
      <p className="text-slate-400 text-sm tracking-wide">Loading…</p>
    </div>
  );
}

const BAR_COLORS = ['#22c55e','#34d399','#4ade80','#86efac','#6ee7b7','#10b981','#059669'];

const CustomBarLabel = ({ x, y, width, value }) => {
  if (!value) return null;
  return (
    <text x={x + width / 2} y={y - 5} fill="#94a3b8" textAnchor="middle" fontSize={10} fontWeight={600}>
      {value}
    </text>
  );
};

export default function MemberDashboard() {
  const { user } = useAuthStore();
  const now = new Date();
  const curMonth = now.getMonth() + 1;
  const curYear  = now.getFullYear();

  const [data,          setData]          = useState(null);
  const [allSummaries,  setAllSummaries]  = useState([]);
  const [monthData,     setMonthData]     = useState(null);
  const [myCharges,     setMyCharges]     = useState([]);
  const [dropdownOpen,  setDropdownOpen]  = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(curMonth);
  const [selectedYear,  setSelectedYear]  = useState(curYear);
  const dropRef = useRef(null);

  useEffect(() => {
    const h = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropdownOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => {
    api.get('/member/dashboard').then(r => setData(r.data));
    api.get('/summary/list').then(r => setAllSummaries(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    api.get(`/expenses/charges/my/${selectedMonth}/${selectedYear}`).then(r => setMyCharges(r.data)).catch(() => setMyCharges([]));
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

  return (
    <div className="space-y-4 pb-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-green-400 flex-shrink-0" />
            <h1 style={{
              fontFamily: "'Dancing Script', cursive", fontSize: '1.75rem', fontWeight: 700,
              background: 'linear-gradient(135deg,#ffffff 0%,#bbf7d0 40%,#34d399 75%,#059669 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              lineHeight: 1.2,
            }}>My Dashboard</h1>
          </div>
          <p className="text-slate-500 text-xs mt-0.5 pl-6">Viewing · {selectedLabel}</p>
        </div>

        {/* Month Dropdown */}
        <div className="relative flex-shrink-0" ref={dropRef}>
          <button
            onTouchEnd={e => { e.preventDefault(); setDropdownOpen(o => !o); }}
            onClick={() => setDropdownOpen(o => !o)}
            className="flex items-center gap-2 text-sm font-semibold text-white"
            style={{
              background: 'rgba(34,197,94,0.08)',
              backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(34,197,94,0.25)',
              borderRadius: '14px', padding: '9px 14px',
              minWidth: '190px', maxWidth: '220px',
              justifyContent: 'space-between',
              boxShadow: '0 4px 16px rgba(34,197,94,0.08)',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(34,197,94,0.18)' }}>
                <Calendar size={12} className="text-green-400" />
              </div>
              <span className="truncate">{selectedLabel}</span>
            </div>
            <ChevronDown size={13} className={`text-slate-400 flex-shrink-0 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 z-50 rounded-2xl overflow-hidden"
              style={{
                minWidth: '220px', width: '220px',
                background: 'rgba(8,14,28,0.98)',
                backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)',
                border: '1px solid rgba(34,197,94,0.18)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.85)',
              }}>
              <div className="px-4 py-2.5 flex items-center gap-2"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(34,197,94,0.07)' }}>
                <Calendar size={12} className="text-green-400" />
                <p className="text-[10px] font-bold text-green-300 uppercase tracking-widest">Select Month</p>
              </div>
              <div className="max-h-64 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                {monthOptions.map(o => {
                  const isSel = o.month === selectedMonth && o.year === selectedYear;
                  return (
                    <button
                      key={`${o.month}-${o.year}`}
                      onTouchEnd={e => { e.preventDefault(); setSelectedMonth(o.month); setSelectedYear(o.year); setDropdownOpen(false); }}
                      onClick={() => { setSelectedMonth(o.month); setSelectedYear(o.year); setDropdownOpen(false); }}
                      className="w-full text-left flex items-center justify-between"
                      style={{
                        padding: '9px 14px',
                        background: isSel ? 'rgba(34,197,94,0.14)' : 'transparent',
                        borderLeft: isSel ? '2px solid #22c55e' : '2px solid transparent',
                        WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ background: o.hasData ? (o.isClosed ? '#f87171' : '#34d399') : '#334155' }} />
                        <span className="text-sm" style={{ color: isSel ? '#86efac' : '#e2e8f0' }}>
                          {MONTHS_FULL[o.month - 1].slice(0,3)} {o.year}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {o.isCurrent && (
                          <span style={{ fontSize: '9px', background: 'rgba(34,197,94,0.22)', color: '#86efac', border: '1px solid rgba(34,197,94,0.40)', padding: '1px 5px', borderRadius: '999px', fontWeight: 700 }}>LIVE</span>
                        )}
                        {o.hasData && o.isClosed && (
                          <span style={{ fontSize: '9px', background: 'rgba(248,113,113,0.12)', color: '#fca5a5', border: '1px solid rgba(248,113,113,0.25)', padding: '1px 5px', borderRadius: '999px' }}>Closed</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="px-4 py-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <p className="text-[9px] text-slate-600">🟢 Open &nbsp;🔴 Closed &nbsp;⚫ No data</p>
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

      {/* ── My Other Charges ── */}
      {myCharges.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={glass}>
          <div className="px-4 py-3 flex items-center justify-between"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(245,158,11,0.06)' }}>
            <p className="text-sm font-semibold text-white">My Other Charges</p>
            <span className="text-sm font-bold text-amber-400">₹{myCharges.reduce((s, c) => s + c.amount, 0).toFixed(0)}</span>
          </div>
          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            {myCharges.map(c => (
              <div key={c._id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-white text-sm">{c.reason}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{new Date(c.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                </div>
                <span className="text-amber-400 font-bold text-sm ml-3">₹{c.amount.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Personal Stats (current month only) ── */}
      {isCurrentMonth && (
        <div className="rounded-2xl p-4" style={glass}>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">My Meal Summary</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                icon: UtensilsCrossed, label: 'My Meals', color: due > 0 ? '#f87171' : '#4ade80',
                value: totalMeals, sub: `L: ${lunch}  ·  D: ${dinner}`,
              },
              {
                icon: TrendingUp, label: 'Per Meal',
                value: `₹${mealRate.toFixed(2)}`, sub: 'Current rate',
              },
              {
                icon: IndianRupee, label: 'My Bill',
                value: `₹${(estimatedBill + masiSalary + myOther + myGasCharge + myRiceCharge).toFixed(2)}`,
                sub: billSubs || 'Meal charges',
              },
              {
                icon: Wallet, label: due > 0 ? 'I Owe' : 'My Credit',
                value: due > 0 ? `₹${due.toFixed(2)}` : `₹${Math.abs(due).toFixed(2)}`,
                sub: `Paid: ₹${advance.toFixed(2)}`,
                color: due > 0 ? '#f87171' : '#4ade80',
              },
            ].map(({ icon: Icon, value, label, sub, color }) => (
              <div key={label} className="rounded-xl p-3.5" style={glass}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={14} className="text-slate-400 flex-shrink-0" />
                  <p className="text-slate-400 text-xs font-medium">{label}</p>
                </div>
                <p className="text-lg font-bold leading-tight" style={{ color: color || '#ffffff' }}>{value}</p>
                {sub && <p className="text-slate-600 text-[10px] mt-1 leading-tight">{sub}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Bar Chart (current month only) ── */}
      {isCurrentMonth && memberMealCounts?.some(m => m.meals > 0) && (
        <div className="rounded-2xl p-4" style={glass}>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Member Meal Count</p>
          <p className="text-slate-600 text-[10px] mb-4">{selectedLabel}</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={memberMealCounts} margin={{ top: 18, right: 8, left: -20, bottom: 8 }}
              barCategoryGap="30%">
              <XAxis
                dataKey="name"
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                axisLine={false} tickLine={false}
                interval={0}
              />
              <YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'rgba(8,14,28,0.97)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '10px', color: '#fff', fontSize: '12px' }}
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                formatter={v => [v, 'Meals']}
              />
              <Bar dataKey="meals" radius={[6, 6, 0, 0]} label={<CustomBarLabel />} maxBarSize={48}>
                {memberMealCounts.map((_, i) => (
                  <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
