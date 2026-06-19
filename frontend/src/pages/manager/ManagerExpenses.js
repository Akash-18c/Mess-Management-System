import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, X, ShoppingCart, Layers, ChevronDown, MoreHorizontal } from 'lucide-react';
import api from '../../api';

const now = new Date();
const MONTH = now.getMonth() + 1;
const YEAR  = now.getFullYear();

const OTHER_CATS = [
  { id: 'Gas Cylinder', emoji: '🔥', label: 'Gas Cylinder', color: 'border-orange-500 bg-orange-500/10 text-orange-400' },
  { id: 'Rice Bag',     emoji: '🌾', label: 'Rice Bag',     color: 'border-yellow-500 bg-yellow-500/10 text-yellow-400' },
  { id: 'Other',        emoji: '📦', label: 'Other',        color: 'border-slate-500  bg-slate-500/10  text-slate-300'  },
];
const UNITS = ['kg','g','L','ml','pcs','dozen','bag','bottle','packet'];

const EMPTY_G = { item:'', quantity:'', unit:'kg', unitPrice:'', buyerName:'', date: now.toISOString().slice(0,10) };
const EMPTY_O = { categoryName:'Gas Cylinder', description:'', amount:'', paidBy:'', date: now.toISOString().slice(0,10), note:'', status:'Due' };

// ─── Styled Select ────────────────────────────────────────────────────────────
function Select({ value, onChange, options, required, placeholder }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        required={required}
        className="input appearance-none pr-9 cursor-pointer"
      >
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    </div>
  );
}

