import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, ChevronDown, Sparkles } from 'lucide-react';
import api from '../../api';
import DashboardShared from '../../components/DashboardShared';

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

const glass = {
  background: 'rgba(255,255,255,0.03)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(255,255,255,0.08)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
};

export default function ManagerDashboard() {
  const now = new Date();
  const curMonth = now.getMonth() + 1;
  const curYear = now.getFullYear();
  const today = now.toISOString().slice(0, 10);

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

  useEffect(() => {
    const handler = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropdownOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    api.get('/summary/list').then(r => setAllSummaries(r.data)).catch(() => {});
    api.get('/admin/members')
      .then(r => setMembers(r.data.filter(m => m.isActive)))
      .catch(() => api.get('/members').then(r => setMembers(r.data)).catch(() => {}));
  }, []);

  const load = useCallback(() => {
    api.get(`/summary/${selectedMonth}/${selectedYear}`).then(r => setSummary(r.data)).catch(() => setSummary(null));
    api.get(`/meals/${selectedMonth}/${selectedYear}`).then(r => setMeals(r.data)).catch(() => setMeals([]));

    if (isCurrentMonth) {
      api.get('/member/dashboard').then(r => {
        setTotalCollected(r.data.totalCollected || 0);
        setIndividualCosts(r.data.individualCosts || []);
      }).catch(() => {});
    } else {
      api.get(`/member/month-data/${selectedMonth}/${selectedYear}`).then(r => {
        setTotalCollected(r.data.totalCollected ?? 0);
        setIndividualCosts(r.data.individualCosts ?? []);
      }).catch(() => { setTotalCollected(0); setIndividualCosts([]); });
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
    <div className="space-y-6">

      {/* ── Header + Dropdown ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-amber-400" />
            <h1 style={{
              fontFamily: "'Dancing Script', cursive", fontSize: '2rem', fontWeight: 700,
              background: 'linear-gradient(135deg,#ffffff 0%,#fef3c7 40%,#fbbf24 75%,#d97706 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>Manager Dashboard</h1>
          </div>
          <p className="text-slate-500 text-xs mt-0.5 pl-6">Viewing · {selectedLabel}</p>
        </div>

        <div className="relative" ref={dropRef}>
          <button
            onClick={() => setDropdownOpen(o => !o)}
            className="flex items-center gap-2.5 text-sm font-semibold text-white"
            style={{
              background: 'rgba(245,158,11,0.10)',
              backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(245,158,11,0.30)',
              borderRadius: '14px', padding: '10px 16px', minWidth: '215px',
              justifyContent: 'space-between',
              boxShadow: '0 4px 20px rgba(245,158,11,0.12)',
            }}
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.20)' }}>
                <Calendar size={14} className="text-amber-400" />
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
              border: '1px solid rgba(245,158,11,0.20)',
              boxShadow: '0 24px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(245,158,11,0.08)',
            }}>
              <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(245,158,11,0.08)' }}>
                <Calendar size={13} className="text-amber-400" />
                <p className="text-xs font-bold text-amber-300 uppercase tracking-widest">Select Month</p>
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
                        background: isSel ? 'rgba(245,158,11,0.15)' : 'transparent',
                        borderLeft: isSel ? '2px solid #f59e0b' : '2px solid transparent',
                      }}
                      onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                      onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: o.hasData ? (o.isClosed ? '#f87171' : '#34d399') : '#334155' }} />
                        <span className="text-sm font-medium" style={{ color: isSel ? '#fcd34d' : '#e2e8f0' }}>
                          {MONTHS_FULL[o.month - 1]} {o.year}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                        {o.isCurrent && <span style={{ fontSize: '9px', background: 'rgba(245,158,11,0.25)', color: '#fcd34d', border: '1px solid rgba(245,158,11,0.40)', padding: '2px 6px', borderRadius: '999px', fontWeight: 700 }}>LIVE</span>}
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Today's Meals", value: isCurrentMonth ? todayTotal : '—', icon: null },
          { label: 'Total Expense', value: `₹${summary?.grandTotal?.toFixed(2) || '0.00'}`, icon: null },
          { label: 'Active Members', value: members.length, icon: null },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-2xl p-5" style={glass}>
            <p className="text-2xl font-bold text-white mb-1">{value}</p>
            <p className="text-xs text-slate-500 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Bar Chart ── */}
      {memberMealCounts.some(m => m.meals > 0) && (
        <div className="rounded-2xl p-5" style={glass}>
          <h3 className="font-semibold text-white mb-1">Member Meal Count</h3>
          <p className="text-slate-500 text-xs mb-4">{selectedLabel}</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={memberMealCounts}>
              <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'rgba(8,14,28,0.97)', border: '1px solid rgba(245,158,11,0.20)', borderRadius: '12px', color: '#fff' }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="meals" fill="#f59e0b" radius={[5,5,0,0]} name="Total Meals" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Quick Actions ── */}
      <div className="rounded-2xl p-5" style={glass}>
        <h3 className="font-semibold text-white mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Mark Meals', path: '/manager/meals', cls: 'btn-primary' },
            { label: 'Add Expense', path: '/manager/expenses', cls: 'btn-amber' },
            { label: 'Record Payment', path: '/manager/payments', cls: 'btn-secondary' },
            { label: 'Generate Bills', path: '/manager/bills', cls: 'btn-secondary' },
          ].map(({ label, path, cls }) => (
            <button key={label} onClick={() => navigate(path)} className={`${cls} text-sm`}>{label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
