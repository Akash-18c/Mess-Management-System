import React, { useEffect, useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { ChevronDown, Trash2, Pencil, X, ShoppingCart, Layers, Calendar, Search } from 'lucide-react';
import api from '../../api';

const MONTHS_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const OTHER_CATS  = [
  { id: 'Gas Cylinder', emoji: '🔥', label: 'Gas Cylinder' },
  { id: 'Rice Bag',     emoji: '🌾', label: 'Rice Bag'     },
  { id: 'Other',        emoji: '📦', label: 'Other'        },
];

const glass = {
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(40px)',
  WebkitBackdropFilter: 'blur(40px)',
  border: '1px solid rgba(255,255,255,0.10)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)',
};

const modalGlass = {
  background: 'rgba(10,15,30,0.95)',
  backdropFilter: 'blur(48px)',
  WebkitBackdropFilter: 'blur(48px)',
  border: '1px solid rgba(255,255,255,0.12)',
  boxShadow: '0 24px 64px rgba(0,0,0,0.8)',
};

function StatusBadge({ status, onClick }) {
  const isPaid = status === 'Paid';
  return (
    <button onClick={onClick}
      className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
      style={{
        background: isPaid ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)',
        color: isPaid ? '#34d399' : '#f87171',
        border: isPaid ? '1px solid rgba(52,211,153,0.25)' : '1px solid rgba(248,113,113,0.25)',
        WebkitTapHighlightColor: 'transparent',
      }}>
      {isPaid ? '✓ Paid' : '⏳ Due'}
    </button>
  );
}

