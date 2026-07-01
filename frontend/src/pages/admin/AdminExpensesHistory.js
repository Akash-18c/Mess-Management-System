import React, { useEffect, useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { ChevronDown, Trash2, Pencil, ShoppingCart, Layers, Calendar, Search } from 'lucide-react';
import api from '../../api';
import EditExpenseModal from '../../components/EditExpenseModal';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const OTHER_CATS = [
  { id: 'Gas Cylinder', emoji: '🔥' },
  { id: 'Rice Bag',     emoji: '🌾' },
  { id: 'Other',        emoji: '📦' },
];

const glass = {
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(40px)',
  WebkitBackdropFilter: 'blur(40px)',
  border: '1px solid rgba(255,255,255,0.10)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
};

/* ── Dropdown ── */
function Dropdown({ open, setOpen, label, icon, children, align = 'left' }) {
  const ref = useRef(null);
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [setOpen]);

  return (
    <div className="relative flex-1" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold"
        style={{ ...glass, WebkitTapHighlightColor: 'transparent', minHeight: 40 }}>
        <div className="flex items-center gap-2 min-w-0">
          {icon}
          <span className="text-white truncate">{label}</span>
        </div>
        <ChevronDown size={13} className={`text-slate-500 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className={`absolute top-full mt-2 z-[100] rounded-xl overflow-hidden ${align === 'right' ? 'right-0' : 'left-0'}`}
          style={{
            minWidth: 180, width: 'max-content', maxWidth: '90vw',
            background: 'rgba(8,14,28,0.98)',
            border: '1px solid rgba(20,184,166,0.20)',
            boxShadow: '0 16px 48px rgba(0,0,0,0.85)',
            backdropFilter: 'blur(40px)',
          }}>
          {children}
        </div>
      )}
    </div>
  );
}

/* ── Status Badge ── */
function StatusBadge({ status, onClick }) {
  const paid = status === 'Paid';
  return (
    <button onClick={onClick}
      className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
      style={{
        background: paid ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)',
        color: paid ? '#34d399' : '#f87171',
        border: paid ? '1px solid rgba(52,211,153,0.3)' : '1px solid rgba(248,113,113,0.3)',
        WebkitTapHighlightColor: 'transparent',
      }}>
      {paid ? '✓ Paid' : '⏳ Due'}
    </button>
  );
}

/* ══════════════════════════════════════════════ */
export default function AdminExpensesHistory() {
  const now = new Date();
  const [month,     setMonth]     = useState(now.getMonth() + 1);
  const [year,      setYear]      = useState(now.getFullYear());
  const [tab,       setTab]       = useState('grocery');
  const [groceries, setGroceries] = useState([]);
  const [others,    setOthers]    = useState([]);
  const [selDate,   setSelDate]   = useState('all');
  const [dateOpen,  setDateOpen]  = useState(false);
  const [monthOpen, setMonthOpen] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editType,  setEditType]  = useState('other');
  const [editItem,  setEditItem]  = useState(null);
  const [editForm,  setEditForm]  = useState({});

  const load = useCallback(() => {
    api.get(`/expenses/grocery/${month}/${year}`).then(r => setGroceries(r.data)).catch(() => {});
    api.get(`/expenses/other/${month}/${year}`).then(r => setOthers(r.data)).catch(() => {});
  }, [month, year]);

  useEffect(() => { load(); setSelDate('all'); }, [load]);

  /* month options */
  const monthOpts = [];
  for (let i = 0; i <= 12; i++) {
    let m = now.getMonth() + 1 - i, y = now.getFullYear();
    while (m <= 0) { m += 12; y--; }
    monthOpts.push({ m, y });
  }

  /* unique dates for filter */
  const dates = [...new Set(
    (tab === 'grocery' ? groceries : others).map(e => e.date?.slice(0,10)).filter(Boolean)
  )].sort((a,b) => b.localeCompare(a));

  const filteredGroceries = selDate === 'all' ? groceries : groceries.filter(g => g.date?.slice(0,10) === selDate);
  const filteredOthers    = selDate === 'all' ? others    : others.filter(o => o.date?.slice(0,10) === selDate);

  /* group groceries by date+meal */
  const buildGroups = list => {
    const map = {};
    list.forEach(g => {
      const key = `${g.date?.slice(0,10)}_${g.meal||'Lunch'}`;
      if (!map[key]) map[key] = { key, date: g.date?.slice(0,10), meal: g.meal||'Lunch', items: [] };
      map[key].items.push(g);
    });
    return Object.values(map);
  };

  const gTotal = filteredGroceries.reduce((s,g) => s+(g.total||g.unitPrice||0), 0);
  const oTotal = filteredOthers.reduce((s,o) => s+o.amount, 0);

  /* delete */
  const del = async (id, type) => {
    if (!window.confirm('Delete this entry?')) return;
    await api.delete(`/expenses/${type}/${id}`);
    toast.success('Deleted'); load();
  };

  /* toggle status */
  const toggleStatus = async o => {
    await api.put(`/expenses/other/${o._id}`, { status: o.status === 'Paid' ? 'Due' : 'Paid' });
    load();
  };

  /* open edit */
  const openEdit = (item, type) => {
    setEditType(type);
    setEditItem(item);
    if (type === 'grocery') {
      setEditForm({
        item: item.item, unitPrice: item.unitPrice, quantity: item.quantity||'',
        unit: item.unit||'', meal: item.meal||'Lunch',
        date: item.date?.slice(0,10)||'', buyerName: item.buyerName||'',
      });
    } else {
      setEditForm({
        categoryName: item.categoryName||'Other', description: item.description||'',
        amount: item.amount, paidBy: item.paidBy||'',
        date: item.date?.slice(0,10)||'', status: item.status||'Due',
      });
    }
    setEditModal(true);
  };

  /* submit edit */
  const handleEdit = async e => {
    e.preventDefault();
    if (editType === 'grocery') {
      const qty = parseFloat(editForm.quantity);
      const price = parseFloat(editForm.unitPrice);
      const total = !isNaN(qty) && qty > 0 ? parseFloat((qty * price).toFixed(2)) : price;
      await api.put(`/expenses/grocery/${editItem._id}`, { ...editForm, unitPrice: price, quantity: qty||undefined, total });
    } else {
      await api.put(`/expenses/other/${editItem._id}`, { ...editForm, amount: +editForm.amount });
    }
    toast.success('Updated'); setEditModal(false); load();
  };

  const selDateLabel = selDate === 'all' ? 'All Dates'
    : new Date(selDate+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short'});
  const selMonthLabel = `${MONTHS[month-1].slice(0,3)} ${year}`;
  const groups = buildGroups(filteredGroceries);

  /* group by date for grocery display */
  const dateGroups = {};
  groups.forEach(g => {
    if (!dateGroups[g.date]) dateGroups[g.date] = { lunch:[], dinner:[] };
    if (g.meal === 'Dinner') dateGroups[g.date].dinner.push(g);
    else dateGroups[g.date].lunch.push(g);
  });

  return (
    <div className="space-y-4 pb-10 px-0">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(20,184,166,0.15)', border: '1px solid rgba(20,184,166,0.25)' }}>
          <ShoppingCart size={16} style={{ color: '#2dd4bf' }} />
        </div>
        <div>
          <h1 className="text-base font-bold text-white leading-tight">Expenses History</h1>
          <p className="text-[11px] text-slate-500">Browse by month &amp; date</p>
        </div>
      </div>

      {/* Month + Date dropdowns */}
      <div className="flex gap-2">
        <Dropdown
          open={monthOpen} setOpen={v => { setMonthOpen(v); if(v) setDateOpen(false); }}
          label={selMonthLabel}
          icon={<Calendar size={13} style={{ color: '#2dd4bf', flexShrink: 0 }} />}>
          <div className="px-3 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(20,184,166,0.07)' }}>
            <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: '#2dd4bf' }}>Select Month</p>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: 220, scrollbarWidth: 'thin' }}>
            {monthOpts.map(({ m, y }) => {
              const sel = m === month && y === year;
              return (
                <button key={`${m}-${y}`}
                  onClick={() => { setMonth(m); setYear(y); setMonthOpen(false); setSelDate('all'); }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-left"
                  style={{
                    background: sel ? 'rgba(20,184,166,0.12)' : 'transparent',
                    borderLeft: sel ? '2px solid #14b8a6' : '2px solid transparent',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    color: sel ? '#2dd4bf' : '#cbd5e1',
                    WebkitTapHighlightColor: 'transparent',
                  }}>
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: sel ? '#2dd4bf' : '#334155' }} />
                  {MONTHS[m-1].slice(0,3)} {y}
                </button>
              );
            })}
          </div>
        </Dropdown>

        <Dropdown
          open={dateOpen} setOpen={v => { setDateOpen(v); if(v) setMonthOpen(false); }}
          label={selDateLabel}
          icon={<Search size={13} className="text-slate-400 flex-shrink-0" />}
          align="right">
          <div className="px-3 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)' }}>
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Filter by Date</p>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: 220, scrollbarWidth: 'thin' }}>
            <button onClick={() => { setSelDate('all'); setDateOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs"
              style={{
                background: selDate === 'all' ? 'rgba(255,255,255,0.07)' : 'transparent',
                borderLeft: selDate === 'all' ? '2px solid #64748b' : '2px solid transparent',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                color: selDate === 'all' ? '#e2e8f0' : '#94a3b8',
                WebkitTapHighlightColor: 'transparent',
              }}>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500 flex-shrink-0" />
              All Dates
            </button>
            {dates.length === 0 && (
              <p className="text-[11px] text-slate-600 text-center py-5">No entries this month</p>
            )}
            {dates.map(d => {
              const sel = selDate === d;
              const lbl = new Date(d+'T00:00:00').toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'});
              return (
                <button key={d} onClick={() => { setSelDate(d); setDateOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-xs"
                  style={{
                    background: sel ? 'rgba(96,165,250,0.10)' : 'transparent',
                    borderLeft: sel ? '2px solid #60a5fa' : '2px solid transparent',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    color: sel ? '#93c5fd' : '#94a3b8',
                    WebkitTapHighlightColor: 'transparent',
                  }}>
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: sel ? '#60a5fa' : '#334155' }} />
                  {lbl}
                </button>
              );
            })}
          </div>
        </Dropdown>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Grocery', val: gTotal, c: '#34d399' },
          { label: 'Other',   val: oTotal, c: '#fbbf24' },
          { label: 'Total',   val: gTotal+oTotal, c: '#60a5fa' },
        ].map(({ label, val, c }) => (
          <div key={label} className="rounded-xl px-3 py-2.5" style={glass}>
            <p className="text-[10px] text-slate-500 mb-0.5">{label}</p>
            <p className="text-sm font-bold truncate" style={{ color: c }}>₹{val.toFixed(0)}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 rounded-xl p-1" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        {[
          { key:'grocery', label:'Grocery', icon:<ShoppingCart size={13}/>, ac:'#34d399', ab:'rgba(16,185,129,0.18)', abr:'rgba(16,185,129,0.35)' },
          { key:'other',   label:'Other',   icon:<Layers size={13}/>,       ac:'#fbbf24', ab:'rgba(245,158,11,0.18)', abr:'rgba(245,158,11,0.35)' },
        ].map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setSelDate('all'); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold flex-1 justify-center transition-all"
            style={{
              background: tab===t.key ? t.ab : 'transparent',
              border: tab===t.key ? `1px solid ${t.abr}` : '1px solid transparent',
              color: tab===t.key ? t.ac : '#64748b',
              WebkitTapHighlightColor: 'transparent',
            }}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ── Grocery Tab ── */}
      {tab === 'grocery' && (
        <div className="space-y-4">
          {Object.keys(dateGroups).length === 0
            ? <div className="rounded-xl py-12 text-center text-slate-500 text-sm" style={glass}>No grocery entries {selDate!=='all'?'for this date':'this month'}</div>
            : Object.entries(dateGroups).map(([date, { lunch, dinner }]) => (
              <div key={date} className="space-y-2">
                {/* Date label */}
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-1">
                  {new Date(date+'T00:00:00').toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short',year:'numeric'})}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Lunch */}
                  {lunch.map(group => {
                    const tot = group.items.reduce((s,g)=>s+(g.total||g.unitPrice||0),0);
                    return (
                      <div key={group.key} className="rounded-xl overflow-hidden" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(251,191,36,0.18)' }}>
                        <div className="flex items-center gap-2 px-3 py-2.5" style={{ background:'rgba(251,191,36,0.08)', borderBottom:'1px solid rgba(251,191,36,0.15)' }}>
                          <span>☀️</span>
                          <span className="text-xs font-bold" style={{color:'#fbbf24'}}>Lunch</span>
                          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{background:'rgba(255,255,255,0.06)',color:'#64748b'}}>{group.items.length} items</span>
                        </div>
                        <div className="divide-y divide-white/5">
                          {group.items.map(g => (
                            <div key={g._id} className="flex items-center gap-2 px-3 py-2.5">
                              <div className="flex-1 min-w-0">
                                <p className="text-slate-200 text-xs font-medium truncate">{g.item}</p>
                                <p className="text-[10px] text-slate-500">{g.quantity ? `${g.quantity}${g.unit||''} × ₹${g.unitPrice}` : `₹${g.unitPrice}`}{g.buyerName ? ` · ${g.buyerName}` : ''}</p>
                              </div>
                              <span className="text-green-400 text-xs font-bold flex-shrink-0">₹{(g.total||g.unitPrice||0).toFixed(0)}</span>
                              <button onClick={() => openEdit(g,'grocery')} className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{background:'rgba(96,165,250,0.10)'}}>
                                <Pencil size={12} className="text-blue-400"/>
                              </button>
                              <button onClick={() => del(g._id,'grocery')} className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{background:'rgba(248,113,113,0.10)'}}>
                                <Trash2 size={12} className="text-red-400"/>
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between px-3 py-2" style={{background:'rgba(255,255,255,0.02)',borderTop:'1px solid rgba(251,191,36,0.15)'}}>
                          <span className="text-[10px] text-slate-600 font-semibold">Total</span>
                          <span className="text-xs font-bold" style={{color:'#fbbf24'}}>₹{tot.toFixed(0)}</span>
                        </div>
                      </div>
                    );
                  })}
                  {/* Dinner */}
                  {dinner.map(group => {
                    const tot = group.items.reduce((s,g)=>s+(g.total||g.unitPrice||0),0);
                    return (
                      <div key={group.key} className="rounded-xl overflow-hidden" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(139,92,246,0.18)' }}>
                        <div className="flex items-center gap-2 px-3 py-2.5" style={{ background:'rgba(139,92,246,0.08)', borderBottom:'1px solid rgba(139,92,246,0.15)' }}>
                          <span>🌙</span>
                          <span className="text-xs font-bold" style={{color:'#a78bfa'}}>Dinner</span>
                          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{background:'rgba(255,255,255,0.06)',color:'#64748b'}}>{group.items.length} items</span>
                        </div>
                        <div className="divide-y divide-white/5">
                          {group.items.map(g => (
                            <div key={g._id} className="flex items-center gap-2 px-3 py-2.5">
                              <div className="flex-1 min-w-0">
                                <p className="text-slate-200 text-xs font-medium truncate">{g.item}</p>
                                <p className="text-[10px] text-slate-500">{g.quantity ? `${g.quantity}${g.unit||''} × ₹${g.unitPrice}` : `₹${g.unitPrice}`}{g.buyerName ? ` · ${g.buyerName}` : ''}</p>
                              </div>
                              <span className="text-green-400 text-xs font-bold flex-shrink-0">₹{(g.total||g.unitPrice||0).toFixed(0)}</span>
                              <button onClick={() => openEdit(g,'grocery')} className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{background:'rgba(96,165,250,0.10)'}}>
                                <Pencil size={12} className="text-blue-400"/>
                              </button>
                              <button onClick={() => del(g._id,'grocery')} className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{background:'rgba(248,113,113,0.10)'}}>
                                <Trash2 size={12} className="text-red-400"/>
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between px-3 py-2" style={{background:'rgba(255,255,255,0.02)',borderTop:'1px solid rgba(139,92,246,0.15)'}}>
                          <span className="text-[10px] text-slate-600 font-semibold">Total</span>
                          <span className="text-xs font-bold" style={{color:'#a78bfa'}}>₹{tot.toFixed(0)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          }
        </div>
      )}

      {/* ── Other Tab ── */}
      {tab === 'other' && (
        <div className="space-y-2">
          {filteredOthers.length === 0
            ? <div className="rounded-xl py-12 text-center text-slate-500 text-sm" style={glass}>No other expenses {selDate!=='all'?'for this date':'this month'}</div>
            : filteredOthers.map(o => {
                const cat = OTHER_CATS.find(c => c.id === o.categoryName) || OTHER_CATS[2];
                return (
                  <div key={o._id} className="flex items-center gap-3 px-3 py-3 rounded-xl" style={glass}>
                    <span className="text-xl flex-shrink-0">{cat.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-slate-200 text-xs font-semibold">{cat.id}</span>
                        {o.description && <span className="text-[10px] text-slate-500">· {o.description}</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-[10px] text-slate-600">{new Date(o.date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</span>
                        {o.paidBy && <span className="text-[10px] text-slate-600">· {o.paidBy}</span>}
                      </div>
                    </div>
                    <StatusBadge status={o.status||'Due'} onClick={() => toggleStatus(o)} />
                    <span className="text-sm font-bold text-amber-400 flex-shrink-0">₹{o.amount.toFixed(0)}</span>
                    <button onClick={() => openEdit(o,'other')} className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{background:'rgba(96,165,250,0.10)',WebkitTapHighlightColor:'transparent'}}>
                      <Pencil size={13} className="text-blue-400"/>
                    </button>
                    <button onClick={() => del(o._id,'other')} className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{background:'rgba(248,113,113,0.10)',WebkitTapHighlightColor:'transparent'}}>
                      <Trash2 size={13} className="text-red-400"/>
                    </button>
                  </div>
                );
              })
          }
        </div>
      )}

      {/* Edit Modal */}
      {editModal && editItem && (
        <EditExpenseModal
          type={editType}
          form={editForm}
          setForm={setEditForm}
          onClose={() => setEditModal(false)}
          onSubmit={handleEdit}
        />
      )}
    </div>
  );
}
