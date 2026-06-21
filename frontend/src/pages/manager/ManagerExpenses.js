import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, X, ShoppingCart, Layers, ChevronDown, Pencil } from 'lucide-react';
import api from '../../api';

const now = new Date();
const MONTH = now.getMonth() + 1;
const YEAR  = now.getFullYear();

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
  const [tab,       setTab]      = useState('grocery');
  const [groceries, setGroceries] = useState([]);
  const [others,    setOthers]   = useState([]);
  const [modal,     setModal]    = useState(false);
  const [editId,    setEditId]   = useState(null);
  const [form,      setForm]     = useState(EMPTY_G);
  const [loading,   setLoading]  = useState(false);

  const f = v => setForm(p => ({ ...p, ...v }));

  const load = useCallback(() => {
    api.get(`/expenses/grocery/${MONTH}/${YEAR}`).then(r => setGroceries(r.data)).catch(() => {});
    api.get(`/expenses/other/${MONTH}/${YEAR}`).then(r => setOthers(r.data)).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

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
        await api.post('/expenses/grocery', { item: form.item, unitPrice: +form.unitPrice, buyerName: form.buyerName, date: form.date, meal: form.meal, month: MONTH, year: YEAR });
        toast.success('Grocery added');
      } else if (editId) {
        await api.put(`/expenses/other/${editId}`, { ...form, amount: +form.amount });
        toast.success('Updated');
      } else {
        const payload = { categoryName: form.categoryName, description: form.description, amount: +form.amount, paidBy: form.paidBy, date: form.date, note: form.note, status: form.status, month: MONTH, year: YEAR };
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

  const gTotal = groceries.reduce((s,g) => s + (g.total || g.unitPrice || 0), 0);
  const oTotal = others.reduce((s,o) => s + o.amount, 0);

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3 rounded-2xl p-3 px-4" style={glass}>
        <div>
          <h1 className="text-base font-bold text-white leading-tight">Expenses</h1>
          <p className="text-[10px] text-slate-500 mt-0.5">Grocery &amp; other expenses</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 text-xs font-semibold text-white px-3 py-2 rounded-xl active:scale-95"
          style={{ background: 'linear-gradient(135deg,#10b981,#059669)', WebkitTapHighlightColor: 'transparent', transition: 'transform 0.1s' }}
        >
          <Plus size={14} /> Add
        </button>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Grocery', value: gTotal, color: '#34d399' },
          { label: 'Other',   value: oTotal, color: '#fbbf24' },
          { label: 'Total',   value: gTotal + oTotal, color: '#60a5fa' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl p-3" style={glass}>
            <p className="text-[10px] text-slate-500 mb-1">{label}</p>
            <p className="text-sm font-bold truncate" style={{ color }}>₹{value.toFixed(0)}</p>
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
      <div className="space-y-1.5">
        {tab === 'grocery' ? (
          groceries.length === 0
            ? <div className="rounded-xl py-10 text-center text-slate-500 text-sm" style={glass}>No grocery entries yet</div>
            : (() => {
                const groups = [];
                const seen = {};
                groceries.forEach(g => {
                  const key = `${g.date?.slice(0,10)}_${g.meal || 'Lunch'}`;
                  if (!seen[key]) { seen[key] = { key, date: g.date?.slice(0,10), meal: g.meal || 'Lunch', items: [] }; groups.push(seen[key]); }
                  seen[key].items.push(g);
                });
                return groups.map(group => {
                  const groupTotal = group.items.reduce((s, g) => s + (g.total || g.unitPrice || 0), 0);
                  const isLunch = group.meal === 'Lunch';
                  const ac = isLunch ? '#fbbf24' : '#a78bfa';
                  const ab = isLunch ? 'rgba(251,191,36,0.08)' : 'rgba(139,92,246,0.08)';
                  const abr = isLunch ? 'rgba(251,191,36,0.18)' : 'rgba(139,92,246,0.18)';
                  return (
                    <div key={group.key} className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${abr}` }}>
                      {/* Group header — compact */}
                      <div className="flex items-center justify-between px-3 py-1.5" style={{ background: ab, borderBottom: `1px solid ${abr}` }}>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs">{isLunch ? '☀️' : '🌙'}</span>
                          <span className="text-[11px] font-bold" style={{ color: ac }}>{isLunch ? 'Lunch' : 'Dinner'}</span>
                          <span className="text-slate-600 text-[10px]">·</span>
                          <span className="text-slate-400 text-[10px]">{new Date(group.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                          {group.items.length > 1 && <span className="text-[9px] font-semibold px-1 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: '#64748b' }}>{group.items.length}</span>}
                        </div>
                        <span className="text-[11px] font-bold" style={{ color: ac }}>₹{groupTotal.toFixed(0)}</span>
                      </div>
                      {/* Item rows — very compact */}
                      {group.items.map((g, idx) => (
                        <div key={g._id} className="flex items-center gap-2 px-3 py-1.5"
                          style={{ borderBottom: idx < group.items.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                          <p className="text-slate-200 text-xs font-medium truncate flex-1">{g.item}</p>
                          {g.buyerName && <span className="text-[9px] text-slate-600 flex-shrink-0 hidden sm:block">{g.buyerName}</span>}
                          <span className="text-[11px] font-bold text-green-400 flex-shrink-0">₹{(g.total || g.unitPrice || 0).toFixed(0)}</span>
                          <button onClick={() => del(g._id,'grocery')} className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(248,113,113,0.10)', WebkitTapHighlightColor: 'transparent' }}>
                            <Trash2 size={10} className="text-red-400" />
                          </button>
                        </div>
                      ))}
                      {/* Subtotal — only when >1 item */}
                      {group.items.length > 1 && (
                        <div className="flex items-center justify-between px-3 py-1" style={{ background: 'rgba(255,255,255,0.02)', borderTop: `1px solid ${abr}` }}>
                          <span className="text-[9px] font-semibold text-slate-600 uppercase tracking-wider">Subtotal</span>
                          <span className="text-[11px] font-bold" style={{ color: ac }}>₹{groupTotal.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  );
                });
              })()
        ) : (
          others.length === 0
            ? <div className="rounded-xl py-10 text-center text-slate-500 text-sm" style={glass}>No other expenses yet</div>
            : others.map(o => {
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
                  <StatusBadge status={o.status || 'Due'} onClick={() => toggleStatus(o)} />
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
