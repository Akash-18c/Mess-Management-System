import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, ReceiptText, History, UtensilsCrossed, IndianRupee, CreditCard, Flame, Leaf, Package, Users } from 'lucide-react';
import api from '../../api';

const MONTHS       = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const SHORT_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const glass = {
  background: 'rgba(255,255,255,0.03)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.09)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.07)',
};

const rn = (name) => { const m = name?.match(/^\w+\s*\((.+)\)$/); return m ? m[1] : (name || ''); };

function StatPill({ label, value, color }) {
  return (
    <div className="flex flex-col items-center justify-center py-3 px-2"
      style={{ background: 'rgba(10,15,30,0.5)' }}>
      <p className="font-bold text-sm tabular-nums" style={{ color }}>{value}</p>
      <p className="text-slate-500 text-[10px] mt-0.5 text-center leading-tight">{label}</p>
    </div>
  );
}

function BillBreakdown({ b, memberPays, isLoading }) {
  const rows = [
    b.mealCount > 0 && {
      label: `${b.mealCount} meals × ₹${b.mealRate?.toFixed(2)}`,
      value: `₹${(b.mealCost ?? (b.mealCount * b.mealRate) ?? 0).toFixed(2)}`,
      color: '#e2e8f0', icon: UtensilsCrossed, iconColor: '#34d399',
    },
    b.guestMeals > 0 && {
      label: `${b.guestMeals} guest meal${b.guestMeals > 1 ? 's' : ''}`,
      value: `+₹${b.guestCharge?.toFixed(2)}`,
      color: '#fcd34d', icon: Users, iconColor: '#fcd34d',
    },
    b.gasCharge > 0 && {
      label: 'Gas Cylinder',
      value: `+₹${b.gasCharge?.toFixed(2)}`,
      color: '#fb923c', icon: Flame, iconColor: '#fb923c',
    },
    b.riceCharge > 0 && {
      label: 'Rice Bag',
      value: `+₹${b.riceCharge?.toFixed(2)}`,
      color: '#86efac', icon: Leaf, iconColor: '#86efac',
    },
    b.otherSharedCharge > 0 && {
      label: 'Other Expenses',
      value: `+₹${b.otherSharedCharge?.toFixed(2)}`,
      color: '#fb923c', icon: Package, iconColor: '#fb923c',
    },
    b.otherCharges > 0 && {
      label: 'Other Charges',
      value: `+₹${b.otherCharges?.toFixed(2)}`,
      color: '#f472b6', icon: Package, iconColor: '#f472b6',
    },
    b.masiSalary > 0 && {
      label: 'Masi Salary',
      value: `+₹${b.masiSalary?.toFixed(2)}`,
      color: '#fbbf24', icon: IndianRupee, iconColor: '#fbbf24',
    },
  ].filter(Boolean);

  return (
    <div className="px-3 pb-3 pt-1 space-y-3">
      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <div className="w-5 h-5 rounded-full border-2 border-green-500/30 border-t-green-400 animate-spin" />
        </div>
      ) : (
        <>
          {/* Meal count tiles */}
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { label: 'Lunch',  value: b.lunchCount  || 0, accent: '#4ade80' },
              { label: 'Dinner', value: b.dinnerCount || 0, accent: '#60a5fa' },
              { label: 'Guest',  value: b.guestMeals  || 0, accent: '#fbbf24' },
              { label: 'Total',  value: b.mealCount   || 0, accent: '#ffffff' },
            ].map(({ label, value, accent }) => (
              <div key={label} className="rounded-xl py-2.5 px-1 text-center"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-[10px] text-slate-500 mb-1">{label}</p>
                <p className="font-bold text-base leading-none tabular-nums" style={{ color: accent }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Cost breakdown */}
          <div className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="px-3 py-2 flex items-center gap-1.5"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
              <ReceiptText size={11} className="text-slate-500" />
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cost Breakdown</p>
            </div>
            <div className="px-3 py-2 space-y-0">
              {rows.map(({ label, value, color, icon: Icon, iconColor }) => (
                <div key={label} className="flex items-center justify-between py-2"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon size={12} style={{ color: iconColor, flexShrink: 0 }} />
                    <span className="text-slate-400 text-xs truncate">{label}</span>
                  </div>
                  <span className="text-xs font-semibold tabular-nums flex-shrink-0 ml-3" style={{ color }}>{value}</span>
                </div>
              ))}
              {/* Total */}
              <div className="flex items-center justify-between py-2.5 mt-1"
                style={{ borderTop: '1px solid rgba(255,255,255,0.10)' }}>
                <span className="text-white text-sm font-bold">Total Bill</span>
                <span className="text-white text-sm font-bold tabular-nums">₹{b.totalBill?.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between pb-2"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="text-slate-400 text-xs">Advance Paid</span>
                <span className="text-green-400 text-xs font-semibold tabular-nums">− ₹{b.advance?.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-sm font-bold" style={{ color: b.dueAmount > 0 ? '#f87171' : '#4ade80' }}>
                  {b.dueAmount > 0 ? 'Amount Due' : 'Refund'}
                </span>
                <span className="text-sm font-bold tabular-nums" style={{ color: b.dueAmount > 0 ? '#f87171' : '#4ade80' }}>
                  ₹{Math.abs(b.dueAmount).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment history */}
          {memberPays.length > 0 && (
            <div className="rounded-2xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="px-3 py-2 flex items-center gap-1.5"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                <CreditCard size={11} className="text-slate-500" />
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Payment History</p>
              </div>
              <div className="px-3 py-2 space-y-0">
                {memberPays.map((p, i) => (
                  <div key={p._id} className="flex items-center justify-between py-2"
                    style={{ borderBottom: i < memberPays.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <span className="text-slate-400 text-xs">
                      {new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(96,165,250,0.12)', color: '#93c5fd', border: '1px solid rgba(96,165,250,0.20)' }}>
                      {p.method}
                    </span>
                    <span className="text-green-400 font-bold text-xs tabular-nums">₹{p.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function MemberHistory() {
  const [groups,          setGroups]          = useState([]);
  const [expandedMonth,   setExpandedMonth]   = useState(null);
  const [expandedBill,    setExpandedBill]    = useState(null);
  const [payments,        setPayments]        = useState({});
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
      const memberId = b.memberId?._id?.toString();
      const mp = res.data.filter(p =>
        (p.memberId?._id?.toString() ?? p.memberId?.toString()) === memberId
      );
      setPayments(p => ({ ...p, [key]: mp }));
    } catch {
      setPayments(p => ({ ...p, [key]: [] }));
    } finally {
      setLoadingPayments(l => ({ ...l, [key]: false }));
    }
  };

  if (groups.length === 0) return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <History size={18} className="text-green-400" />
          <h1 style={{ fontFamily: "'Dancing Script', cursive", fontSize: '1.6rem', fontWeight: 700,
            background: 'linear-gradient(135deg,#ffffff 0%,#bbf7d0 40%,#34d399 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Mess History
          </h1>
        </div>
        <p className="text-slate-500 text-xs pl-6">All members' monthly records</p>
      </div>
      <div className="rounded-2xl py-16 text-center" style={glass}>
        <History size={40} className="text-slate-700 mx-auto mb-3" />
        <p className="text-slate-500 text-sm">No history yet.</p>
        <p className="text-slate-600 text-xs mt-1">Start marking meals to see records here.</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 pb-8">
      {/* Page header */}
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <History size={16} className="text-green-400 flex-shrink-0" />
          <h1 style={{ fontFamily: "'Dancing Script', cursive", fontSize: 'clamp(1.4rem,5vw,1.7rem)', fontWeight: 700,
            background: 'linear-gradient(135deg,#ffffff 0%,#bbf7d0 40%,#34d399 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1.2 }}>
            Mess History
          </h1>
        </div>
        <p className="text-slate-500 text-xs pl-5">All members — monthly bills & breakdown</p>
      </div>

      {groups.map(group => {
        const key = `${group.year}-${group.month}`;
        const isMonthOpen = expandedMonth === key;
        const s = group.summary;
        const totalDue  = group.bills.reduce((sum, b) => sum + Math.max(b.dueAmount, 0), 0);

        return (
          <div key={key} className="rounded-2xl overflow-hidden" style={glass}>

            {/* ── Month header button ── */}
            <button onClick={() => toggleMonth(key)} className="w-full text-left"
              style={{ WebkitTapHighlightColor: 'transparent' }}>
              <div className="flex items-center gap-3 px-4 py-3.5">
                {/* Calendar badge */}
                <div className="w-11 h-11 rounded-xl flex flex-col items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.22)' }}>
                  <span className="text-green-400 text-[10px] font-bold leading-tight">{SHORT_MONTHS[group.month - 1]}</span>
                  <span className="text-slate-500 text-[10px] leading-tight">{group.year}</span>
                </div>

                {/* Title + sub */}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-sm leading-tight">{MONTHS[group.month - 1]} {group.year}</p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    {group.bills.length} members · ₹{s?.mealRate?.toFixed(2) || '0'}/meal
                    {s?.isClosed && <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                      style={{ background: 'rgba(248,113,113,0.12)', color: '#fca5a5', border: '1px solid rgba(248,113,113,0.22)' }}>Closed</span>}
                  </p>
                  {(s?.startDate || s?.endDate) && (
                    <p className="text-teal-500 text-[10px] font-semibold mt-0.5">
                      {s.startDate ? new Date(s.startDate+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short'}) : '?'}
                      {' → '}
                      {s.endDate ? new Date(s.endDate+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short'}) : '?'}
                    </p>
                  )}
                </div>

                {/* Right stats — responsive */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-white text-xs font-bold tabular-nums">₹{s?.grandTotal?.toFixed(2) || '0.00'}</p>
                    <p className="text-slate-600 text-[10px]">Expense</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-bold tabular-nums ${totalDue > 0 ? 'text-red-400' : 'text-green-400'}`}>
                      ₹{totalDue.toFixed(2)}
                    </p>
                    <p className="text-slate-600 text-[10px]">Due</p>
                  </div>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}>
                    {isMonthOpen
                      ? <ChevronUp size={14} className="text-slate-400" />
                      : <ChevronDown size={14} className="text-slate-400" />}
                  </div>
                </div>
              </div>
            </button>

            {/* ── Expanded content ── */}
            {isMonthOpen && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>

                {/* Summary stat grid */}
                {s && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-px"
                    style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <StatPill label="Grocery"      value={`₹${(s.groceryTotal||0).toFixed(2)}`}    color="#4ade80" />
                    <StatPill label="Other (Paid)" value={`₹${(s.otherPaidTotal||0).toFixed(2)}`}  color="#fb923c" />
                    <StatPill label="Grand Total"  value={`₹${(s.grandTotal||0).toFixed(2)}`}      color="#60a5fa" />
                    <StatPill label="Mess Balance" value={`${(s.messBalance||0) >= 0 ? '+' : ''}₹${Math.abs(s.messBalance||0).toFixed(2)}`}
                      color={(s.messBalance||0) >= 0 ? '#4ade80' : '#f87171'} />
                  </div>
                )}

                {/* Member bill rows */}
                <div>
                  {group.bills.map((b, bi) => {
                    const isBillOpen   = expandedBill === b._id;
                    const memberPays   = payments[b._id] || [];
                    const isLoadingPay = loadingPayments[b._id];
                    const name         = rn(b.memberId?.name);

                    return (
                      <div key={b._id} style={{ borderTop: bi === 0 ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>

                        {/* Member row */}
                        <div className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                          style={{ WebkitTapHighlightColor: 'transparent' }}
                          onClick={() => toggleBill(b)}>

                          {/* Avatar */}
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                            style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.20)' }}>
                            {name?.[0]?.toUpperCase()}
                          </div>

                          {/* Name + meals */}
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-semibold truncate">{name}</p>
                            <p className="text-slate-500 text-xs mt-0.5">{b.mealCount} meals
                              {b.memberId?.room ? ` · Room ${b.memberId.room}` : ''}
                            </p>
                          </div>

                          {/* Bill + advance (hidden on tiny screens) */}
                          <div className="text-right hidden sm:block flex-shrink-0">
                            <p className="text-white text-xs font-medium tabular-nums">₹{b.totalBill?.toFixed(2)}</p>
                            <p className="text-slate-600 text-[10px]">Bill</p>
                          </div>
                          <div className="text-right hidden sm:block flex-shrink-0">
                            <p className="text-green-400 text-xs font-medium tabular-nums">₹{b.advance?.toFixed(2)}</p>
                            <p className="text-slate-600 text-[10px]">Paid</p>
                          </div>

                          {/* Due / Refund */}
                          <div className="text-right flex-shrink-0">
                            <p className={`text-xs font-bold tabular-nums ${b.dueAmount > 0 ? 'text-red-400' : 'text-green-400'}`}>
                              {b.dueAmount > 0 ? `-₹${b.dueAmount.toFixed(2)}` : `+₹${Math.abs(b.dueAmount).toFixed(2)}`}
                            </p>
                            <p className="text-slate-600 text-[10px]">{b.dueAmount > 0 ? 'Due' : 'Refund'}</p>
                          </div>

                          {/* Toggle button */}
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ml-1"
                            style={{ background: isBillOpen ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${isBillOpen ? 'rgba(34,197,94,0.22)' : 'rgba(255,255,255,0.08)'}` }}>
                            <ReceiptText size={13} className={isBillOpen ? 'text-green-400' : 'text-slate-500'} />
                          </div>
                        </div>

                        {/* Bill breakdown */}
                        {isBillOpen && (
                          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.15)' }}>
                            <BillBreakdown b={b} memberPays={memberPays} isLoading={isLoadingPay} />
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
  );
}
