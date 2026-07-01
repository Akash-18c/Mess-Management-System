import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Search, Lock, Unlock, ChevronDown, ChevronUp, TrendingUp, Users, Utensils, HandCoins, ShoppingCart, Receipt, CreditCard, AlertCircle, Calendar } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../../api';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const COLORS = ['#22C55E','#F59E0B','#3B82F6','#EF4444','#8B5CF6','#EC4899','#14B8A6','#F97316'];
const rn = (name) => { const m = name?.match(/^\w+\s*\((.+)\)$/); return m ? m[1] : (name || ''); };
const fmt = (v) => `₹${(v || 0).toFixed(2)}`;

function StatCard({ label, value, color, icon: Icon, sub }) {
  return (
    <div className="rounded-xl p-3 sm:p-4 flex items-start gap-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      {Icon && (
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <Icon size={15} className={color} />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-slate-400 text-xs mb-0.5 truncate">{label}</p>
        <p className={`text-base sm:text-lg font-bold ${color}`}>{value}</p>
        {sub && <p className="text-slate-500 text-xs mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, iconColor = 'text-slate-400', children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card overflow-hidden p-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 sm:px-5 sm:py-4 text-left"
        style={{ borderBottom: open ? '1px solid rgba(255,255,255,0.07)' : 'none' }}
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon size={16} className={iconColor} />}
          <span className="font-semibold text-white text-sm sm:text-base">{title}</span>
        </div>
        {open ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </button>
      {open && <div className="p-4 sm:p-5">{children}</div>}
    </div>
  );
}

export default function AdminReports() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locking, setLocking] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef(null);

  useEffect(() => {
    const h = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const selectedLabel = `${MONTHS[month - 1]} ${year}`;
  const monthYearOptions = [];
  for (let y = now.getFullYear() + 1; y >= 2023; y--) {
    for (let m = 12; m >= 1; m--) {
      if (y === now.getFullYear() + 1 && m > now.getMonth() + 2) continue;
      monthYearOptions.push({ month: m, year: y });
    }
  }

  const fetchReport = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/admin/reports/${month}/${year}`);
      setReport(data);
      setExpanded(null);
    } catch { toast.error('Failed to load report'); }
    finally { setLoading(false); }
  };

  const toggleLock = async () => {
    const isClosed = report.summary?.isClosed;
    if (!window.confirm(isClosed
      ? `Reopen ${MONTHS[month - 1]} ${year}? Data will become editable again.`
      : `Lock ${MONTHS[month - 1]} ${year}? All data will be frozen.`
    )) return;
    setLocking(true);
    try {
      await api.post(`/admin/close-month/${month}/${year}`, { reopen: isClosed });
      toast.success(isClosed ? 'Month reopened' : 'Month locked');
      fetchReport();
    } catch { toast.error('Action failed'); }
    finally { setLocking(false); }
  };

  const s = report?.summary || {};
  const masi = report?.masiSalary || {};

  const pieData = report?.others?.reduce((acc, e) => {
    const key = e.categoryName || 'Other';
    const existing = acc.find(x => x.name === key);
    if (existing) existing.value += e.amount;
    else acc.push({ name: key, value: e.amount });
    return acc;
  }, []) || [];

  const getPaymentsFor = (memberId) =>
    (report?.payments || []).filter(p => p.memberId?._id === memberId || p.memberId === memberId);

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">Monthly Reports</h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-0.5">Full access — view, lock, reopen any month</p>
      </div>

      {/* Selector */}
      <div className="card">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="relative" ref={dropRef}>
            <label className="label">Month &amp; Year</label>
            <button
              onClick={() => setDropOpen(o => !o)}
              className="flex items-center gap-2 text-sm font-semibold text-white"
              style={{
                background: 'rgba(20,184,166,0.10)',
                border: '1px solid rgba(20,184,166,0.30)',
                borderRadius: '12px', padding: '9px 14px',
                minWidth: '180px',
              }}
            >
              <Calendar size={14} style={{ color: '#2dd4bf' }} />
              <span className="flex-1 text-left">{selectedLabel}</span>
              <ChevronDown size={13} className={`text-slate-400 transition-transform duration-200 ${dropOpen ? 'rotate-180' : ''}`} />
            </button>
            {dropOpen && (
              <div className="absolute left-0 top-full mt-2 z-50 rounded-2xl overflow-hidden"
                style={{ minWidth: '200px', background: 'rgba(6,10,22,0.98)', backdropFilter: 'blur(48px)', WebkitBackdropFilter: 'blur(48px)', border: '1px solid rgba(20,184,166,0.25)', boxShadow: '0 24px 60px rgba(0,0,0,0.85)' }}>
                <div className="px-4 py-2.5 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(20,184,166,0.08)' }}>
                  <Calendar size={11} style={{ color: '#2dd4bf' }} />
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#2dd4bf' }}>Select Month</p>
                </div>
                <div className="overflow-y-auto" style={{ maxHeight: '260px', scrollbarWidth: 'thin' }}>
                  {monthYearOptions.map(o => {
                    const isSel = o.month === month && o.year === year;
                    return (
                      <button key={`${o.month}-${o.year}`}
                        onClick={() => { setMonth(o.month); setYear(o.year); setDropOpen(false); setReport(null); }}
                        className="w-full text-left flex items-center gap-2.5"
                        style={{
                          padding: '9px 14px',
                          background: isSel ? 'rgba(20,184,166,0.12)' : 'transparent',
                          borderLeft: isSel ? '2px solid #14b8a6' : '2px solid transparent',
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                        }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: isSel ? '#14b8a6' : '#334155' }} />
                        <span className="text-sm font-medium" style={{ color: isSel ? '#2dd4bf' : '#cbd5e1' }}>
                          {MONTHS[o.month - 1]} {o.year}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <button onClick={fetchReport} disabled={loading} className="btn-primary flex items-center gap-2">
            <Search size={15} />{loading ? 'Loading…' : 'Load Report'}
          </button>
        </div>
      </div>

      {report && (
        <div className="space-y-4">

          {/* ── Month Header ── */}
          <div className="card">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-bold text-white">{MONTHS[month - 1]} {year}</h2>
                  {s.isClosed
                    ? <span className="badge-closed text-xs">🔴 Closed</span>
                    : <span className="badge-open text-xs">🟢 Open</span>
                  }
                </div>
                {report.assignment && (
                  <p className="text-slate-400 text-xs mt-1">
                    Manager: <span className="text-amber-400 font-medium">{rn(report.assignment.managerId?.name)}</span>
                    <span className="text-slate-600 mx-1">·</span>
                    <span className="text-slate-500">{report.assignment.managerId?.email}</span>
                  </p>
                )}
              </div>
              <button onClick={toggleLock} disabled={locking}
                className={`flex items-center gap-2 text-sm px-4 py-2 rounded-xl font-semibold transition-colors self-start sm:self-auto ${s.isClosed ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}>
                {s.isClosed ? <Unlock size={14} /> : <Lock size={14} />}
                {locking ? 'Please wait…' : s.isClosed ? 'Reopen Month' : 'Lock Month'}
              </button>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
              <StatCard label="Grocery Total"    value={fmt(s.groceryTotal)}   color="text-green-400"  icon={ShoppingCart} />
              <StatCard label="Other Expenses"   value={fmt(s.otherTotal)}     color="text-amber-400"  icon={Receipt} />
              <StatCard label="Grand Total"      value={fmt(s.grandTotal)}     color="text-blue-400"   icon={TrendingUp} />
              <StatCard label="Meal Rate"        value={fmt(s.mealRate)}       color="text-purple-400" icon={Utensils}     sub={`${s.totalMeals || 0} total meals`} />
              <StatCard label="Total Collected"  value={fmt(s.totalCollected)} color="text-cyan-400"   icon={CreditCard} />
              <StatCard label="Mess Balance"     value={fmt(s.messBalance)}    color={s.messBalance >= 0 ? 'text-green-400' : 'text-red-400'} icon={AlertCircle} />
            </div>
          </div>

          {/* ── Masi Salary ── */}
          <Section title="Masi Salary" icon={HandCoins} iconColor="text-pink-400">
            {masi.totalAmount > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <StatCard label="Total Salary"      value={fmt(masi.totalAmount)}     color="text-pink-400"   icon={HandCoins} />
                <StatCard label="Per Member"        value={fmt(masi.perMemberAmount)} color="text-amber-400"  icon={Users} />
                <StatCard label="Member Count"      value={masi.memberCount || '—'}   color="text-slate-300"  icon={Users} />
              </div>
            ) : (
              <p className="text-slate-500 text-sm">No masi salary set for this month.</p>
            )}
          </Section>

          {/* ── Member Bills ── */}
          {report.bills?.length > 0 && (
            <Section title={`Member Bills (${report.bills.length})`} icon={Receipt} iconColor="text-blue-400">
              <div className="space-y-2">
                {report.bills.map(b => {
                  const isOpen = expanded === b._id;
                  const memberPayments = getPaymentsFor(b.memberId?._id);
                  const totalPaid = memberPayments.reduce((s, p) => s + p.amount, 0);
                  return (
                    <div key={b._id} className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                      {/* Collapsed row */}
                      <div
                        className="flex items-center justify-between px-3 sm:px-4 py-3 cursor-pointer"
                        style={{ background: isOpen ? 'rgba(255,255,255,0.04)' : 'transparent' }}
                        onClick={() => setExpanded(isOpen ? null : b._id)}
                      >
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.4),rgba(16,185,129,0.3))', border: '1px solid rgba(255,255,255,0.1)' }}>
                            {rn(b.memberId?.name)?.[0]?.toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-white font-medium text-sm truncate">{rn(b.memberId?.name)}</p>
                            <p className="text-slate-500 text-xs">Room {b.memberId?.room} · {b.mealCount} meals</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0 ml-2">
                          <div className="text-right hidden sm:block">
                            <p className="text-white text-sm font-medium">{fmt(b.totalBill)}</p>
                            <p className="text-slate-500 text-xs">Bill</p>
                          </div>
                          <div className="text-right hidden sm:block">
                            <p className="text-green-400 text-sm font-medium">{fmt(totalPaid)}</p>
                            <p className="text-slate-500 text-xs">Paid</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-bold ${b.dueAmount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                              {b.dueAmount > 0 ? `-${fmt(b.dueAmount)}` : `+${fmt(Math.abs(b.dueAmount))}`}
                            </p>
                            <p className="text-slate-500 text-xs">{b.dueAmount > 0 ? 'Due' : 'Refund'}</p>
                          </div>
                          {isOpen ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
                        </div>
                      </div>

                      {/* Expanded */}
                      {isOpen && (
                        <div className="p-3 sm:p-4 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.2)' }}>
                          {/* Meal counts */}
                          <div className="grid grid-cols-4 gap-2">
                            {[
                              { label: 'Lunch',       value: b.lunchCount },
                              { label: 'Dinner',      value: b.dinnerCount },
                              { label: 'Guest Meals', value: b.guestMeals },
                              { label: 'Total Meals', value: b.mealCount },
                            ].map(({ label, value }) => (
                              <div key={label} className="rounded-lg p-2 text-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                <p className="text-slate-400 text-xs mb-0.5">{label}</p>
                                <p className="text-white font-bold text-base">{value || 0}</p>
                              </div>
                            ))}
                          </div>

                          {/* Bill breakdown */}
                          <div className="rounded-xl p-3 text-sm space-y-1.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <div className="flex justify-between"><span className="text-slate-400">Meal Rate</span><span className="text-white">{fmt(b.mealRate)}/meal</span></div>
                            <div className="flex justify-between"><span className="text-slate-400">Meal Cost</span><span className="text-white">{fmt(b.mealCost || b.mealCount * b.mealRate)}</span></div>
                            {b.guestMeals > 0 && <div className="flex justify-between"><span className="text-slate-400">Guest Charges</span><span className="text-amber-400">+{fmt(b.guestCharge)}</span></div>}
                            {b.gasCharge > 0 && <div className="flex justify-between"><span className="text-slate-400">Gas Charge</span><span className="text-orange-400">+{fmt(b.gasCharge)}</span></div>}
                            {b.otherSharedCharge > 0 && <div className="flex justify-between"><span className="text-slate-400">Other Shared</span><span className="text-purple-400">+{fmt(b.otherSharedCharge)}</span></div>}
                            {b.otherCharges > 0 && <div className="flex justify-between"><span className="text-slate-400">Other Charges</span><span className="text-purple-400">+{fmt(b.otherCharges)}</span></div>}
                            {b.masiSalary > 0 && <div className="flex justify-between"><span className="text-slate-400">Masi Salary</span><span className="text-pink-400">+{fmt(b.masiSalary)}</span></div>}
                            <div className="flex justify-between pt-1.5" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                              <span className="text-slate-200 font-medium">Total Bill</span>
                              <span className="text-white font-bold">{fmt(b.totalBill)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Advance Paid</span>
                              <span className="text-green-400">-{fmt(b.advance)}</span>
                            </div>
                            <div className="flex justify-between pt-1.5" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                              <span className="text-slate-200 font-medium">{b.dueAmount > 0 ? 'Amount Due' : 'Refund'}</span>
                              <span className={`font-bold ${b.dueAmount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{fmt(Math.abs(b.dueAmount))}</span>
                            </div>
                          </div>

                          {/* Payment history */}
                          {memberPayments.length > 0 && (
                            <div>
                              <p className="text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wide">Payment History</p>
                              <div className="space-y-1.5">
                                {memberPayments.map(p => (
                                  <div key={p._id} className="flex items-center justify-between text-xs rounded-lg px-3 py-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                    <span className="text-slate-400">{new Date(p.date).toLocaleDateString('en-IN')}</span>
                                    <span className="text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">{p.method}</span>
                                    <span className="text-green-400 font-semibold">{fmt(p.amount)}</span>
                                    {p.note && <span className="text-slate-500 hidden sm:inline truncate max-w-[100px]">{p.note}</span>}
                                  </div>
                                ))}
                                <div className="flex justify-between text-xs px-3 py-1.5 rounded-lg" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
                                  <span className="text-slate-300 font-medium">Total Paid</span>
                                  <span className="text-green-400 font-bold">{fmt(totalPaid)}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          {/* ── Other Expenses ── */}
          {report.others?.length > 0 && (
            <Section title={`Other Expenses (${report.others.length})`} icon={Receipt} iconColor="text-amber-400">
              <div className="space-y-4">
                {/* Pie chart */}
                {pieData.length > 0 && (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" paddingAngle={2}>
                        {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: 'rgba(8,14,28,0.97)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '10px', color: '#fff', fontSize: 12 }}
                        formatter={v => fmt(v)}
                      />
                      <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}

                {/* Table */}
                <div className="overflow-x-auto -mx-1">
                  <table className="w-full text-sm min-w-[420px]">
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                        {['Category','Description','Amount','Status','Date'].map(h => (
                          <th key={h} className={`py-2 px-3 font-medium text-xs ${h === 'Amount' || h === 'Status' ? 'text-right' : 'text-left'}`} style={{ color: '#4a5a7a' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {report.others.map(e => (
                        <tr key={e._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td className="py-2 px-3 text-amber-400 font-medium text-xs">{e.categoryName || '—'}</td>
                          <td className="py-2 px-3 text-slate-300 text-xs">{e.description || e.note || '—'}</td>
                          <td className="py-2 px-3 text-right text-white font-medium">{fmt(e.amount)}</td>
                          <td className="py-2 px-3 text-right">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${e.status === 'Paid' ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'}`}>{e.status}</span>
                          </td>
                          <td className="py-2 px-3 text-slate-400 text-xs">{new Date(e.date).toLocaleDateString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                        <td colSpan={2} className="py-2 px-3 text-slate-300 font-semibold text-xs">Total</td>
                        <td className="py-2 px-3 text-right text-amber-400 font-bold">{fmt(s.otherTotal)}</td>
                        <td colSpan={2} />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </Section>
          )}

          {/* ── Grocery Expenses ── */}
          {report.groceries?.length > 0 && (
            <Section title={`Grocery Expenses (${report.groceries.length})`} icon={ShoppingCart} iconColor="text-green-400">
              <div className="overflow-x-auto -mx-1">
                <table className="w-full text-sm min-w-[380px]">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                      {['Item','Qty','Unit Price','Total','Date'].map(h => (
                        <th key={h} className={`py-2 px-3 font-medium text-xs ${h === 'Total' || h === 'Unit Price' || h === 'Qty' ? 'text-right' : 'text-left'}`} style={{ color: '#4a5a7a' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {report.groceries.map(g => (
                      <tr key={g._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td className="py-2 px-3 text-white">{g.item}</td>
                        <td className="py-2 px-3 text-right text-slate-300">{g.quantity} {g.unit}</td>
                        <td className="py-2 px-3 text-right text-slate-300">{fmt(g.unitPrice)}</td>
                        <td className="py-2 px-3 text-right text-green-400 font-medium">{fmt(g.total)}</td>
                        <td className="py-2 px-3 text-slate-400 text-xs">{new Date(g.date).toLocaleDateString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                      <td colSpan={3} className="py-2 px-3 text-slate-300 font-semibold text-xs">Total</td>
                      <td className="py-2 px-3 text-right text-green-400 font-bold">{fmt(s.groceryTotal)}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Section>
          )}

          {/* Empty state */}
          {!report.bills?.length && !report.groceries?.length && !report.others?.length && (
            <div className="card text-center py-10">
              <p className="text-slate-400">No data found for {MONTHS[month - 1]} {year}.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
