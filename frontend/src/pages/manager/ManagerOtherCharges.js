import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, Pencil, X, Receipt } from 'lucide-react';
import api from '../../api';

const now = new Date();
const MONTH = now.getMonth() + 1;
const YEAR  = now.getFullYear();
const rn = (name) => { const m = name?.match(/^\w+\s*\((.+)\)$/); return m ? m[1] : (name || '—'); };

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
  boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
};

const EMPTY = { memberId: '', reason: '', amount: '', date: now.toISOString().slice(0, 10) };

export default function ManagerOtherCharges() {
  const [charges,  setCharges]  = useState([]);
  const [members,  setMembers]  = useState([]);
  const [modal,    setModal]    = useState(false);
  const [editId,   setEditId]   = useState(null);
  const [form,     setForm]     = useState(EMPTY);
  const [loading,  setLoading]  = useState(false);

  const f = v => setForm(p => ({ ...p, ...v }));

  const load = useCallback(() => {
    api.get(`/expenses/charges/${MONTH}/${YEAR}`).then(r => setCharges(r.data)).catch(() => {});
    api.get('/members').then(r => setMembers(r.data.filter(m => m.isActive && m.role !== 'admin'))).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditId(null); setForm(EMPTY); setModal(true); };
  const openEdit = (c) => {
    setEditId(c._id);
    setForm({ memberId: c.memberId._id || c.memberId, reason: c.reason, amount: c.amount, date: c.date?.slice(0, 10) || now.toISOString().slice(0, 10) });
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

  // Group charges by member
  const grouped = {};
  charges.forEach(c => {
    const mid = c.memberId?._id || c.memberId;
    if (!grouped[mid]) grouped[mid] = { member: c.memberId, items: [] };
    grouped[mid].items.push(c);
  });

  const total = charges.reduce((s, c) => s + c.amount, 0);

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 rounded-2xl p-3 px-4" style={glass}>
        <div>
          <h1 className="text-base font-bold text-white leading-tight">Other Charges</h1>
          <p className="text-[10px] text-slate-500 mt-0.5">Individual charges per member · ₹{total.toFixed(0)} total</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-1.5 text-xs font-semibold text-white px-3 py-2 rounded-xl active:scale-95"
          style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', WebkitTapHighlightColor: 'transparent', transition: 'transform 0.1s' }}>
          <Plus size={14} /> Add
        </button>
      </div>

      {/* Member Cards */}
      {Object.keys(grouped).length === 0 ? (
        <div className="rounded-2xl py-14 flex flex-col items-center gap-3" style={glass}>
          <Receipt size={36} className="text-slate-600" />
          <p className="text-slate-500 text-sm">No other charges yet</p>
          <p className="text-slate-600 text-xs">Tap Add to add a charge for a member</p>
        </div>
      ) : (
        Object.values(grouped).map(({ member, items }) => {
          const name = rn(member?.name);
          const memberTotal = items.reduce((s, c) => s + c.amount, 0);
          return (
            <div key={member?._id} className="rounded-2xl overflow-hidden" style={glass}>
              {/* Member header */}
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(245,158,11,0.06)' }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: 'rgba(245,158,11,0.20)', border: '1px solid rgba(245,158,11,0.30)' }}>
                    {name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{name}</p>
                    {member?.room && <p className="text-[10px] text-slate-500">Room {member.room}</p>}
                  </div>
                </div>
                <span className="text-sm font-bold text-amber-400">₹{memberTotal.toFixed(0)}</span>
              </div>

              {/* Charge rows */}
              <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                {items.map(c => (
                  <div key={c._id} className="flex items-center justify-between px-4 py-2.5 gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-xs font-medium truncate">{c.reason}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{new Date(c.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-bold text-amber-400">₹{c.amount.toFixed(0)}</span>
                      <button onClick={() => openEdit(c)} className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: 'rgba(96,165,250,0.10)', WebkitTapHighlightColor: 'transparent' }}>
                        <Pencil size={12} className="text-blue-400" />
                      </button>
                      <button onClick={() => del(c._id)} className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: 'rgba(248,113,113,0.10)', WebkitTapHighlightColor: 'transparent' }}>
                        <Trash2 size={12} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden" style={modalGlass}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <h2 className="font-bold text-white text-sm">{editId ? '✏️ Edit Charge' : '💰 Add Other Charge'}</h2>
              <button onClick={() => setModal(false)} className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400"
                style={{ background: 'rgba(255,255,255,0.06)', WebkitTapHighlightColor: 'transparent' }}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
              {!editId && (
                <div>
                  <label className="label text-xs mb-2">Member</label>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                    {members.map(m => {
                      const name = rn(m.name);
                      const sel = form.memberId === m._id;
                      return (
                        <button key={m._id} type="button" onClick={() => f({ memberId: m._id })}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
                          style={{
                            background: sel ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)',
                            border: sel ? '1px solid rgba(245,158,11,0.40)' : '1px solid rgba(255,255,255,0.07)',
                            WebkitTapHighlightColor: 'transparent',
                          }}>
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ background: sel ? 'rgba(245,158,11,0.25)' : 'rgba(255,255,255,0.08)', color: sel ? '#fbbf24' : '#94a3b8' }}>
                            {name?.[0]?.toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate" style={{ color: sel ? '#fcd34d' : '#e2e8f0' }}>{name}</p>
                            {m.room && <p className="text-[10px] text-slate-500">Room {m.room}</p>}
                          </div>
                          {sel && <span className="text-amber-400 text-xs font-bold flex-shrink-0">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              <div>
                <label className="label text-xs">Reason / Description</label>
                <input className="input" placeholder="e.g. Extra supply, Damage, etc." value={form.reason} onChange={e => f({ reason: e.target.value })} required />
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
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1 text-sm">Cancel</button>
                <button type="submit" className="btn-primary flex-1 text-sm" disabled={loading}>{loading ? 'Saving…' : editId ? 'Update' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
