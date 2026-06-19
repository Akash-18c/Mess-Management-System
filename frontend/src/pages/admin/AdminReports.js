import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Search, Lock, Unlock, ChevronDown, ChevronUp } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../api';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const COLORS = ['#22C55E', '#F59E0B', '#3B82F6', '#EF4444', '#8B5CF6'];
const realName = (name) => { const m = name?.match(/^\w+\s*\((.+)\)$/); return m ? m[1] : name; };

export default function AdminReports() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locking, setLocking] = useState(false);
  const [expanded, setExpanded] = useState(null);

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
    } catch { toast.error('Error'); }
    finally { setLocking(false); }
  };

  const otherByCategory = report?.others?.reduce((acc, e) => {
    const key = e.categoryName || 'Other';
    acc[key] = (acc[key] || 0) + e.amount;
    return acc;
  }, {});
  const pieData = otherByCategory ? Object.entries(otherByCategory).map(([name, value]) => ({ name, value })) : [];

  const getPaymentsFor = (memberId) =>
    (report?.payments || []).filter(p => p.memberId?._id === memberId || p.memberId === memberId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Monthly Reports</h1>
        <p className="text-slate-400 text-sm">Full access — view, lock, reopen any month</p>
      </div>

      <div className="card">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="label">Month</label>
            <select className="input w-40" value={month} onChange={e => setMonth(+e.target.value)}>
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Year</label>
            <input className="input w-28" type="number" value={year} onChange={e => setYear(+e.target.value)} min="2020" max="2030" />
          </div>
          <button onClick={fetchReport} disabled={loading} className="btn-primary flex items-center gap-2">
            <Search size={16} />{loading ? 'Loading...' : 'Load Report'}
          </button>
        </div>
      </div>

      {report && (
        <div className="space-y-4">
          {/* Summary Header */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-white">{MONTHS[month - 1]} {year}</h3>
                {report.assignment && (
                  <p className="text-slate-400 text-xs mt-0.5">Manager: <span className="text-amber-400">{report.assignment.managerId?.name}</span></p>
                )}
              </div>
              <div className="flex items-center gap-3">
                {report.summary?.isClosed
                  ? <span className="badge-closed">🔴 Closed</span>
                  : <span className="badge-open">🟢 Open</span>
                }
                <button onClick={toggleLock} disabled={locking}
                  className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg font-semibold transition-colors ${report.summary?.isClosed ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}>
                  {report.summary?.isClosed ? <Unlock size={14} /> : <Lock size={14} />}
                  {locking ? '...' : report.summary?.isClosed ? 'Reopen Month' : 'Lock Month'}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Grocery Total', value: report.summary?.groceryTotal, color: 'text-green-400' },
                { label: 'Other Total', value: report.summary?.otherTotal, color: 'text-amber-400' },
                { label: 'Grand Total', value: report.summary?.grandTotal, color: 'text-blue-400' },
                { label: 'Meal Rate / meal', value: report.summary?.mealRate, color: 'text-purple-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <p className="text-slate-400 text-xs mb-1">{label}</p>
                  <p className={`text-lg font-bold ${color}`}>₹{(value || 0).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Member Bills with expandable breakdown */}
          {report.bills?.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-white mb-4">Member Bills</h3>
              <div className="space-y-2">
                {report.bills.map(b => {
                  const isOpen = expanded === b._id;
                  const memberPayments = getPaymentsFor(b.memberId?._id);
                  return (
                    <div key={b._id} className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                      {/* Row */}
                      <div className="flex items-center justify-between px-4 py-3 cursor-pointer transition-colors" onClick={() => setExpanded(isOpen ? null : b._id)}
                        onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                        onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-xs font-bold text-white">
                            {realName(b.memberId?.name)?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="text-white font-medium text-sm">{realName(b.memberId?.name)}</p>
                            <p className="text-slate-500 text-xs">Room {b.memberId?.room} · {b.mealCount} meals</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right hidden sm:block">
                            <p className="text-white text-sm font-medium">₹{b.totalBill?.toFixed(2)}</p>
                            <p className="text-slate-400 text-xs">Bill</p>
                          </div>
                          <div className="text-right hidden sm:block">
                            <p className="text-green-400 text-sm font-medium">₹{b.advance?.toFixed(2)}</p>
                            <p className="text-slate-400 text-xs">Advance</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-bold ${b.dueAmount > 0 ? 'text-red-400' : 'text-green-400'}`}>
                              {b.dueAmount > 0 ? `-₹${b.dueAmount.toFixed(2)}` : `+₹${Math.abs(b.dueAmount).toFixed(2)}`}
                            </p>
                            <p className="text-slate-400 text-xs">{b.dueAmount > 0 ? 'Due' : 'Refund'}</p>
                          </div>
                          <button className="text-slate-400 hover:text-white ml-2">
                            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </div>
                      </div>

                      {/* Expanded Breakdown */}
                      {isOpen && (
                        <div className="p-4 space-y-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.25)' }}>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                              { label: 'Lunch', value: b.lunchCount },
                              { label: 'Dinner', value: b.dinnerCount },
                              { label: 'Guest Meals', value: b.guestMeals },
                              { label: 'Total Meals', value: b.mealCount },
                            ].map(({ label, value }) => (
                              <div key={label} className="bg-slate-700/50 rounded-lg p-3 text-center">
                                <p className="text-slate-400 text-xs">{label}</p>
                                <p className="text-white font-bold text-lg">{value || 0}</p>
                              </div>
                            ))}
                          </div>

                          <div className="rounded-xl p-3 text-sm space-y-1.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <div className="flex justify-between"><span className="text-slate-400">Meal Rate</span><span className="text-white">₹{b.mealRate?.toFixed(2)}/meal</span></div>
                            <div className="flex justify-between"><span className="text-slate-400">Meals Cost</span><span className="text-white">₹{(b.mealCount * b.mealRate).toFixed(2)}</span></div>
                            {b.guestMeals > 0 && <div className="flex justify-between"><span className="text-slate-400">Guest Charges</span><span className="text-amber-400">+₹{b.guestCharge?.toFixed(2)}</span></div>}
                            <div className="flex justify-between pt-1.5" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}><span className="text-slate-300 font-medium">Total Bill</span><span className="text-white font-bold">₹{b.totalBill?.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span className="text-slate-400">Advance Paid</span><span className="text-green-400">-₹{b.advance?.toFixed(2)}</span></div>
                            <div className="flex justify-between pt-1.5" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                              <span className="text-slate-300 font-medium">{b.dueAmount > 0 ? 'Amount Due' : 'Refund'}</span>
                              <span className={`font-bold ${b.dueAmount > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                ₹{Math.abs(b.dueAmount).toFixed(2)}
                              </span>
                            </div>
                          </div>

                          {memberPayments.length > 0 && (
                            <div>
                              <p className="text-slate-400 text-xs font-medium mb-2">Payment History</p>
                              <div className="space-y-1">
                                {memberPayments.map(p => (
                                  <div key={p._id} className="flex items-center justify-between text-xs bg-slate-700/40 rounded px-3 py-1.5">
                                    <span className="text-slate-300">{new Date(p.date).toLocaleDateString('en-IN')}</span>
                                    <span className="text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">{p.method}</span>
                                    <span className="text-green-400 font-medium">₹{p.amount.toFixed(2)}</span>
                                    {p.note && <span className="text-slate-500 hidden sm:inline">{p.note}</span>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Other Expense Pie */}
          {pieData.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-white mb-4">Other Expenses Breakdown</h3>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value"
                    label={({ name, value }) => `${name}: ₹${value.toFixed(0)}`}
                    labelLine={{ stroke: '#475569' }}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'rgba(8,14,28,0.97)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '12px', color: '#fff' }} formatter={v => `₹${v.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Grocery List */}
          {report.groceries?.length > 0 && (
            <div className="card overflow-x-auto">
              <h3 className="font-semibold text-white mb-4">Grocery Expenses</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <th className="text-left py-2 px-3 font-medium" style={{ color: '#4a5a7a' }}>Item</th>
                    <th className="text-right py-2 px-3 font-medium" style={{ color: '#4a5a7a' }}>Qty</th>
                    <th className="text-right py-2 px-3 font-medium" style={{ color: '#4a5a7a' }}>Price</th>
                    <th className="text-right py-2 px-3 font-medium" style={{ color: '#4a5a7a' }}>Total</th>
                    <th className="text-left py-2 px-3 font-medium hidden sm:table-cell" style={{ color: '#4a5a7a' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {report.groceries.map(g => (
                    <tr key={g._id} className="transition-colors"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td className="py-2 px-3 text-white">{g.item}</td>
                      <td className="py-2 px-3 text-right text-slate-300">{g.quantity} {g.unit}</td>
                      <td className="py-2 px-3 text-right text-slate-300">₹{g.unitPrice}</td>
                      <td className="py-2 px-3 text-right text-green-400 font-medium">₹{g.total.toFixed(2)}</td>
                      <td className="py-2 px-3 text-slate-400 hidden sm:table-cell">{new Date(g.date).toLocaleDateString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
