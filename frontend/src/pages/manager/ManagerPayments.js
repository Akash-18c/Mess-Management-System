import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, X, Pencil, ChevronDown, ChevronUp, Banknote, Smartphone, Building2, Check } from 'lucide-react';
import api from '../../api';

const now   = new Date();
const MONTH = now.getMonth() + 1;
const YEAR  = now.getFullYear();
const EMPTY = { memberId: '', amount: '', method: 'Cash', date: now.toISOString().slice(0, 10), note: '' };
const rn    = (name) => { const m = name?.match(/^\w+\s*\((.+)\)$/); return m ? m[1] : (name || ''); };

const cardGlass = {
  background: 'rgba(255,255,255,0.18)',
  backdropFilter: 'blur(40px)',
  WebkitBackdropFilter: 'blur(40px)',
  border: '1px solid rgba(255,255,255,0.28)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.35)',
};

const modalGlass = {
  background: 'rgba(10,15,30,0.96)',
  backdropFilter: 'blur(48px)',
  WebkitBackdropFilter: 'blur(48px)',
  border: '1px solid rgba(255,255,255,0.14)',
  boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
};

const inputStyle = {
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.16)',
  color: '#fff',
  borderRadius: '12px',
  padding: '11px 14px',
  fontSize: '14px',
  width: '100%',
  outline: 'none',
};

const METHODS = {
  Cash: { icon: Banknote,    bg: 'rgba(52,211,153,0.18)',  color: '#34d399', border: 'rgba(52,211,153,0.45)',  label: 'Cash',  emoji: '💵' },
  UPI:  { icon: Smartphone,  bg: 'rgba(96,165,250,0.18)',  color: '#60a5fa', border: 'rgba(96,165,250,0.45)',  label: 'UPI',   emoji: '📱' },
  Bank: { icon: Building2,   bg: 'rgba(167,139,250,0.18)', color: '#a78bfa', border: 'rgba(167,139,250,0.45)', label: 'Bank',  emoji: '🏦' },
};

const AVATAR_COLORS = [
  ['rgba(16,185,129,0.25)',  '#34d399'],
  ['rgba(96,165,250,0.25)',  '#60a5fa'],
  ['rgba(167,139,250,0.25)', '#a78bfa'],
  ['rgba(251,146,60,0.25)',  '#fb923c'],
  ['rgba(244,114,182,0.25)', '#f472b6'],
  ['rgba(45,212,191,0.25)',  '#2dd4bf'],
];