// ─── Category Badge ───────────────────────────────────────────────────────────
function CatBadge({ name }) {
  const c = OTHER_CATS.find(x => x.id === name) || OTHER_CATS[2];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border" style={{}}>
      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${c.color}`}>
        {c.emoji} {c.label}
      </span>
    </span>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${status === 'Paid' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
      {status === 'Paid' ? '✓ Paid' : '⏳ Due'}
    </span>
  );
}

export default function ManagerExpenses() {
  const [tab,  setTab]  = useState('grocery');
  const [groceries, setGroceries] = useState([]);
  const [others,    setOthers]    = useState([]);
  const [modal,     setModal]     = useState(false);
  const [editId,    setEditId]    = useState(null);
  const [form,      setForm]      = useState(EMPTY_G);
  const [loading,   setLoading]   = useState(false);

  const f = v => setForm(p => ({ ...p, ...v }));

  const load = useCallback(() => {
    Promise.all([
      api.get(`/expenses/grocery/${MONTH}/${YEAR}`).then(r => setGroceries(r.data)),
      api.get(`/expenses/other/${MONTH}/${YEAR}`).then(r => setOthers(r.data)),
    ]);
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
    try {
      if (tab === 'grocery') {
        await api.post('/expenses/grocery', { ...form, month: MONTH, year: YEAR, quantity: +form.quantity, unitPrice: +form.unitPrice });
        toast.success('Grocery added');
      } else if (editId) {
        await api.put(`/expenses/other/${editId}`, { ...form, amount: +form.amount });
        toast.success('Updated');
      } else {
        await api.post('/expenses/other', { ...form, month: MONTH, year: YEAR, amount: +form.amount });
        toast.success('Expense added');
      }
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
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
    toast.success('Status updated');
    load();
  };

  const gTotal = groceries.reduce((s,g) => s + g.total, 0);
  const oTotal = others.reduce((s,o)   => s + o.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Expenses</h1>
          <p className="text-slate-400 text-sm">Track grocery &amp; other expenses</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add
        </button>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card border border-green-500/20 bg-green-500/5">
          <p className="text-slate-400 text-xs mb-1">Grocery</p>
          <p className="text-xl font-bold text-green-400">₹{gTotal.toFixed(2)}</p>
        </div>
        <div className="card border border-amber-500/20 bg-amber-500/5">
          <p className="text-slate-400 text-xs mb-1">Other</p>
          <p className="text-xl font-bold text-amber-400">₹{oTotal.toFixed(2)}</p>
        </div>
        <div className="card border border-blue-500/20 bg-blue-500/5">
          <p className="text-slate-400 text-xs mb-1">Grand Total</p>
          <p className="text-xl font-bold text-blue-400">₹{(gTotal + oTotal).toFixed(2)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800 border border-slate-700 rounded-xl p-1 w-fit">
        {[
          { key: 'grocery', label: 'Grocery', icon: <ShoppingCart size={14} />, on: 'bg-green-500 text-white' },
          { key: 'other',   label: 'Other',   icon: <Layers size={14} />,       on: 'bg-amber-500 text-white' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.key ? t.on : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-x-auto">
        {tab === 'grocery' ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                {['Item','Qty','Price','Total','Date','Buyer',''].map((h,i) => (
                  <th key={i} className={`py-3 px-3 text-slate-400 font-medium text-xs uppercase tracking-wide ${i >= 4 && h ? 'hidden sm:table-cell' : ''} ${i > 0 && h ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groceries.map((g, i) => (
                <tr key={g._id} className={`border-b border-slate-700/40 hover:bg-slate-700/20 transition-colors ${i%2?'bg-slate-700/10':''}`}>
                  <td className="py-3 px-3 text-white font-medium">{g.item}</td>
                  <td className="py-3 px-3 text-right text-slate-300">{g.quantity} {g.unit}</td>
                  <td className="py-3 px-3 text-right text-slate-300">₹{g.unitPrice}</td>
                  <td className="py-3 px-3 text-right text-green-400 font-semibold">₹{g.total.toFixed(2)}</td>
                  <td className="py-3 px-3 text-slate-400 hidden sm:table-cell">{new Date(g.date).toLocaleDateString('en-IN')}</td>
                  <td className="py-3 px-3 text-slate-400 hidden sm:table-cell">{g.buyerName || '—'}</td>
                  <td className="py-3 px-3 text-right">
                    <button onClick={() => del(g._id,'grocery')} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
              {groceries.length === 0 && <tr><td colSpan={7} className="py-10 text-center text-slate-500">No grocery entries yet</td></tr>}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                {['Category','Description','Amount','Date','Status',''].map((h,i) => (
                  <th key={i} className={`py-3 px-3 text-slate-400 font-medium text-xs uppercase tracking-wide ${i===1?'text-left hidden md:table-cell':i===3?'text-left hidden sm:table-cell':i===2||i===4?'text-right':'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {others.map((o, i) => (
                <tr key={o._id} className={`border-b border-slate-700/40 hover:bg-slate-700/20 transition-colors ${i%2?'bg-slate-700/10':''}`}>
                  <td className="py-3 px-3"><CatBadge name={o.categoryName} /></td>
                  <td className="py-3 px-3 text-slate-300 hidden md:table-cell">{o.description || '—'}</td>
                  <td className="py-3 px-3 text-right text-amber-400 font-semibold">₹{o.amount.toFixed(2)}</td>
                  <td className="py-3 px-3 text-slate-400 hidden sm:table-cell">{new Date(o.date).toLocaleDateString('en-IN')}</td>
                  <td className="py-3 px-3 text-right">
                    <button onClick={() => toggleStatus(o)} title="Toggle status"><StatusBadge status={o.status || 'Due'} /></button>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(o)} className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-600 rounded-lg transition-colors"><MoreHorizontal size={14} /></button>
                      <button onClick={() => del(o._id,'other')} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {others.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-slate-500">No other expenses yet</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Modal ──────────────────────────────────────────────────────── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-700">
              <h2 className="font-semibold text-white text-lg">
                {tab === 'grocery' ? '🛒 Add Grocery' : editId ? '✏️ Edit Expense' : '📦 Add Other Expense'}
              </h2>
              <button onClick={() => setModal(false)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {tab === 'grocery' ? (
                <>
                  <div>
                    <label className="label">Item Name</label>
                    <input className="input" placeholder="e.g. Rice, Tomato, Oil…" value={form.item} onChange={e => f({ item: e.target.value })} required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Quantity</label>
                      <input className="input" type="number" step="0.01" min="0" placeholder="0.00" value={form.quantity} onChange={e => f({ quantity: e.target.value })} required />
                    </div>
                    <div>
                      <label className="label">Unit</label>
                      <Select value={form.unit} onChange={e => f({ unit: e.target.value })} options={UNITS.map(u=>({value:u,label:u}))} />
                    </div>
                    <div>
                      <label className="label">Unit Price (₹)</label>
                      <input className="input" type="number" step="0.01" min="0" placeholder="0.00" value={form.unitPrice} onChange={e => f({ unitPrice: e.target.value })} required />
                    </div>
                    <div>
                      <label className="label">Date</label>
                      <input className="input" type="date" value={form.date} onChange={e => f({ date: e.target.value })} required />
                    </div>
                  </div>
                  <div>
                    <label className="label">Buyer Name (optional)</label>
                    <input className="input" placeholder="Who bought this?" value={form.buyerName} onChange={e => f({ buyerName: e.target.value })} />
                  </div>
                  {form.quantity && form.unitPrice && +form.quantity > 0 && +form.unitPrice > 0 && (
                    <div className="flex items-center justify-between bg-green-500/10 border border-green-500/20 rounded-xl p-3">
                      <span className="text-green-400 text-sm font-medium">Total</span>
                      <span className="text-green-400 text-lg font-bold">₹{(+form.quantity * +form.unitPrice).toFixed(2)}</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Visual category picker */}
                  <div>
                    <label className="label mb-2">Category</label>
                    <div className="grid grid-cols-3 gap-2">
                      {OTHER_CATS.map(cat => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => f({ categoryName: cat.id })}
                          className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                            form.categoryName === cat.id
                              ? 'border-green-500 bg-green-500/10 shadow-md shadow-green-500/10'
                              : 'border-slate-600 bg-slate-700/50 hover:border-slate-500 hover:bg-slate-700'
                          }`}
                        >
                          <span className="text-xl">{cat.emoji}</span>
                          <span className={`text-xs font-semibold ${form.categoryName === cat.id ? 'text-green-400' : 'text-slate-400'}`}>{cat.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="label">Description (optional)</label>
                    <input className="input" placeholder={form.categoryName === 'Gas Cylinder' ? 'e.g. 14kg refill…' : form.categoryName === 'Rice Bag' ? 'e.g. 25kg bag…' : 'Description…'} value={form.description} onChange={e => f({ description: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Amount (₹)</label>
                      <input className="input" type="number" step="0.01" min="0" placeholder="0.00" value={form.amount} onChange={e => f({ amount: e.target.value })} required />
                    </div>
                    <div>
                      <label className="label">Date</label>
                      <input className="input" type="date" value={form.date} onChange={e => f({ date: e.target.value })} required />
                    </div>
                    <div>
                      <label className="label">Paid By (optional)</label>
                      <input className="input" placeholder="Name…" value={form.paidBy} onChange={e => f({ paidBy: e.target.value })} />
                    </div>
                    <div>
                      <label className="label">Note (optional)</label>
                      <input className="input" placeholder="Any note…" value={form.note} onChange={e => f({ note: e.target.value })} />
                    </div>
                  </div>
                  {/* Status toggle buttons */}
                  <div>
                    <label className="label mb-2">Payment Status</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Due','Paid'].map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => f({ status: s })}
                          className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                            form.status === s
                              ? s === 'Paid'
                                ? 'border-green-500 bg-green-500/15 text-green-400'
                                : 'border-red-500 bg-red-500/15 text-red-400'
                              : 'border-slate-600 bg-slate-700/50 text-slate-400 hover:border-slate-500'
                          }`}
                        >
                          {s === 'Paid' ? '✓ Paid' : '⏳ Due'}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1" disabled={loading}>
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
