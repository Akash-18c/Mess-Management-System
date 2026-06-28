import React, { useEffect, useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, X, ShoppingCart, Layers, ChevronDown, Pencil, Calendar, Search } from 'lucide-react';
import api from '../../api';

const now = new Date();
const MONTHS_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const OTHER_CATS = [
  { id: 'Gas Cylinder', emoji: '🔥', label: 'Gas Cylinder' },
  { id: 'Rice Bag',     emoji: '🌾', label: 'Rice Bag'     },
  { id: 'Other',        emoji: '📦', label: 'Other'        },
];

const EMPTY_G = { item:'', unitPrice:'', buyerName:'', date: now.toISOString().slice(0,10), meal:'Lunch' };
const EMPTY_O = { categoryName:'Gas Cylinder', description:'', amount:'', paidBy:'', date: now.toISOString().slice(0,10), note:'', status:'Due' };

const glass = {
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(40px)',
  WebkitBackdropFilter: 'blur(40px)',
  border: '1px solid rgba(255,255,255,0.10)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)',
};

const modalGlass = {
  background: 'rgba(10,15,30,0.92)',
  backdropFilter: 'blur(48px)',
  WebkitBackdropFilter: 'blur(48px)',
  border: '1px solid rgba(255,255,255,0.12)',
  boxShadow: '0 24px 64px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08)',
};

