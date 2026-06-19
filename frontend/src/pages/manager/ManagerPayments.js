import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, X, Pencil } from 'lucide-react';
import api from '../../api';

const now = new Date();
const MONTH = now.getMonth() + 1;
const YEAR  = now.getFullYear();
const EMPTY = { memberId: '', amount: '', method: 'Cash', date: now.toISOString().slice(0, 10), note: '' };
const rn = (name) => { const m = name?.match(/^\w+\s*\((.+)\)$/); return m ? m[1] : (name || ''); };

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

const METHOD_STYLE = {
  Cash: { bg: 'rgba(52,211,153,0.12)', color: '#34d399', border: 'rgba(52,211,153,0.25)' },
  UPI:  { bg: 'rgba(96,165,250,0.12)', color: '#60a5fa', border: 'rgba(96,165,250,0.25)' },
  Bank: { bg: 'rgba(167,139,250,0.12)',color: '#a78bfa', border: 'rgba(167,139,250,0.25)' },
};

export default function ManagerPayments() {
  const [payments, setPayments] = useState([]);
  const [members,  setMembers]  = useState([]);
  const [modal,    setModal]    = useState(false);
  const [editId,   setEditId]   = useState(null);
  const [form,     setForm]     = useState(EMPTY);
  const [loading,  setLoading]  = useState(false);

  const f = v => setForm(p => ({ ...p, ...v }));

  const load = useCallback(() => {
    api.get(`/payments/${MONTH}/${YEAR}`).then(r => setPayments(r.data)).catch(() => {});
    api.get('/members').then(r => setMembers(r.data)).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  // auto-refresh every 30s
  useEffect(() => {
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  const openAdd = () => { setEditId(null); setForm(EMPTY); setModal(true); };

  const openEdit = (p) => {
    setEditId(p._id);
    setForm({
      memberId: p.memberId?._id || '',
      amount: p.amount,
      method: p.method || 'Cash',
      date: p.date?.slice(0, 10) || now.toISOString().slice(0, 10),
      note: p.note || '',
    });
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setModal(false); // close instantly
    try {
      if (editId) {
        await api.put(`/payments/${editId}`, { ...form, amount: +form.amount, month: MONTH, year: YEAR });
        toast.success('Payment updated');
      } else {
        await api.post('/payments', { ...form, amount: +form.amount, month: MONTH, year: YEAR });
        toast.success('Payment recorded');
      }
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
      setModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this payment?')) return;
    await api.delete(`/payments/${id}`);
    toast.success('Deleted');
    load();
  };

  const total = payments.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3 rounded-2xl p-3 px-4" style={glass}>
        <div>
          <h1 className="text-base font-bold text-white leading-tight">Payments</h1>
          <p className="text-[10px] text-slate-500 mt-0.5">Advance payments from members</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 text-xs font-semibold text-white px-3 py-2 rounded-xl active:scale-95"
          style={{ background: 'linear-gradient(135deg,#10b981,#059669)', WebkitTapHighlightColor: 'transparent', transition: 'transform 0.1s' }}
        >
          <Plus size={14} /> Record
        </button>
      </div>

      {/* ── Total Card ── */}
      <div className="rounded-2xl p-4" style={{ ...glass, border: '1px solid rgba(52,211,153,0.20)' }}>
        <p className="text-[10px] text-slate-500 mb-1 uppercase tracking-wide">Total Collected</p>
        <p className="text-2xl font-bold text-green-400">₹{total.toFixed(2)}</p>
        <p className="text-[10px] text-slate-600 mt-0.5">{payments.length} payment{payments.length !== 1 ? 's' : ''} this month</p>
      </div>

      {/* ── Payment Cards ── */}
      <div className="space-y-2">
        {payments.length === 0 ? (
          <div className="rounded-2xl py-12 text-center text-slate-500 text-sm" style={glass}>
            No payments recorded yet
          </div>
        ) : (
          payments.map(p => {
            const ms = METHOD_STYLE[p.method] || METHOD_STYLE.Cash;
            const name = rn(p.memberId?.name);
            return (
              <div key={p._id} className="rounded-2xl p-3" style={glass}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                      style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.25)' }}>
                      {name?.[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-semibold text-sm leading-tight truncate">{name}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: ms.bg, color: ms.color, border: `1px solid ${ms.border}` }}>
                          {p.method}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        {p.note && <span className="text-[10px] text-slate-600 truncate">· {p.note}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-base font-bold text-green-400">₹{p.amount.toFixed(0)}</span>
                    <button onClick={() => openEdit(p)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: 'rgba(96,165,250,0.10)', WebkitTapHighlightColor: 'transparent' }}>
                      <Pencil size={12} className="text-blue-400" />
                    </button>
                    <button onClick={() => handleDelete(p._id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: 'rgba(248,113,113,0.10)', WebkitTapHighlightColor: 'transparent' }}>
                      <Trash2 size={12} className="text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Modal ── */}
      {modal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl overflow-hidden" style={modalGlass}>

            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <h2 className="font-bold text-white text-sm">{editId ? '✏️ Edit Payment' : '💳 Record Payment'}</h2>
              <button onClick={() => setModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400"
                style={{ background: 'rgba(255,255,255,0.06)', WebkitTapHighlightColor: 'transparent' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
              <div>
                <label className="label text-xs">Member</label>
                <select className="input" value={form.memberId} onChange={e => f({ memberId: e.target.value })} required>
                  <option value="">Select member…</option>
                  {members.map(m => <option key={m._id} value={m._id}>{rn(m.name)}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label text-xs">Amount (₹)</label>
                  <input className="input" type="number" step="0.01" min="0" placeholder="0.00"
                    value={form.amount} onChange={e => f({ amount: e.target.value })} required />
                </div>
                <div>
                  <label className="label text-xs">Date</label>
                  <input className="input" type="date" value={form.date} onChange={e => f({ date: e.target.value })} required />
                </div>
              </div>

              {/* Method picker */}
              <div>
                <label className="label text-xs mb-2">Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Cash', 'UPI', 'Bank'].map(m => {
                    const ms = METHOD_STYLE[m];
                    const sel = form.method === m;
                    return (
                      <button key={m} type="button" onClick={() => f({ method: m })}
                        className="py-2.5 rounded-xl text-xs font-bold transition-all"
                        style={{
                          background: sel ? ms.bg : 'rgba(255,255,255,0.04)',
                          border: sel ? `1px solid ${ms.border}` : '1px solid rgba(255,255,255,0.08)',
                          color: sel ? ms.color : '#64748b',
                          WebkitTapHighlightColor: 'transparent',
                        }}>
                        {m}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="label text-xs">Note <span className="text-slate-600">(optional)</span></label>
                <input className="input" placeholder="Any note…" value={form.note} onChange={e => f({ note: e.target.value })} />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1 text-sm">Cancel</button>
                <button type="submit" className="btn-primary flex-1 text-sm" disabled={loading}>
                  {loading ? 'Saving…' : editId ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