export default function AdminExpensesHistory() {
  const now = new Date();
  const [month,      setMonth]      = useState(now.getMonth() + 1);
  const [year,       setYear]       = useState(now.getFullYear());
  const [tab,        setTab]        = useState('grocery');
  const [groceries,  setGroceries]  = useState([]);
  const [others,     setOthers]     = useState([]);
  const [selDate,    setSelDate]    = useState('all');
  const [dateOpen,   setDateOpen]   = useState(false);
  const [monthOpen,  setMonthOpen]  = useState(false);
  const [editModal,  setEditModal]  = useState(false);
  const [editItem,   setEditItem]   = useState(null);
  const [editForm,   setEditForm]   = useState({});
  const dateRef  = useRef(null);
  const monthRef = useRef(null);

  // close dropdowns on outside click
  useEffect(() => {
    const h = e => {
      if (dateRef.current  && !dateRef.current.contains(e.target))  setDateOpen(false);
      if (monthRef.current && !monthRef.current.contains(e.target)) setMonthOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const load = useCallback(() => {
    api.get(`/expenses/grocery/${month}/${year}`).then(r => setGroceries(r.data)).catch(() => {});
    api.get(`/expenses/other/${month}/${year}`).then(r => setOthers(r.data)).catch(() => {});
  }, [month, year]);

  useEffect(() => { load(); setSelDate('all'); }, [load]);

  // unique sorted dates for dropdown
  const dates = [...new Set(
    (tab === 'grocery' ? groceries : others).map(e => e.date?.slice(0, 10)).filter(Boolean)
  )].sort((a, b) => b.localeCompare(a));

  // filter by selected date
  const filteredGroceries = selDate === 'all' ? groceries : groceries.filter(g => g.date?.slice(0,10) === selDate);
  const filteredOthers    = selDate === 'all' ? others    : others.filter(o => o.date?.slice(0,10) === selDate);

  // group groceries by date+meal
  const buildGroups = (list) => {
    const groups = []; const seen = {};
    list.forEach(g => {
      const key = `${g.date?.slice(0,10)}_${g.meal || 'Lunch'}`;
      if (!seen[key]) { seen[key] = { key, date: g.date?.slice(0,10), meal: g.meal || 'Lunch', items: [] }; groups.push(seen[key]); }
      seen[key].items.push(g);
    });
    return groups;
  };

  const gTotal = filteredGroceries.reduce((s,g) => s + (g.total||g.unitPrice||0), 0);
  const oTotal = filteredOthers.reduce((s,o) => s + o.amount, 0);

  const del = async (id, type) => {
    if (!window.confirm('Delete?')) return;
    await api.delete(`/expenses/${type}/${id}`);
    toast.success('Deleted'); load();
  };

  const toggleStatus = async (o) => {
    await api.put(`/expenses/other/${o._id}`, { status: o.status === 'Paid' ? 'Due' : 'Paid' });
    load();
  };

  const openEdit = (o) => {
    setEditItem(o);
    setEditForm({ categoryName: o.categoryName||'Gas Cylinder', description: o.description||'', amount: o.amount, paidBy: o.paidBy||'', date: o.date?.slice(0,10)||'', note: o.note||'', status: o.status||'Due' });
    setEditModal(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    await api.put(`/expenses/other/${editItem._id}`, { ...editForm, amount: +editForm.amount });
    toast.success('Updated'); setEditModal(false); load();
  };

  const selectedDateLabel = selDate === 'all' ? 'All Dates' : new Date(selDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const groups = buildGroups(filteredGroceries);

  // month options: current month + past 12
  const monthOpts = [];
  for (let i = 0; i <= 12; i++) {
    let m = now.getMonth() + 1 - i, y = now.getFullYear();
    while (m <= 0) { m += 12; y--; }
    monthOpts.push({ m, y });
  }

  return (
    <div className="space-y-3 pb-8">

      {/* ── Header ── */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(20,184,166,0.15)', border: '1px solid rgba(20,184,166,0.25)' }}>
          <ShoppingCart size={15} style={{ color: '#2dd4bf' }} />
        </div>
        <div>
          <h1 className="text-base font-bold text-white leading-tight">Expenses History</h1>
          <p className="text-[10px] text-slate-500">Browse by month &amp; date</p>
        </div>
      </div>

      {/* ── Month + Date selectors row ── */}
      <div className="flex gap-1.5 md:gap-2">

        {/* Month picker */}
        <div className="relative flex-1" ref={monthRef}>
          <button onClick={() => { setMonthOpen(o => !o); setDateOpen(false); }}
            className="w-full flex items-center justify-between gap-1 md:gap-2 px-2 py-1.5 md:px-3 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-xs font-semibold"
            style={{ ...glass, WebkitTapHighlightColor: 'transparent' }}>
            <div className="flex items-center gap-1 md:gap-1.5 min-w-0">
              <Calendar size={10} className="md:block hidden" style={{ color: '#2dd4bf', flexShrink: 0 }} />
              <span className="text-white truncate text-[10px] md:text-xs">{MONTHS_FULL[month-1].slice(0,3)}</span>
            </div>
            <ChevronDown size={9} className={`text-slate-500 flex-shrink-0 transition-transform hidden md:block ${monthOpen ? 'rotate-180' : ''}`} />
          </button>
          {monthOpen && (
            <div className="absolute left-0 top-full mt-1.5 z-[100] rounded-xl overflow-hidden w-44"
              style={{ background: 'rgba(8,14,28,0.98)', border: '1px solid rgba(20,184,166,0.20)', boxShadow: '0 16px 40px rgba(0,0,0,0.8)', backdropFilter: 'blur(40px)' }}>
              <div className="px-3 py-2 border-b border-white/5" style={{ background: 'rgba(20,184,166,0.07)' }}>
                <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: '#2dd4bf' }}>Select Month</p>
              </div>
              <div className="overflow-y-auto max-h-52" style={{ scrollbarWidth: 'thin' }}>
                {monthOpts.map(({ m, y }) => {
                  const isSel = m === month && y === year;
                  return (
                    <button key={`${m}-${y}`}
                      onClick={() => { setMonth(m); setYear(y); setMonthOpen(false); setSelDate('all'); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs"
                      style={{ background: isSel ? 'rgba(20,184,166,0.12)' : 'transparent', borderLeft: isSel ? '2px solid #14b8a6' : '2px solid transparent', borderBottom: '1px solid rgba(255,255,255,0.04)', color: isSel ? '#2dd4bf' : '#cbd5e1', WebkitTapHighlightColor: 'transparent' }}>
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: isSel ? '#2dd4bf' : '#334155' }} />
                      {MONTHS_FULL[m-1].slice(0,3)} {y}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Date picker */}
        <div className="relative flex-1" ref={dateRef}>
          <button onClick={() => { setDateOpen(o => !o); setMonthOpen(false); }}
            className="w-full flex items-center justify-between gap-1 md:gap-2 px-2 py-1.5 md:px-3 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-xs font-semibold"
            style={{ ...glass, WebkitTapHighlightColor: 'transparent' }}>
            <div className="flex items-center gap-1 md:gap-1.5 min-w-0">
              <Search size={10} className="text-slate-400 flex-shrink-0 hidden md:block" />
              <span className="text-white truncate text-[10px] md:text-xs">{selDate === 'all' ? 'All' : new Date(selDate+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</span>
            </div>
            <ChevronDown size={9} className={`text-slate-500 flex-shrink-0 transition-transform hidden md:block ${dateOpen ? 'rotate-180' : ''}`} />
          </button>
          {dateOpen && (
            <div className="absolute right-0 top-full mt-1.5 z-[100] rounded-xl overflow-hidden w-48"
              style={{ background: 'rgba(8,14,28,0.98)', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 16px 40px rgba(0,0,0,0.8)', backdropFilter: 'blur(40px)' }}>
              <div className="px-3 py-2 border-b border-white/5" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Filter by Date</p>
              </div>
              <div className="overflow-y-auto max-h-52" style={{ scrollbarWidth: 'thin' }}>
                {/* All option */}
                <button onClick={() => { setSelDate('all'); setDateOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs"
                  style={{ background: selDate === 'all' ? 'rgba(255,255,255,0.07)' : 'transparent', borderLeft: selDate === 'all' ? '2px solid #64748b' : '2px solid transparent', borderBottom: '1px solid rgba(255,255,255,0.04)', color: selDate === 'all' ? '#e2e8f0' : '#94a3b8', WebkitTapHighlightColor: 'transparent' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500 flex-shrink-0" />
                  All Dates
                </button>
                {dates.length === 0 && (
                  <p className="text-[10px] text-slate-600 text-center py-4">No entries this month</p>
                )}
                {dates.map(d => {
                  const isSel = selDate === d;
                  const label = new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
                  return (
                    <button key={d} onClick={() => { setSelDate(d); setDateOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs"
                      style={{ background: isSel ? 'rgba(96,165,250,0.10)' : 'transparent', borderLeft: isSel ? '2px solid #60a5fa' : '2px solid transparent', borderBottom: '1px solid rgba(255,255,255,0.04)', color: isSel ? '#93c5fd' : '#94a3b8', WebkitTapHighlightColor: 'transparent' }}>
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: isSel ? '#60a5fa' : '#334155' }} />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Totals strip ── */}
      <div className="grid grid-cols-3 gap-1.5 md:gap-2">
        {[
          { label: 'Grocery', val: gTotal, c: '#34d399' },
          { label: 'Other',   val: oTotal, c: '#fbbf24' },
          { label: 'Total',   val: gTotal + oTotal, c: '#60a5fa' },
        ].map(({ label, val, c }) => (
          <div key={label} className="rounded-lg md:rounded-xl px-2 md:px-3 py-1.5 md:py-2" style={glass}>
            <p className="text-[8px] md:text-[9px] text-slate-500 mb-0.5">{label}</p>
            <p className="text-xs md:text-sm font-bold truncate" style={{ color: c }}>₹{val.toFixed(0)}</p>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 rounded-xl p-1" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        {[
          { key: 'grocery', label: 'Grocery', icon: <ShoppingCart size={12} />, ac: '#34d399', ab: 'rgba(16,185,129,0.20)', abr: 'rgba(16,185,129,0.40)' },
          { key: 'other',   label: 'Other',   icon: <Layers size={12} />,       ac: '#fbbf24', ab: 'rgba(245,158,11,0.20)', abr: 'rgba(245,158,11,0.40)' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold flex-1 justify-center transition-all"
            style={{ background: tab === t.key ? t.ab : 'transparent', border: tab === t.key ? `1px solid ${t.abr}` : '1px solid transparent', color: tab === t.key ? t.ac : '#64748b', WebkitTapHighlightColor: 'transparent' }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── Grocery list ── */}
      {tab === 'grocery' && (
        <div className="space-y-3">
          {groups.length === 0
            ? <div className="rounded-xl py-10 text-center text-slate-500 text-xs" style={glass}>No grocery entries {selDate !== 'all' ? 'for this date' : 'this month'}</div>
            : (() => {
                // Group by date, then by meal
                const dateGroups = {};
                groups.forEach(g => {
                  const date = g.date;
                  if (!dateGroups[date]) dateGroups[date] = { date, lunch: [], dinner: [] };
                  if (g.meal === 'Lunch') dateGroups[date].lunch.push(g);
                  else dateGroups[date].dinner.push(g);
                });
                return Object.values(dateGroups).map(dateGroup => (
                  <div key={dateGroup.date} className="space-y-2">
                    {/* Date header */}
                    <div className="px-1 py-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        {new Date(dateGroup.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    {/* Lunch and Dinner side by side */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 md:gap-3">
                      {/* Lunch Card */}
                      {dateGroup.lunch.length > 0 && dateGroup.lunch.map(group => {
                        const groupTotal = group.items.reduce((s,g) => s+(g.total||g.unitPrice||0), 0);
                        return (
                          <div key={group.key} className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(251,191,36,0.18)' }}>
                            {/* Card header */}
                            <div className="flex items-center gap-1.5 px-3 py-2" style={{ background: 'rgba(251,191,36,0.08)', borderBottom: '1px solid rgba(251,191,36,0.18)' }}>
                              <span className="text-sm">☀️</span>
                              <span className="text-xs font-bold" style={{ color: '#fbbf24' }}>Lunch</span>
                              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full ml-auto" style={{ background: 'rgba(255,255,255,0.06)', color: '#64748b' }}>{group.items.length}</span>
                            </div>
                            {/* Items */}
                            <div className="divide-y divide-white/5">
                              {group.items.map((g) => (
                                <div key={g._id} className="flex items-center gap-2 px-3 py-2 text-[11px]">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-slate-200 font-medium truncate">{g.item}</p>
                                    {g.buyerName && <p className="text-[9px] text-slate-500 truncate">{g.buyerName}</p>}
                                  </div>
                                  <span className="text-green-400 font-bold flex-shrink-0">₹{(g.total || g.unitPrice || 0).toFixed(0)}</span>
                                  <button onClick={() => { if (window.confirm('Delete?')) { api.delete(`/expenses/grocery/${g._id}`); toast.success('Deleted'); load(); } }} className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(248,113,113,0.10)' }}>
                                    <Trash2 size={10} className="text-red-400" />
                                  </button>
                                </div>
                              ))}
                            </div>
                            {/* Total */}
                            <div className="flex items-center justify-between px-3 py-2" style={{ background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(251,191,36,0.18)' }}>
                              <span className="text-[9px] font-semibold text-slate-600">Total</span>
                              <span className="text-xs font-bold" style={{ color: '#fbbf24' }}>₹{groupTotal.toFixed(0)}</span>
                            </div>
                          </div>
                        );
                      })}

                      {/* Dinner Card */}
                      {dateGroup.dinner.length > 0 && dateGroup.dinner.map(group => {
                        const groupTotal = group.items.reduce((s,g) => s+(g.total||g.unitPrice||0), 0);
                        return (
                          <div key={group.key} className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.18)' }}>
                            {/* Card header */}
                            <div className="flex items-center gap-1.5 px-3 py-2" style={{ background: 'rgba(139,92,246,0.08)', borderBottom: '1px solid rgba(139,92,246,0.18)' }}>
                              <span className="text-sm">🌙</span>
                              <span className="text-xs font-bold" style={{ color: '#a78bfa' }}>Dinner</span>
                              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full ml-auto" style={{ background: 'rgba(255,255,255,0.06)', color: '#64748b' }}>{group.items.length}</span>
                            </div>
                            {/* Items */}
                            <div className="divide-y divide-white/5">
                              {group.items.map((g) => (
                                <div key={g._id} className="flex items-center gap-2 px-3 py-2 text-[11px]">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-slate-200 font-medium truncate">{g.item}</p>
                                    {g.buyerName && <p className="text-[9px] text-slate-500 truncate">{g.buyerName}</p>}
                                  </div>
                                  <span className="text-green-400 font-bold flex-shrink-0">₹{(g.total || g.unitPrice || 0).toFixed(0)}</span>
                                  <button onClick={() => { if (window.confirm('Delete?')) { api.delete(`/expenses/grocery/${g._id}`); toast.success('Deleted'); load(); } }} className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(248,113,113,0.10)' }}>
                                    <Trash2 size={10} className="text-red-400" />
                                  </button>
                                </div>
                              ))}
                            </div>
                            {/* Total */}
                            <div className="flex items-center justify-between px-3 py-2" style={{ background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(139,92,246,0.18)' }}>
                              <span className="text-[9px] font-semibold text-slate-600">Total</span>
                              <span className="text-xs font-bold" style={{ color: '#a78bfa' }}>₹{groupTotal.toFixed(0)}</span>
                            </div>
                          </div>
                        );
                      })}

                      {/* Empty state if both are empty */}
                      {dateGroup.lunch.length === 0 && dateGroup.dinner.length === 0 && (
                        <div className="rounded-xl py-4 text-center text-slate-500 text-xs col-span-1 sm:col-span-2" style={glass}>No meals</div>
                      )}
                    </div>
                  </div>
                ));
              })()
          }
        </div>
      )}

      {/* ── Other list ── */}
      {tab === 'other' && (
        <div className="space-y-1.5">
          {filteredOthers.length === 0
            ? <div className="rounded-xl py-10 text-center text-slate-500 text-xs" style={glass}>No other expenses {selDate !== 'all' ? 'for this date' : 'this month'}</div>
            : filteredOthers.map(o => {
                const cat = OTHER_CATS.find(c => c.id === o.categoryName) || OTHER_CATS[2];
                return (
                  <div key={o._id} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={glass}>
                    <span className="text-sm flex-shrink-0">{cat.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-200 text-xs font-semibold truncate">{cat.label}</span>
                        {o.description && <span className="text-[9px] text-slate-500 truncate hidden sm:block">· {o.description}</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] text-slate-600">{new Date(o.date).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</span>
                        {o.paidBy && <span className="text-[9px] text-slate-600">· {o.paidBy}</span>}
                      </div>
                    </div>
                    <StatusBadge status={o.status||'Due'} onClick={() => toggleStatus(o)} />
                    <span className="text-xs font-bold text-amber-400 flex-shrink-0">₹{o.amount.toFixed(0)}</span>
                    <button onClick={() => openEdit(o)} className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(96,165,250,0.10)', WebkitTapHighlightColor: 'transparent' }}>
                      <Pencil size={11} className="text-blue-400" />
                    </button>
                    <button onClick={() => del(o._id,'other')} className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(248,113,113,0.10)', WebkitTapHighlightColor: 'transparent' }}>
                      <Trash2 size={11} className="text-red-400" />
                    </button>
                  </div>
                );
              })
          }
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editModal && editItem && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl overflow-hidden" style={modalGlass}>
            <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <h2 className="font-bold text-white text-sm">✏️ Edit Expense</h2>
              <button onClick={() => setEditModal(false)} className="w-7 h-7 flex items-center justify-center rounded-xl text-slate-400" style={{ background: 'rgba(255,255,255,0.06)', WebkitTapHighlightColor: 'transparent' }}>
                <X size={14} />
              </button>
            </div>
            <form onSubmit={handleEdit} className="px-5 py-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label text-xs">Amount (₹)</label>
                  <input className="input" type="number" step="0.01" min="0" value={editForm.amount} onChange={e => setEditForm(p=>({...p,amount:e.target.value}))} required />
                </div>
                <div>
                  <label className="label text-xs">Date</label>
                  <input className="input" type="date" value={editForm.date} onChange={e => setEditForm(p=>({...p,date:e.target.value}))} required />
                </div>
                <div>
                  <label className="label text-xs">Paid By</label>
                  <input className="input" placeholder="Name…" value={editForm.paidBy} onChange={e => setEditForm(p=>({...p,paidBy:e.target.value}))} />
                </div>
                <div>
                  <label className="label text-xs">Status</label>
                  <select className="input" value={editForm.status} onChange={e => setEditForm(p=>({...p,status:e.target.value}))}>
                    <option value="Due">⏳ Due</option>
                    <option value="Paid">✓ Paid</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label text-xs">Description</label>
                <input className="input" placeholder="Optional…" value={editForm.description} onChange={e => setEditForm(p=>({...p,description:e.target.value}))} />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setEditModal(false)} className="btn-secondary flex-1 text-xs">Cancel</button>
                <button type="submit" className="btn-primary flex-1 text-xs">Update</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