function StatusBadge({ status, onClick }) {
  const isPaid = status === 'Paid';
  return (
    <button
      onClick={onClick}
      className="text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0"
      style={{
        background: isPaid ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)',
        color: isPaid ? '#34d399' : '#f87171',
        border: isPaid ? '1px solid rgba(52,211,153,0.25)' : '1px solid rgba(248,113,113,0.25)',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {isPaid ? '✓ Paid' : '⏳ Due'}
    </button>
  );
}

export default function ManagerExpenses() {
  const [month,      setMonth]      = useState(now.getMonth() + 1);
  const [year,       setYear]       = useState(now.getFullYear());
  const [tab,        setTab]        = useState('grocery');
  const [groceries,  setGroceries]  = useState([]);
  const [others,     setOthers]     = useState([]);
  const [selDate,    setSelDate]    = useState('all');
  const [dateOpen,   setDateOpen]   = useState(false);
  const [monthOpen,  setMonthOpen]  = useState(false);
  const [modal,      setModal]      = useState(false);
  const [editId,     setEditId]     = useState(null);
  const [form,       setForm]       = useState(EMPTY_G);
  const [loading,    setLoading]    = useState(false);
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

  const f = v => setForm(p => ({ ...p, ...v }));

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

  // group by date (to show lunch and dinner side by side)
  const buildDateGroups = (list) => {
    const dateGroups = {};
    list.forEach(g => {
      const date = g.date?.slice(0,10);
      if (!dateGroups[date]) dateGroups[date] = { date, lunch: [], dinner: [] };
      const meal = g.meal || 'Lunch';
      if (meal === 'Lunch') dateGroups[date].lunch.push(g);
      else dateGroups[date].dinner.push(g);
    });
    return Object.values(dateGroups).sort((a, b) => b.date.localeCompare(a.date));
  };

  const selectedDateLabel = selDate === 'all' ? 'All Dates' : new Date(selDate+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
  const groups = buildGroups(filteredGroceries);
  const dateGroups = buildDateGroups(filteredGroceries);

  // month options: current month + past 12
  const monthOpts = [];
  for (let i = 0; i <= 12; i++) {
    let m = now.getMonth() + 1 - i, y = now.getFullYear();
    while (m <= 0) { m += 12; y--; }
    monthOpts.push({ m, y });
  }

  const gTotal = filteredGroceries.reduce((s,g) => s + (g.total||g.unitPrice||0), 0);
  const oTotal = filteredOthers.reduce((s,o) => s + o.amount, 0);

  const openAdd = () => {
    setEditId(null);
    setForm(tab === 'grocery' ? EMPTY_G : EMPTY_O);
    setModal(true);
  };

  const openEdit = (o) => {
    setEditId(o._id);
    setForm({ categoryName: o.categoryName || 'Gas Cylinder', description: o.description || '', amount: o.amount, paidBy: o.paidBy || '', date: o.date?.slice(0,10) || now.toISOString().slice(0,10), note: o.note || '', status: o.status || 'Due' });
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // close modal instantly for fast feel
    setModal(false);
    try {
      if (tab === 'grocery') {
        await api.post('/expenses/grocery', { item: form.item, unitPrice: +form.unitPrice, buyerName: form.buyerName, date: form.date, meal: form.meal, month, year });
        toast.success('Grocery added');
      } else if (editId) {
        await api.put(`/expenses/other/${editId}`, { ...form, amount: +form.amount });
        toast.success('Updated');
      } else {
        const payload = { categoryName: form.categoryName, description: form.description, amount: +form.amount, paidBy: form.paidBy, date: form.date, note: form.note, status: form.status, month, year };
        await api.post('/expenses/other', payload);
        toast.success('Expense added');
      }
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
      setModal(true); // reopen on error
    } finally {
      setLoading(false);
    }
  };

  const del = async (id, type) => {
    if (!window.confirm('Delete this entry?')) return;
    await api.delete(`/expenses/${type}/${id}`);
    toast.success('Deleted');
    load();
  };

  const toggleStatus = async (o) => {
    await api.put(`/expenses/other/${o._id}`, { status: o.status === 'Paid' ? 'Due' : 'Paid' });
    load();
  };

  return (
    <div className="space-y-4 pb-8">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3 rounded-2xl p-4" style={glass}>
        <div className="min-w-0">
          <h1 className="text-base md:text-lg font-bold text-white leading-tight">Expenses</h1>
          <p className="text-[11px] text-slate-500 mt-0.5">Grocery &amp; other expenses</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 text-sm font-semibold text-white px-4 py-2.5 rounded-xl active:scale-95 flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#10b981,#059669)', WebkitTapHighlightColor: 'transparent', transition: 'transform 0.1s', boxShadow: '0 4px 14px rgba(16,185,129,0.35)' }}
        >
          <Plus size={15} /> Add Expense
        </button>
      </div>

      {/* ── Month + Date selectors row ── */}
      <div className="flex gap-2">

        {/* Month picker */}
        <div className="relative flex-1" ref={monthRef}>
          <button onClick={() => { setMonthOpen(o => !o); setDateOpen(false); }}
            className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold"
            style={{ ...glass, WebkitTapHighlightColor: 'transparent' }}>
            <div className="flex items-center gap-2 min-w-0">
              <Calendar size={13} style={{ color: '#10b981', flexShrink: 0 }} />
              <span className="text-white truncate">{MONTHS_FULL[month-1]} {year}</span>
            </div>
            <ChevronDown size={12} className={`text-slate-500 flex-shrink-0 transition-transform ${monthOpen ? 'rotate-180' : ''}`} />
          </button>
          {monthOpen && (
            <div className="absolute left-0 top-full mt-1.5 z-[100] rounded-xl overflow-hidden w-44"
              style={{ background: 'rgba(8,14,28,0.98)', border: '1px solid rgba(16,185,129,0.25)', boxShadow: '0 16px 40px rgba(0,0,0,0.8)', backdropFilter: 'blur(40px)' }}>
              <div className="px-3 py-2 border-b border-white/5" style={{ background: 'rgba(16,185,129,0.10)' }}>
                <p className="text-[9px] font-bold uppercase tracking-widest text-green-400">Select Month</p>
              </div>
              <div className="overflow-y-auto max-h-52" style={{ scrollbarWidth: 'thin' }}>
                {monthOpts.map(({ m, y }) => {
                  const isSel = m === month && y === year;
                  return (
                    <button key={`${m}-${y}`}
                      onClick={() => { setMonth(m); setYear(y); setMonthOpen(false); setSelDate('all'); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs"
                      style={{ background: isSel ? 'rgba(16,185,129,0.15)' : 'transparent', borderLeft: isSel ? '2px solid #10b981' : '2px solid transparent', borderBottom: '1px solid rgba(255,255,255,0.04)', color: isSel ? '#86efac' : '#cbd5e1', WebkitTapHighlightColor: 'transparent' }}>
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: isSel ? '#10b981' : '#334155' }} />
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
            className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold"
            style={{ ...glass, WebkitTapHighlightColor: 'transparent' }}>
            <div className="flex items-center gap-2 min-w-0">
              <Search size={13} className="text-slate-400 flex-shrink-0" />
              <span className="text-white truncate">{selDate === 'all' ? 'All Dates' : new Date(selDate+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</span>
            </div>
            <ChevronDown size={12} className={`text-slate-500 flex-shrink-0 transition-transform ${dateOpen ? 'rotate-180' : ''}`} />
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
                  const label = new Date(d+'T00:00:00').toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'});
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

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Grocery', value: gTotal, color: '#34d399', bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.20)', icon: '🛒' },
          { label: 'Other',   value: oTotal, color: '#fbbf24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.20)', icon: '📦' },
          { label: 'Total',   value: gTotal + oTotal, color: '#60a5fa', bg: 'rgba(96,165,250,0.08)', border: 'rgba(96,165,250,0.20)', icon: '💰' },
        ].map(({ label, value, color, bg, border, icon }) => (
          <div key={label} className="rounded-2xl p-3" style={{ background: bg, border: `1px solid ${border}`, backdropFilter: 'blur(40px)' }}>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-base">{icon}</span>
              <p className="text-[11px] font-medium text-slate-400">{label}</p>
            </div>
            <p className="text-lg font-bold" style={{ color }}>₹{value.toFixed(0)}</p>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 rounded-xl p-1" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        {[
          { key: 'grocery', label: 'Grocery', icon: <ShoppingCart size={13} />, active: 'rgba(16,185,129,0.20)', border: 'rgba(16,185,129,0.40)', color: '#34d399' },
          { key: 'other',   label: 'Other',   icon: <Layers size={13} />,       active: 'rgba(245,158,11,0.20)', border: 'rgba(245,158,11,0.40)', color: '#fbbf24' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold flex-1 justify-center transition-all"
            style={{
              background: tab === t.key ? t.active : 'transparent',
              border: tab === t.key ? `1px solid ${t.border}` : '1px solid transparent',
              color: tab === t.key ? t.color : '#64748b',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── List ── */}
      <div className="space-y-3">
        {tab === 'grocery' ? (
          filteredGroceries.length === 0
            ? <div className="rounded-xl py-10 text-center text-slate-500 text-sm" style={glass}>No grocery entries {selDate !== 'all' ? 'for this date' : 'this month'}</div>
            : dateGroups.map(dateGroup => (
                <div key={dateGroup.date} className="space-y-2">
                  {/* Date header */}
                  <div className="px-1 py-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      {new Date(dateGroup.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  {/* Lunch and Dinner side by side */}
                  <div className="grid grid-cols-2 gap-2 md:gap-3">
                    {/* Lunch Card */}
                    {dateGroup.lunch.length > 0 && (
                      <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: 'rgba(251,191,36,0.18)' }}>
                        {/* Card header */}
                        <div className="flex items-center gap-1.5 px-3 py-2" style={{ background: 'rgba(251,191,36,0.08)', borderBottom: '1px solid rgba(251,191,36,0.18)' }}>
                          <span className="text-sm">☀️</span>
                          <span className="text-xs font-bold" style={{ color: '#fbbf24' }}>Lunch</span>
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full ml-auto" style={{ background: 'rgba(255,255,255,0.06)', color: '#64748b' }}>{dateGroup.lunch.length}</span>
                        </div>
                        {/* Items */}
                        <div className="divide-y divide-white/5">
                          {dateGroup.lunch.map((g, idx) => (
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
                          <span className="text-xs font-bold" style={{ color: '#fbbf24' }}>₹{dateGroup.lunch.reduce((s, g) => s + (g.total || g.unitPrice || 0), 0).toFixed(0)}</span>
                        </div>
                      </div>
                    )}

                    {/* Dinner Card */}
                    {dateGroup.dinner.length > 0 && (
                      <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: 'rgba(139,92,246,0.18)' }}>
                        {/* Card header */}
                        <div className="flex items-center gap-1.5 px-3 py-2" style={{ background: 'rgba(139,92,246,0.08)', borderBottom: '1px solid rgba(139,92,246,0.18)' }}>
                          <span className="text-sm">🌙</span>
                          <span className="text-xs font-bold" style={{ color: '#a78bfa' }}>Dinner</span>
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full ml-auto" style={{ background: 'rgba(255,255,255,0.06)', color: '#64748b' }}>{dateGroup.dinner.length}</span>
                        </div>
                        {/* Items */}
                        <div className="divide-y divide-white/5">
                          {dateGroup.dinner.map((g, idx) => (
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
                          <span className="text-xs font-bold" style={{ color: '#a78bfa' }}>₹{dateGroup.dinner.reduce((s, g) => s + (g.total || g.unitPrice || 0), 0).toFixed(0)}</span>
                        </div>
                      </div>
                    )}

                    {/* Empty state if both are empty */}
                    {dateGroup.lunch.length === 0 && dateGroup.dinner.length === 0 && (
                      <div className="rounded-xl py-4 text-center text-slate-500 text-xs" style={glass}>No meals</div>
                    )}
                  </div>
                </div>
              ))
        ) : (
          filteredOthers.length === 0
            ? <div className="rounded-xl py-10 text-center text-slate-500 text-sm" style={glass}>No other expenses {selDate !== 'all' ? 'for this date' : 'this month'}</div>
            : filteredOthers.map(o => {
              const cat = OTHER_CATS.find(c => c.id === o.categoryName) || OTHER_CATS[2];
              return (
                <div key={o._id} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={glass}>
                  <span className="text-sm flex-shrink-0">{cat.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-200 text-xs font-semibold truncate">{cat.label}</span>
                      {o.description && <span className="text-[9px] text-slate-500 truncate hidden sm:block">· {o.description}</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] text-slate-600">{new Date(o.date).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}</span>
                      {o.paidBy && <span className="text-[9px] text-slate-600">· {o.paidBy}</span>}
                    </div>
                  </div>
                  <button onClick={() => { const newStatus = o.status === 'Paid' ? 'Due' : 'Paid'; api.put(`/expenses/other/${o._id}`, { status: newStatus }); load(); }} className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: o.status === 'Paid' ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)', color: o.status === 'Paid' ? '#34d399' : '#f87171', border: o.status === 'Paid' ? '1px solid rgba(52,211,153,0.25)' : '1px solid rgba(248,113,113,0.25)' }}>
                    {o.status === 'Paid' ? '✓ Paid' : '⏳ Due'}
                  </button>
                  <span className="text-xs font-bold text-amber-400 flex-shrink-0">₹{o.amount.toFixed(0)}</span>
                  <button onClick={() => { setEditId(o._id); setForm({ categoryName: o.categoryName || 'Gas Cylinder', description: o.description || '', amount: o.amount, paidBy: o.paidBy || '', date: o.date?.slice(0,10) || now.toISOString().slice(0,10), note: o.note || '', status: o.status || 'Due' }); setModal(true); }} className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(96,165,250,0.10)' }}>
                    <Pencil size={11} className="text-blue-400" />
                  </button>
                  <button onClick={() => { if (window.confirm('Delete?')) { api.delete(`/expenses/other/${o._id}`); toast.success('Deleted'); load(); } }} className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(248,113,113,0.10)' }}>
                    <Trash2 size={11} className="text-red-400" />
                  </button>
                </div>
              );
            })
        )}
      </div>

      {/* ── Modal ── */}
      {modal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden" style={modalGlass}>
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <h2 className="font-bold text-white text-sm">
                {tab === 'grocery' ? '🛒 Add Grocery' : editId ? '✏️ Edit Expense' : '📦 Add Expense'}
              </h2>
              <button onClick={() => setModal(false)} className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400" style={{ background: 'rgba(255,255,255,0.06)', WebkitTapHighlightColor: 'transparent' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3 overflow-y-auto max-h-[80vh]">
              {tab === 'grocery' ? (
                <>
                  <div>
                    <label className="label text-xs">Item Name</label>
                    <input className="input" placeholder="e.g. Rice, Tomato, Oil…" value={form.item} onChange={e => f({ item: e.target.value })} required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label text-xs">Total Price (₹)</label>
                      <input className="input" type="number" step="0.01" min="0" placeholder="0.00" value={form.unitPrice} onChange={e => f({ unitPrice: e.target.value })} required />
                    </div>
                    <div>
                      <label className="label text-xs">Date</label>
                      <input className="input" type="date" value={form.date} onChange={e => f({ date: e.target.value })} required />
                    </div>
                  </div>
                  <div>
                    <label className="label text-xs mb-2">Meal</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Lunch','Dinner'].map(m => (
                        <button key={m} type="button" onClick={() => f({ meal: m })}
                          className="py-2.5 rounded-xl text-xs font-bold transition-all"
                          style={{
                            background: form.meal===m ? (m==='Lunch'?'rgba(251,191,36,0.15)':'rgba(139,92,246,0.15)') : 'rgba(255,255,255,0.04)',
                            border: form.meal===m ? (m==='Lunch'?'1px solid rgba(251,191,36,0.4)':'1px solid rgba(139,92,246,0.4)') : '1px solid rgba(255,255,255,0.08)',
                            color: form.meal===m ? (m==='Lunch'?'#fbbf24':'#a78bfa') : '#64748b',
                            WebkitTapHighlightColor: 'transparent',
                          }}
                        >
                          {m==='Lunch' ? '☀️ Lunch' : '🌙 Dinner'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="label text-xs">Buyer <span className="text-slate-600">(optional)</span></label>
                    <input className="input" placeholder="Who bought?" value={form.buyerName} onChange={e => f({ buyerName: e.target.value })} />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="label text-xs mb-2">Category</label>
                    <div className="grid grid-cols-3 gap-2">
                      {OTHER_CATS.map(cat => (
                        <button key={cat.id} type="button" onClick={() => f({ categoryName: cat.id })}
                          className="flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all"
                          style={{
                            background: form.categoryName === cat.id ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)',
                            border: form.categoryName === cat.id ? '1px solid rgba(16,185,129,0.40)' : '1px solid rgba(255,255,255,0.08)',
                            WebkitTapHighlightColor: 'transparent',
                          }}
                        >
                          <span className="text-xl">{cat.emoji}</span>
                          <span className="text-[10px] font-semibold" style={{ color: form.categoryName === cat.id ? '#34d399' : '#64748b' }}>{cat.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="label text-xs">Description <span className="text-slate-600">(optional)</span></label>
                    <input className="input" placeholder="e.g. 14kg refill…" value={form.description} onChange={e => f({ description: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label text-xs">Amount (₹)</label>
                      <input className="input" type="number" step="0.01" min="0" placeholder="0.00" value={form.amount} onChange={e => f({ amount: e.target.value })} required />
                    </div>
                    <div>
                      <label className="label text-xs">Date</label>
                      <input className="input" type="date" value={form.date} onChange={e => f({ date: e.target.value })} required />
                    </div>
                    <div>
                      <label className="label text-xs">Paid By <span className="text-slate-600">(optional)</span></label>
                      <input className="input" placeholder="Name…" value={form.paidBy} onChange={e => f({ paidBy: e.target.value })} />
                    </div>
                    <div>
                      <label className="label text-xs">Note <span className="text-slate-600">(optional)</span></label>
                      <input className="input" placeholder="Any note…" value={form.note} onChange={e => f({ note: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="label text-xs mb-2">Payment Status</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Due','Paid'].map(s => (
                        <button key={s} type="button" onClick={() => f({ status: s })}
                          className="py-2.5 rounded-xl text-xs font-bold transition-all"
                          style={{
                            background: form.status === s ? (s === 'Paid' ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)') : 'rgba(255,255,255,0.04)',
                            border: form.status === s ? (s === 'Paid' ? '1px solid rgba(52,211,153,0.40)' : '1px solid rgba(248,113,113,0.40)') : '1px solid rgba(255,255,255,0.08)',
                            color: form.status === s ? (s === 'Paid' ? '#34d399' : '#f87171') : '#64748b',
                            WebkitTapHighlightColor: 'transparent',
                          }}
                        >
                          {s === 'Paid' ? '✓ Paid' : '⏳ Due'}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1 text-sm">Cancel</button>
                <button type="submit" className="btn-primary flex-1 text-sm" disabled={loading}>
                  {loading ? 'Saving…' : editId ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
