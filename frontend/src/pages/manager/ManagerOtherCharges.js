import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, Pencil, X, Check, Receipt } from 'lucide-react';
import api from '../../api';

const now   = new Date();
const MONTH = now.getMonth() + 1;
const YEAR  = now.getFullYear();
const rn = (name) => { const m = name?.match(/^\w+\s*\((.+)\)$/); return m ? m[1] : (name || '—'); };

const cardGlass = {
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

const EMPTY = { memberId: '', reason: '', amount: '', date: now.toISOString().slice(0, 10) };

const AVATAR_COLORS = [
  ['rgba(245,158,11,0.25)', '#fbbf24'],
  ['rgba(16,185,129,0.25)', '#34d399'],
  ['rgba(96,165,250,0.25)', '#60a5fa'],
  ['rgba(167,139,250,0.25)', '#a78bfa'],
  ['rgba(244,114,182,0.25)', '#f472b6'],
  ['rgba(45,212,191,0.25)', '#2dd4bf'],
];

export default function ManagerOtherCharges() {
  const [charges, setCharges] = useState([]);
  const [members, setMembers] = useState([]);
  const [modal,   setModal]   = useState(false);
  const [editId,  setEditId]  = useState(null);
  const [form,    setForm]    = useState(EMPTY);
  const [loading, setLoading] = useState(false);

  const f = v => setForm(p => ({ ...p, ...v }));

  const load = useCallback(() => {
    api.get(`/expenses/charges/${MONTH}/${YEAR}`).then(r => setCharges(r.data)).catch(() => {});
    api.get('/members').then(r => setMembers(r.data.filter(m => m.isActive && m.role !== 'admin'))).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setEditId(null); setForm(EMPTY); setModal(true); };
  const openEdit = (c) => {
    setEditId(c._id);
    setForm({ memberId: c.memberId?._id || c.memberId, reason: c.reason, amount: c.amount, date: c.date?.slice(0, 10) || now.toISOString().slice(0, 10) });
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setModal(false);
    try {
      if (editId) {
        await api.put(`/expenses/charges/${editId}`, { reason: form.reason, amount: +form.amount, date: form.date });
        toast.success('Updated');
      } else {
        if (!form.memberId) { toast.error('Select a member'); setModal(true); setLoading(false); return; }
        await api.post('/expenses/charges', { ...form, amount: +form.amount, month: MONTH, year: YEAR });
        toast.success('Charge added');
      }
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
      setModal(true);
    } finally { setLoading(false); }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this charge?')) return;
    await api.delete(`/expenses/charges/${id}`);
    toast.success('Deleted');
    load();
  };

  const grouped = {};
  charges.forEach((c, i) => {
    const mid = c.memberId?._id || c.memberId;
    if (!grouped[mid]) grouped[mid] = { member: c.memberId, items: [], idx: Object.keys(grouped).length };
    grouped[mid].items.push(c);
  });

  const total = charges.reduce((s, c) => s + c.amount, 0);

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="rounded-2xl p-4" style={cardGlass}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(245,158,11,0.18)', border: '1px solid rgba(245,158,11,0.35)' }}>
              <Receipt size={20} style={{ color: '#fbbf24' }} />
            </div>
            <div>
              <h1 className="font-bold text-white text-base">Other Charges</h1>
              <p className="text-slate-300 text-xs opacity-70">Individual charges · ₹{total.toFixed(0)} total</p>
            </div>
          </div>
          <button onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold active:scale-95 transition-transform flex-shrink-0"
            style={{ background: 'rgba(245,158,11,0.22)', border: '1px solid rgba(245,158,11,0.55)', color: '#fbbf24', boxShadow: '0 0 16px rgba(245,158,11,0.18)' }}>
            <Plus size={15} /> Add
          </button>
        </div>
      </div>

      {/* ── Summary pill ── */}
      {charges.length > 0 && (
        <div className="rounded-2xl p-4" style={{ ...cardGlass, border: '1px solid rgba(245,158,11,0.30)' }}>
          <p className="text-xs text-slate-300 opacity-70 mb-1 uppercase tracking-wide font-semibold">Total Charges</p>
          <p className="text-3xl font-bold text-amber-400">₹{total.toFixed(2)}</p>
          <p className="text-xs text-slate-400 mt-1">{charges.length} charge{charges.length !== 1 ? 's' : ''} · {Object.keys(grouped).length} member{Object.keys(grouped).length !== 1 ? 's' : ''}</p>
        </div>
      )}

      {/* ── Member Cards ── */}
      {Object.keys(grouped).length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={cardGlass}>
          <Receipt size={36} className="text-slate-500 mx-auto mb-3" />
          <p className="text-white font-semibold text-sm">No charges yet</p>
          <p className="text-slate-500 text-xs mt-1">Tap "Add" to add a charge for a member</p>
        </div>
      ) : (
        Object.values(grouped).map(({ member, items, idx }) => {
          const name = rn(member?.name);
          const memberTotal = items.reduce((s, c) => s + c.amount, 0);
          const [avatarBg, avatarClr] = AVATAR_COLORS[idx % AVATAR_COLORS.length];

          return (
            <div key={member?._id} className="rounded-2xl overflow-hidden" style={cardGlass}>

              {/* Member header */}
              <div className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.14)', background: 'rgba(0,0,0,0.15)' }}>
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
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-amber-400">₹{memberTotal.toFixed(0)}</span>
                  <button onClick={() => { setEditId(null); setForm({ ...EMPTY, memberId: member?._id }); setModal(true); }}
                    className="w-8 h-8 rounded-xl flex items-center justify-center active:scale-95"
                    style={{ background: 'rgba(245,158,11,0.18)', border: '1px solid rgba(245,158,11,0.35)', color: '#fbbf24' }}>
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Charge rows */}
              <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                {items.map((c, i) => (
                  <div key={c._id} className="flex items-center gap-3 px-4 py-3"
                    style={{ background: i % 2 === 0 ? 'rgba(0,0,0,0.08)' : 'transparent' }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold">{c.reason}</p>
                      <p className="text-slate-400 text-xs mt-0.5">
                        {new Date(c.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <span className="text-base font-bold text-amber-400 flex-shrink-0">₹{c.amount.toFixed(0)}</span>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button onClick={() => openEdit(c)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center active:scale-95"
                        style={{ background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.30)', color: '#60a5fa' }}>
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => del(c._id)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center active:scale-95"
                        style={{ background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.30)', color: '#f87171' }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Member total footer */}
              <div className="flex items-center justify-between px-4 py-2.5"
                style={{ background: 'rgba(245,158,11,0.06)', borderTop: '1px solid rgba(245,158,11,0.18)' }}>
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Total</span>
                <span className="text-sm font-bold text-amber-400">₹{memberTotal.toFixed(2)}</span>
              </div>
            </div>
          );
        })
      )}

      {/* ── Modal ── */}
      {modal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden" style={modalGlass}>
            <div className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.10)' }}>
              <h2 className="font-bold text-white text-sm">{editId ? 'Edit Charge' : 'Add Charge'}</h2>
              <button onClick={() => setModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)', color: '#94a3b8' }}>
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
              {!editId && (
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
                            background: sel ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.05)',
                            border: sel ? '1px solid rgba(245,158,11,0.45)' : '1px solid rgba(255,255,255,0.10)',
                          }}>
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ background: sel ? 'rgba(245,158,11,0.25)' : abg, color: sel ? '#fbbf24' : acl }}>
                            {nm?.[0]?.toUpperCase()}
                          </div>
                          <p className="text-sm font-medium flex-1" style={{ color: sel ? '#fcd34d' : '#e2e8f0' }}>{nm}</p>
                          {sel && <Check size={14} className="text-amber-400 flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1.5 block">Reason</label>
                <input style={inputStyle} placeholder="e.g. Extra supply, Damage…"
                  value={form.reason} onChange={e => f({ reason: e.target.value })} required />
              </div>

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

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setModal(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-bold active:scale-95 transition-transform"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)', color: '#94a3b8' }}>
                  Cancel
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 py-3 rounded-xl text-sm font-bold active:scale-95 transition-transform"
                  style={{ background: 'rgba(245,158,11,0.25)', border: '1px solid rgba(245,158,11,0.55)', color: '#fbbf24', opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Saving…' : editId ? 'Update' : 'Add Charge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
