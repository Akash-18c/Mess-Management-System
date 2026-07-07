import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, X, Check, HandCoins, RotateCcw } from 'lucide-react';
import api from '../../api';

const now  = new Date();
const EMPTY = { memberId: '', amount: '', reason: '', date: now.toISOString().slice(0, 10) };
const rn = (name) => { const m = name?.match(/^\w+\s*\((.+)\)$/); return m ? m[1] : (name || ''); };

const card = {
  background: 'rgba(15,20,35,0.85)',
  border: '1px solid rgba(255,255,255,0.10)',
  boxShadow: '0 4px 20px rgba(0,0,0,0.40)',
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

const AVATAR_COLORS = [
  ['rgba(251,146,60,0.25)',  '#fb923c'],
  ['rgba(96,165,250,0.25)',  '#60a5fa'],
  ['rgba(167,139,250,0.25)', '#a78bfa'],
  ['rgba(16,185,129,0.25)',  '#34d399'],
  ['rgba(244,114,182,0.25)', '#f472b6'],
  ['rgba(45,212,191,0.25)',  '#2dd4bf'],
];

export default function ManagerBorrows() {
  const [borrows,  setBorrows]  = useState([]);
  const [members,  setMembers]  = useState([]);
  const [modal,    setModal]    = useState(false);
  const [form,     setForm]     = useState(EMPTY);
  const [loading,  setLoading]  = useState(false);
  const [tab,      setTab]      = useState('active'); // 'active' | 'returned'

  const f = v => setForm(p => ({ ...p, ...v }));

  const load = useCallback(() => {
    api.get('/borrows').then(r => setBorrows(r.data)).catch(() => {});
    api.get('/members').then(r => setMembers(r.data.filter(m => m.isActive && m.role !== 'admin'))).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.memberId) { toast.error('Select a member'); return; }
    setLoading(true);
    setModal(false);
    try {
      await api.post('/borrows', { ...form, amount: +form.amount });
      toast.success('Borrow recorded');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
      setModal(true);
    } finally { setLoading(false); }
  };

  const markReturned = async (id) => {
    if (!window.confirm('Mark this borrow as returned?')) return;
    await api.put(`/borrows/${id}`, { returned: true, returnedAt: new Date() });
    toast.success('Marked as returned');
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this borrow record?')) return;
    await api.delete(`/borrows/${id}`);
    toast.success('Deleted');
    load();
  };

  const active   = borrows.filter(b => !b.returned);
  const returned = borrows.filter(b => b.returned);
  const list     = tab === 'active' ? active : returned;
  const totalActive = active.reduce((s, b) => s + b.amount, 0);

  // group active by member for display
  const grouped = {};
  list.forEach((b, i) => {
    const mid = b.memberId?._id || b.memberId;
    if (!grouped[mid]) grouped[mid] = { member: b.memberId, items: [], colorIdx: Object.keys(grouped).length };
    grouped[mid].items.push(b);
  });

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="rounded-2xl p-4" style={card}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(251,146,60,0.18)', border: '1px solid rgba(251,146,60,0.35)' }}>
              <HandCoins size={20} style={{ color: '#fb923c' }} />
            </div>
            <div>
              <h1 className="font-bold text-white text-base">Borrows</h1>
              <p className="text-slate-400 text-xs">Money lent from mess fund</p>
            </div>
          </div>
          <button onClick={() => { setForm(EMPTY); setModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold active:scale-95 transition-transform flex-shrink-0"
            style={{ background: 'rgba(251,146,60,0.22)', border: '1px solid rgba(251,146,60,0.55)', color: '#fb923c' }}>
            <Plus size={15} /> Add
          </button>
        </div>
      </div>

      {/* Summary */}
      {active.length > 0 && (
        <div className="rounded-2xl p-4" style={{ ...card, border: '1px solid rgba(251,146,60,0.30)' }}>
          <p className="text-xs text-slate-400 mb-1 uppercase tracking-wide font-semibold">Total Outstanding</p>
          <p className="text-3xl font-bold text-orange-400">₹{totalActive.toFixed(2)}</p>
          <p className="text-xs text-slate-500 mt-1">{active.length} active borrow{active.length !== 1 ? 's' : ''}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {['active', 'returned'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold active:scale-95 transition-all capitalize"
            style={{
              background: tab === t ? 'rgba(251,146,60,0.20)' : 'rgba(255,255,255,0.05)',
              border: tab === t ? '1px solid rgba(251,146,60,0.50)' : '1px solid rgba(255,255,255,0.10)',
              color: tab === t ? '#fb923c' : '#64748b',
            }}>
            {t} ({t === 'active' ? active.length : returned.length})
          </button>
        ))}
      </div>

      {/* List */}
      {Object.keys(grouped).length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={card}>
          <HandCoins size={36} className="text-slate-600 mx-auto mb-3" />
          <p className="text-white font-semibold text-sm">No {tab} borrows</p>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.values(grouped).map(({ member, items, colorIdx }) => {
            const name = rn(member?.name);
            const memberTotal = items.reduce((s, b) => s + b.amount, 0);
            const [avatarBg, avatarClr] = AVATAR_COLORS[colorIdx % AVATAR_COLORS.length];
            return (
              <div key={member?._id} className="rounded-2xl overflow-hidden" style={card}>
                {/* Member header */}
                <div className="flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.15)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ background: avatarBg, color: avatarClr, border: `1px solid ${avatarClr}40` }}>
                      {name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">{name}</p>
                      {member?.room && <p className="text-xs text-slate-400">Room {member.room}</p>}
                    </div>
                  </div>
                  <span className="text-lg font-bold text-orange-400">₹{memberTotal.toFixed(0)}</span>
                </div>

                {/* Borrow rows */}
                <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  {items.map((b) => (
                    <div key={b._id} className="flex items-center gap-3 px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold">{b.reason || 'No reason'}</p>
                        <p className="text-slate-400 text-xs mt-0.5">
                          {new Date(b.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {b.returned && b.returnedAt
                            ? ` · Returned ${new Date(b.returnedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
                            : ''}
                        </p>
                      </div>
                      <span className="text-base font-bold text-orange-400 flex-shrink-0">₹{b.amount.toFixed(0)}</span>
                      <div className="flex gap-1.5 flex-shrink-0">
                        {!b.returned && (
                          <button onClick={() => markReturned(b._id)}
                            className="w-8 h-8 rounded-xl flex items-center justify-center active:scale-95"
                            style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.35)', color: '#34d399' }}
                            title="Mark returned">
                            <Check size={13} />
                          </button>
                        )}
                        <button onClick={() => handleDelete(b._id)}
                          className="w-8 h-8 rounded-xl flex items-center justify-center active:scale-95"
                          style={{ background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.30)', color: '#f87171' }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer total */}
                <div className="flex items-center justify-between px-4 py-2.5"
                  style={{ background: 'rgba(251,146,60,0.06)', borderTop: '1px solid rgba(251,146,60,0.18)' }}>
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wide">
                    {tab === 'active' ? 'Outstanding' : 'Returned'}
                  </span>
                  <span className="text-sm font-bold text-orange-400">₹{memberTotal.toFixed(2)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
          <div className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl overflow-hidden" style={modalGlass}>
            <div className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.10)' }}>
              <h2 className="font-bold text-white text-sm">Record Borrow</h2>
              <button onClick={() => setModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)', color: '#94a3b8' }}>
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
              {/* Member picker */}
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2 block">Member</label>
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {members.map((m, i) => {
                    const nm = rn(m.name);
                    const sel = form.memberId === m._id;
                    const [abg, acl] = AVATAR_COLORS[i % AVATAR_COLORS.length];
                    return (
                      <button key={m._id} type="button" onClick={() => f({ memberId: m._id })}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left active:scale-95 transition-transform"
                        style={{
                          background: sel ? 'rgba(251,146,60,0.15)' : 'rgba(255,255,255,0.05)',
                          border: sel ? '1px solid rgba(251,146,60,0.45)' : '1px solid rgba(255,255,255,0.10)',
                        }}>
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ background: sel ? 'rgba(251,146,60,0.25)' : abg, color: sel ? '#fb923c' : acl }}>
                          {nm?.[0]?.toUpperCase()}
                        </div>
                        <p className="text-sm font-medium flex-1" style={{ color: sel ? '#fdba74' : '#e2e8f0' }}>{nm}</p>
                        {sel && <Check size={14} className="text-orange-400 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

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

              {/* Reason */}
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1.5 block">
                  Reason <span className="normal-case text-slate-600">(optional)</span>
                </label>
                <input style={inputStyle} placeholder="Why did they borrow?"
                  value={form.reason} onChange={e => f({ reason: e.target.value })} />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setModal(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-bold active:scale-95 transition-transform"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)', color: '#94a3b8' }}>
                  Cancel
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 py-3 rounded-xl text-sm font-bold active:scale-95 transition-transform"
                  style={{ background: 'rgba(251,146,60,0.25)', border: '1px solid rgba(251,146,60,0.55)', color: '#fb923c', opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