export default function ManagerPayments() {
  const [payments, setPayments] = useState([]);
  const [members,  setMembers]  = useState([]);
  const [modal,    setModal]    = useState(false);
  const [editId,   setEditId]   = useState(null);
  const [form,     setForm]     = useState(EMPTY);
  const [loading,  setLoading]  = useState(false);
  const [expanded, setExpanded] = useState({});

  const f = v => setForm(p => ({ ...p, ...v }));

  const load = useCallback(() => {
    api.get(`/payments/${MONTH}/${YEAR}`).then(r => setPayments(r.data)).catch(() => {});
    api.get('/members').then(r => setMembers(r.data)).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);

  const grouped = payments.reduce((acc, p) => {
    const id = p.memberId?._id || p.memberId;
    if (!acc[id]) acc[id] = { member: p.memberId, payments: [] };
    acc[id].payments.push(p);
    return acc;
  }, {});

  const groups = Object.values(grouped).sort((a, b) =>
    rn(a.member?.name).localeCompare(rn(b.member?.name))
  );

  const total = payments.reduce((s, p) => s + p.amount, 0);

  const openAdd = (memberId = '') => { setEditId(null); setForm({ ...EMPTY, memberId }); setModal(true); };
  const openEdit = (p) => {
    setEditId(p._id);
    setForm({ memberId: p.memberId?._id || '', amount: p.amount, method: p.method || 'Cash', date: p.date?.slice(0, 10) || now.toISOString().slice(0, 10), note: p.note || '' });
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setModal(false);
    try {
      if (editId) {
        await api.put(`/payments/${editId}`, { ...form, amount: +form.amount, month: MONTH, year: YEAR });
        toast.success('Payment updated');
      } else {
        await api.post('/payments', { ...form, amount: +form.amount, month: MONTH, year: YEAR });
        toast.success('Payment recorded');
        setExpanded(prev => ({ ...prev, [form.memberId]: true }));
      }
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
      setModal(true);
    } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this payment?')) return;
    await api.delete(`/payments/${id}`);
    toast.success('Deleted');
    load();
  };

  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  // Find member name for cash display
  const selectedMember = members.find(m => m._id === form.memberId);
  const selectedName   = selectedMember ? rn(selectedMember.name) : '';

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="relative rounded-2xl overflow-hidden p-4" style={cardGlass}>
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.60),transparent)' }} />
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: 'rgba(16,185,129,0.18)', border: '1px solid rgba(16,185,129,0.35)' }}>
              💳
            </div>
            <div>
              <h1 className="font-bold text-white text-base">Payments</h1>
              <p className="text-slate-300 text-xs opacity-70">Advance payments from members</p>
            </div>
          </div>
          <button onClick={() => openAdd()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold active:scale-95 transition-transform flex-shrink-0"
            style={{ background: 'rgba(16,185,129,0.22)', border: '1px solid rgba(16,185,129,0.55)', color: '#34d399', boxShadow: '0 0 16px rgba(16,185,129,0.18)' }}>
            <Plus size={15} /> Record
          </button>
        </div>
      </div>

      {/* ── Total collected ── */}
      <div className="relative rounded-2xl overflow-hidden p-4" style={{ ...cardGlass, border: '1px solid rgba(52,211,153,0.40)' }}>
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg,transparent,rgba(52,211,153,0.70),transparent)' }} />
        <p className="text-xs text-slate-300 opacity-70 mb-1 uppercase tracking-wide font-semibold">Total Collected</p>
        <p className="text-3xl font-bold text-green-400">₹{total.toFixed(2)}</p>
        <p className="text-xs text-slate-400 mt-1">
          {payments.length} payment{payments.length !== 1 ? 's' : ''} · {groups.length} member{groups.length !== 1 ? 's' : ''}
        </p>
        {/* Method breakdown */}
        {payments.length > 0 && (
          <div className="flex gap-2 mt-3 flex-wrap">
            {Object.entries(METHODS).map(([key, ms]) => {
              const amt = payments.filter(p => (p.method || 'Cash') === key).reduce((s, p) => s + p.amount, 0);
              if (!amt) return null;
              return (
                <span key={key} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
                  style={{ background: ms.bg, border: `1px solid ${ms.border}`, color: ms.color }}>
                  {ms.emoji} {key} ₹{amt.toFixed(0)}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Member Groups ── */}
      {groups.length === 0 ? (
        <div className="relative rounded-2xl overflow-hidden p-12 text-center" style={cardGlass}>
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.60),transparent)' }} />
          <p className="text-4xl mb-3">💳</p>
          <p className="text-white font-semibold text-sm">No payments recorded yet</p>
          <p className="text-slate-400 text-xs mt-1">Tap "Record" to add a payment</p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map(({ member, payments: mPayments }, idx) => {
            const id       = member?._id;
            const name     = rn(member?.name);
            const mTotal   = mPayments.reduce((s, p) => s + p.amount, 0);
            const isOpen   = !!expanded[id];
            const [avatarBg, avatarClr] = AVATAR_COLORS[idx % AVATAR_COLORS.length];

            return (
              <div key={id} className="relative rounded-2xl overflow-hidden" style={cardGlass}>
                <div className="absolute top-0 left-0 right-0 h-px"
                  style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.60),transparent)' }} />

                {/* Member row */}
                <div className="flex items-center justify-between gap-2 px-4 py-3 cursor-pointer"
                  style={{ background: isOpen ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.08)' }}
                  onClick={() => toggleExpand(id)}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ background: avatarBg, color: avatarClr, border: `1px solid ${avatarClr}40` }}>
                      {name?.[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-bold text-sm">{name}</p>
                      <p className="text-slate-400 text-xs mt-0.5">
                        {mPayments.length} payment{mPayments.length !== 1 ? 's' : ''}
                        {member?.room ? ` · Room ${member.room}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-lg font-bold text-green-400">₹{mTotal.toFixed(0)}</span>
                    <button onClick={e => { e.stopPropagation(); openAdd(id); }}
                      className="w-8 h-8 rounded-xl flex items-center justify-center active:scale-95"
                      style={{ background: 'rgba(16,185,129,0.18)', border: '1px solid rgba(16,185,129,0.40)', color: '#34d399' }}>
                      <Plus size={14} />
                    </button>
                    {isOpen
                      ? <ChevronUp size={16} className="text-slate-400" />
                      : <ChevronDown size={16} className="text-slate-400" />}
                  </div>
                </div>

                {/* Expanded list */}
                {isOpen && (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}>
                    {mPayments.slice().sort((a, b) => new Date(b.date) - new Date(a.date)).map((p, i) => {
                      const ms = METHODS[p.method || 'Cash'] || METHODS.Cash;
                      const MIcon = ms.icon;
                      return (
                        <div key={p._id} className="px-4 py-3"
                          style={{ borderBottom: i < mPayments.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none', background: i % 2 === 0 ? 'rgba(0,0,0,0.10)' : 'transparent' }}>

                          {/* Method badge + amount row */}
                          <div className="flex items-center justify-between mb-2">
                            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                              style={{ background: ms.bg, border: `1px solid ${ms.border}`, color: ms.color }}>
                              <MIcon size={11} /> {ms.emoji} {p.method || 'Cash'}
                            </span>
                            <span className="text-base font-bold text-green-400">₹{p.amount.toFixed(0)}</span>
                          </div>

                          {/* Cash: show name + amount prominently */}
                          {(p.method === 'Cash' || !p.method) && (
                            <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-xl"
                              style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.20)' }}>
                              <Banknote size={13} className="text-green-400 flex-shrink-0" />
                              <span className="text-green-300 text-xs font-semibold">{name}</span>
                              <span className="text-slate-400 text-xs">paid</span>
                              <span className="text-green-400 text-xs font-bold ml-auto">₹{p.amount.toFixed(2)} cash</span>
                            </div>
                          )}

                          {/* Date + note + actions */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-slate-400 text-xs">
                                📅 {new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </p>
                              {p.note && <p className="text-slate-500 text-xs mt-0.5 truncate">📝 {p.note}</p>}
                            </div>
                            <div className="flex gap-1.5 flex-shrink-0">
                              <button onClick={() => openEdit(p)}
                                className="w-8 h-8 rounded-xl flex items-center justify-center active:scale-95"
                                style={{ background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.30)', color: '#60a5fa' }}>
                                <Pencil size={12} />
                              </button>
                              <button onClick={() => handleDelete(p._id)}
                                className="w-8 h-8 rounded-xl flex items-center justify-center active:scale-95"
                                style={{ background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.30)', color: '#f87171' }}>
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Member total footer */}
                    <div className="flex items-center justify-between px-4 py-2.5"
                      style={{ background: 'rgba(52,211,153,0.06)', borderTop: '1px solid rgba(52,211,153,0.18)' }}>
                      <span className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Total Paid</span>
                      <span className="text-sm font-bold text-green-400">₹{mTotal.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal ── */}
      {modal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
          <div className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl overflow-hidden" style={modalGlass}>

            <div className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.10)' }}>
              <h2 className="font-bold text-white text-sm">{editId ? '✏️ Edit Payment' : '💳 Record Payment'}</h2>
              <button onClick={() => setModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)', color: '#94a3b8' }}>
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">

              {/* Member */}
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1.5 block">Member</label>
                <select style={inputStyle} value={form.memberId} onChange={e => f({ memberId: e.target.value })} required>
                  <option value="">Select member…</option>
                  {members.map(m => <option key={m._id} value={m._id}>{rn(m.name)}</option>)}
                </select>
              </div>

              {/* Payment Method — 3 big buttons */}
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2 block">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(METHODS).map(([key, ms]) => {
                    const MIcon = ms.icon;
                    const sel   = form.method === key;
                    return (
                      <button key={key} type="button" onClick={() => f({ method: key })}
                        className="flex flex-col items-center gap-1.5 py-3 rounded-xl font-bold text-xs active:scale-95 transition-transform"
                        style={{
                          background: sel ? ms.bg : 'rgba(255,255,255,0.05)',
                          border: sel ? `1.5px solid ${ms.border}` : '1px solid rgba(255,255,255,0.10)',
                          color: sel ? ms.color : '#64748b',
                          boxShadow: sel ? `0 0 12px ${ms.bg}` : 'none',
                        }}>
                        <MIcon size={18} />
                        <span>{ms.emoji} {key}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cash preview — name + amount */}
              {form.method === 'Cash' && selectedName && form.amount && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                  style={{ background: 'rgba(52,211,153,0.10)', border: '1px solid rgba(52,211,153,0.30)' }}>
                  <Banknote size={14} className="text-green-400 flex-shrink-0" />
                  <span className="text-green-300 text-sm font-semibold">{selectedName}</span>
                  <span className="text-slate-400 text-sm">paid</span>
                  <span className="text-green-400 text-sm font-bold ml-auto">₹{(+form.amount).toFixed(2)} cash</span>
                </div>
              )}

              {/* Amount + Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1.5 block">Amount (₹)</label>
                  <input style={inputStyle} type="number" step="0.01" min="0" placeholder="0.00"
                    value={form.amount} onChange={e => f({ amount: e.target.value })} required />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1.5 block">Date</label>
                  <input style={{ ...inputStyle, colorScheme: 'dark' }} type="date"
                    value={form.date} onChange={e => f({ date: e.target.value })} required />
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1.5 block">Note <span className="normal-case text-slate-600">(optional)</span></label>
                <input style={inputStyle} placeholder="Any note…" value={form.note} onChange={e => f({ note: e.target.value })} />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setModal(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-bold active:scale-95 transition-transform"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)', color: '#94a3b8' }}>
                  Cancel
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 py-3 rounded-xl text-sm font-bold active:scale-95 transition-transform"
                  style={{ background: 'rgba(16,185,129,0.25)', border: '1px solid rgba(16,185,129,0.55)', color: '#34d399', opacity: loading ? 0.7 : 1 }}>
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
