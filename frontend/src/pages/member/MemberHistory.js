import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, ReceiptText, Users, TrendingUp, IndianRupee, Wallet } from 'lucide-react';
import api from '../../api';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const SHORT_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function MemberHistory() {
  const [groups, setGroups] = useState([]);
  const [expandedMonth, setExpandedMonth] = useState(null);
  const [expandedBill, setExpandedBill] = useState(null);
  const [payments, setPayments] = useState({});
  const [loadingPayments, setLoadingPayments] = useState({});

  useEffect(() => {
    api.get('/member/all-history').then(r => {
      setGroups(r.data);
      if (r.data.length > 0) setExpandedMonth(`${r.data[0].year}-${r.data[0].month}`);
    });
  }, []);

  const toggleMonth = (key) => setExpandedMonth(expandedMonth === key ? null : key);

  const toggleBill = async (b) => {
    const key = b._id;
    if (expandedBill === key) { setExpandedBill(null); return; }
    setExpandedBill(key);
    if (payments[key]) return;
    setLoadingPayments(l => ({ ...l, [key]: true }));
    try {
      const res = await api.get(`/member/all-payments/${b.month}/${b.year}`);
      const memberPayments = res.data.filter(p =>
        p.memberId?._id === b.memberId?._id?.toString() ||
        p.memberId?._id === b.memberId?._id ||
        p.memberId === b.memberId?._id?.toString()
      );
      setPayments(p => ({ ...p, [key]: memberPayments }));
    } catch {
      setPayments(p => ({ ...p, [key]: [] }));
    } finally {
      setLoadingPayments(l => ({ ...l, [key]: false }));
    }
  };

  if (groups.length === 0) return (
    <div className="space-y-4">
      <div><h1 className="text-2xl font-bold text-white">Mess History</h1><p className="text-slate-400 text-sm">All members' monthly records</p></div>
      <div className="card py-16 text-center"><Users size={44} className="text-slate-600 mx-auto mb-3" /><p className="text-slate-500">No history yet. Start marking meals to see records here.</p></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Mess History</h1>
        <p className="text-slate-400 text-sm">All members — monthly bills & breakdown</p>
      </div>

      <div className="space-y-4">
        {groups.map(group => {
          const key = `${group.year}-${group.month}`;
          const isMonthOpen = expandedMonth === key;
          const s = group.summary;
          const totalDue = group.bills.reduce((sum, b) => sum + Math.max(b.dueAmount, 0), 0);
          const totalPaid = group.bills.reduce((sum, b) => sum + b.advance, 0);

          return (
            <div key={key} className="rounded-xl border border-slate-700 overflow-hidden bg-slate-800">
              {/* Month Header */}
              <button
                onClick={() => toggleMonth(key)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-700/40 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/20 flex flex-col items-center justify-center">
                    <span className="text-green-400 text-xs font-semibold">{SHORT_MONTHS[group.month - 1]}</span>
                    <span className="text-slate-400 text-xs">{group.year}</span>
                  </div>
                  <div className="text-left">
                    <p className="text-white font-semibold">{MONTHS[group.month - 1]} {group.year}</p>
                    <p className="text-slate-400 text-xs">{group.bills.length} members · ₹{s?.mealRate?.toFixed(2) || '0'}/meal</p>
                  </div>
                </div>
                <div className="flex items-center gap-5">
                  <div className="text-right hidden sm:block">
                    <p className="text-white font-medium text-sm">₹{s?.grandTotal?.toFixed(2) || '0.00'}</p>
                    <p className="text-slate-500 text-xs">Total Expense</p>
                  </div>
                  <div className="text-right hidden md:block">
                    <p className="text-green-400 font-medium text-sm">₹{totalPaid.toFixed(2)}</p>
                    <p className="text-slate-500 text-xs">Collected</p>
                  </div>
                  <div className="text-right hidden md:block">
                    <p className={`font-semibold text-sm ${s?.messBalance >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                      {s?.messBalance >= 0 ? '+' : ''}₹{(s?.messBalance || 0).toFixed(2)}
                    </p>
                    <p className="text-slate-500 text-xs">Mess Balance</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold text-sm ${totalDue > 0 ? 'text-red-400' : 'text-green-400'}`}>
                      ₹{totalDue.toFixed(2)}
                    </p>
                    <p className="text-slate-500 text-xs">Total Due</p>
                  </div>
                  <div className="text-slate-400 ml-2">{isMonthOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</div>
                </div>
              </button>

              {/* Month Expanded */}
              {isMonthOpen && (
                <div className="border-t border-slate-700">
                  {/* Month Summary Bar */}
                  {s && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-slate-700">
                      {[
                        { label: 'Grocery', value: s.groceryTotal, color: 'text-green-400' },
                        { label: 'Other', value: s.otherTotal, color: 'text-amber-400' },
                        { label: 'Grand Total', value: s.grandTotal, color: 'text-blue-400' },
                        { label: 'Mess Balance', value: s.messBalance, color: s.messBalance >= 0 ? 'text-green-400' : 'text-red-400' },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="bg-slate-800 px-4 py-3 text-center">
                          <p className="text-slate-500 text-xs mb-0.5">{label}</p>
                          <p className={`font-bold text-sm ${color}`}>
                            {value < 0 ? '-' : ''}₹{Math.abs(value || 0).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Members List */}
                  <div className="divide-y divide-slate-700/50">
                    {group.bills.map(b => {
                      const isBillOpen = expandedBill === b._id;
                      const memberPays = payments[b._id] || [];
                      const isLoadingPay = loadingPayments[b._id];

                      return (
                        <div key={b._id}>
                          {/* Member Row */}
                          <div
                            className="flex items-center justify-between px-4 py-3 hover:bg-slate-700/20 cursor-pointer"
                            onClick={() => toggleBill(b)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                                {b.memberId?.name?.[0]?.toUpperCase()}
                              </div>
                              <div>
                                <p className="text-white text-sm font-medium">{b.memberId?.name}</p>
                                <p className="text-slate-500 text-xs">
                                  {b.memberId?.room ? `Room ${b.memberId.room} · ` : ''}{b.mealCount} meals
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 sm:gap-5">
                              <div className="text-right hidden sm:block">
                                <p className="text-white text-sm">₹{b.totalBill?.toFixed(2)}</p>
                                <p className="text-slate-500 text-xs">Bill</p>
                              </div>
                              <div className="text-right hidden sm:block">
                                <p className="text-green-400 text-sm">₹{b.advance?.toFixed(2)}</p>
                                <p className="text-slate-500 text-xs">Advance</p>
                              </div>
                              <div className="text-right">
                                <p className={`font-bold text-sm ${b.dueAmount > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                  {b.dueAmount > 0 ? `-₹${b.dueAmount.toFixed(2)}` : `+₹${Math.abs(b.dueAmount).toFixed(2)}`}
                                </p>
                                <p className="text-slate-500 text-xs">{b.dueAmount > 0 ? 'Due' : 'Refund'}</p>
                              </div>
                              <button className="flex items-center gap-1 text-xs text-slate-400 hover:text-white bg-slate-700 hover:bg-slate-600 px-2.5 py-1.5 rounded-lg transition-colors">
                                <ReceiptText size={12} />
                                <span className="hidden sm:inline">{isBillOpen ? 'Hide' : 'Breakdown'}</span>
                                {isBillOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                              </button>
                            </div>
                          </div>

                          {/* Bill Breakdown */}
                          {isBillOpen && (
                            <div className="bg-slate-900/70 px-5 py-4 space-y-4 border-t border-slate-700/50">
                              {isLoadingPay ? (
                                <p className="text-slate-400 text-sm text-center py-2">Loading...</p>
                              ) : (
                                <>
                                  {/* Meal counts */}
                                  <div className="grid grid-cols-4 gap-2">
                                    {[
                                      { label: 'Lunch', value: b.lunchCount, color: 'text-green-400' },
                                      { label: 'Dinner', value: b.dinnerCount, color: 'text-blue-400' },
                                      { label: 'Guest', value: b.guestMeals, color: 'text-amber-400' },
                                      { label: 'Total', value: b.mealCount, color: 'text-white' },
                                    ].map(({ label, value, color }) => (
                                      <div key={label} className="bg-slate-700/50 rounded-lg p-2.5 text-center">
                                        <p className="text-slate-500 text-xs">{label}</p>
                                        <p className={`font-bold text-lg ${color}`}>{value || 0}</p>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Calculation */}
                                  <div className="bg-slate-800/80 rounded-lg p-3.5 space-y-1.5 text-sm border border-slate-700/50">
                                    <div className="flex justify-between text-slate-400">
                                      <span>Meal Rate</span>
                                      <span className="text-white">₹{b.mealRate?.toFixed(2)}/meal</span>
                                    </div>
                                    <div className="flex justify-between text-slate-400">
                                      <span>{b.mealCount} meals × ₹{b.mealRate?.toFixed(2)}</span>
                                      <span className="text-white">₹{((b.mealCount || 0) * (b.mealRate || 0)).toFixed(2)}</span>
                                    </div>
                                    {b.guestMeals > 0 && (
                                      <div className="flex justify-between text-slate-400">
                                        <span>{b.guestMeals} guest × ₹{b.mealRate?.toFixed(2)}</span>
                                        <span className="text-amber-400">+₹{b.guestCharge?.toFixed(2)}</span>
                                      </div>
                                    )}
                                    {b.masiSalary > 0 && (
                                      <div className="flex justify-between text-slate-400">
                                        <span>Masi Salary</span>
                                        <span className="text-amber-400">+₹{b.masiSalary?.toFixed(2)}</span>
                                      </div>
                                    )}
                                    {b.otherCharges > 0 && (
                                      <div className="flex justify-between text-slate-400">
                                        <span>Other Charges</span>
                                        <span className="text-orange-400">+₹{b.otherCharges?.toFixed(2)}</span>
                                      </div>
                                    )}
                                    <div className="flex justify-between font-bold border-t border-slate-600 pt-1.5">
                                      <span className="text-slate-200">Total Bill</span>
                                      <span className="text-white">₹{b.totalBill?.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-400">
                                      <span>Advance Paid</span>
                                      <span className="text-green-400">− ₹{b.advance?.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between font-bold border-t border-slate-600 pt-1.5">
                                      <span className="text-slate-200">{b.dueAmount > 0 ? 'Amount Due' : 'Refund'}</span>
                                      <span className={b.dueAmount > 0 ? 'text-red-400' : 'text-green-400'}>
                                        ₹{Math.abs(b.dueAmount).toFixed(2)}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Payments */}
                                  {memberPays.length > 0 && (
                                    <div>
                                      <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">Payment History</p>
                                      <div className="space-y-1.5">
                                        {memberPays.map(p => (
                                          <div key={p._id} className="flex items-center justify-between bg-slate-700/40 rounded-lg px-3 py-2 text-xs">
                                            <span className="text-slate-400">{new Date(p.date).toLocaleDateString('en-IN')}</span>
                                            <span className="text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">{p.method}</span>
                                            <span className="text-green-400 font-semibold">₹{p.amount.toFixed(2)}</span>
                                            {p.note && <span className="text-slate-500 hidden sm:inline">{p.note}</span>}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
