import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Lock, Unlock, Plus, X, CalendarDays, Sparkles, Pencil, Trash2, UserCog } from 'lucide-react';
import api from '../../api';

const MONTHS_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const rn = (name) => { const m = name?.match(/^\w+\s*\((.+)\)$/); return m ? m[1] : (name || '—'); };

const glass = {
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(32px)',
  WebkitBackdropFilter: 'blur(32px)',
  border: '1px solid rgba(255,255,255,0.09)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07)',
};

const modalGlass = {
  background: 'rgba(10,15,30,0.96)',
  backdropFilter: 'blur(48px)',
  WebkitBackdropFilter: 'blur(48px)',
  border: '1px solid rgba(255,255,255,0.12)',
  boxShadow: '0 24px 64px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.08)',
};

const now = new Date();

export default function AdminMonths() {
  const [months,  setMonths]  = useState([]);
  const [members, setMembers] = useState([]);
  const [modal,   setModal]   = useState(false);   // 'add' | 'edit' | false
  const [editTarget, setEditTarget] = useState(null); // month object being edited
  const [loading, setLoading] = useState(false);
  const [delConfirm, setDelConfirm] = useState(null);
  const [form, setForm] = useState({ month: now.getMonth() + 1, year: now.getFullYear(), managerId: '' });

  const load = () => {
    api.get('/admin/months').then(r => setMonths(r.data)).catch(() => {});
    api.get('/admin/members').then(r => setMembers(r.data.filter(m => m.isActive && m.role !== 'admin'))).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditTarget(null);
    setForm({ month: now.getMonth() + 1, year: now.getFullYear(), managerId: '' });
    setModal('add');
  };

  const openEdit = (m) => {
    setEditTarget(m);
    setForm({ month: m.month, year: m.year, managerId: m.manager?._id || '' });
    setModal('edit');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (modal === 'edit') {
        // reassign manager on existing open month
        await api.post(`/admin/open-month/${editTarget.month}/${editTarget.year}`, { managerId: form.managerId || undefined });
        toast.success('Manager updated');
      } else {
        await api.post(`/admin/open-month/${form.month}/${form.year}`, { managerId: form.managerId || undefined });
        toast.success(`${MONTHS_FULL[form.month - 1]} ${form.year} opened`);
      }
      setModal(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setLoading(false); }
  };

  const closeMonth = async (month, year) => {
    if (!window.confirm(`Lock ${MONTHS_FULL[month - 1]} ${year}? This will prevent manager edits.`)) return;
    try { await api.post(`/admin/close-month/${month}/${year}`); toast.success('Month locked'); load(); }
    catch { toast.error('Error'); }
  };

  const reopenMonth = async (month, year) => {
    try {
      await api.post(`/admin/close-month/${month}/${year}`, { reopen: true });
      await api.post(`/admin/open-month/${month}/${year}`, {});
      toast.success('Month re-opened'); load();
    } catch { toast.error('Error'); }
  };

  const deleteMonth = async (m) => {
    try {
      await api.delete(`/admin/months/${m.month}/${m.year}`);
      toast.success('Month deleted');
      setDelConfirm(null); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Cannot delete'); }
  };

  const openMonths   = months.filter(m => m.isOpen && !m.isClosed);
  const closedMonths = months.filter(m => m.isClosed);

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="rounded-2xl p-4 px-5 flex items-center justify-between gap-3" style={glass}>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Sparkles size={15} style={{ color: '#2dd4bf' }} className="flex-shrink-0" />
            <h1 style={{
              fontFamily: "'Dancing Script', cursive",
              fontSize: 'clamp(1.3rem,5vw,1.8rem)', fontWeight: 700,
              background: 'linear-gradient(135deg,#ffffff 0%,#99f6e4 40%,#2dd4bf 75%,#0d9488 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              lineHeight: 1.2,
            }}>Month Control</h1>
          </div>
          <p className="text-slate-500 text-[11px] mt-0.5 pl-5">Open months for manager access · Lock to finalize</p>
        </div>
        <button
          onClick={openAdd}
          className="btn-primary flex items-center gap-1.5 text-xs px-3 py-2 flex-shrink-0"
        >
          <Plus size={14} /> Open Month
        </button>
      </div>

      {/* ── Active / Open ── */}
      <div>
        <p className="text-[10px] font-bold text-teal-400 uppercase tracking-widest mb-2.5 pl-1">Active / Open</p>
        <div className="space-y-2">
          {openMonths.length === 0 && (
            <div className="rounded-2xl py-8 text-center text-slate-600 text-sm" style={glass}>
              No open months — click "Open Month" to give manager access
            </div>
          )}
          {openMonths.map(m => (
            <div key={`${m.month}-${m.year}`} className="rounded-2xl p-4 flex items-center justify-between gap-3"
              style={{ ...glass, border: '1px solid rgba(52,211,153,0.22)', background: 'rgba(52,211,153,0.05)' }}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.25)' }}>
                  <CalendarDays size={16} style={{ color: '#34d399' }} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
                    <p className="text-white font-semibold text-sm">{MONTHS_FULL[m.month - 1]} {m.year}</p>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                    Manager: <span className="text-slate-300">{m.manager ? rn(m.manager.name) : <span className="text-slate-600">Unassigned</span>}</span>
                    {m.openedAt && <span className="ml-2">· {new Date(m.openedAt).toLocaleDateString('en-IN')}</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button onClick={() => openEdit(m)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(96,165,250,0.10)', border: '1px solid rgba(96,165,250,0.20)', WebkitTapHighlightColor: 'transparent' }}
                  title="Edit / Reassign Manager">
                  <Pencil size={13} className="text-blue-400" />
                </button>
                <button onClick={() => closeMonth(m.month, m.year)}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl"
                  style={{ background: 'rgba(248,113,113,0.10)', color: '#f87171', border: '1px solid rgba(248,113,113,0.22)' }}>
                  <Lock size={12} /> Lock
                </button>
                <button onClick={() => setDelConfirm(m)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(248,113,113,0.10)', border: '1px solid rgba(248,113,113,0.20)', WebkitTapHighlightColor: 'transparent' }}>
                  <Trash2 size={13} className="text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Locked Months — Table ── */}
      {closedMonths.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5 pl-1">Locked</p>
          <div className="rounded-2xl overflow-hidden" style={glass}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Month</th>
                    <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Manager</th>
                    <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Locked On</th>
                    <th className="text-right py-2.5 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {closedMonths.map(m => (
                    <tr key={`${m.month}-${m.year}`}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.20)' }}>
                            <Lock size={11} style={{ color: '#f87171' }} />
                          </div>
                          <div>
                            <p className="text-white font-semibold text-sm">{MONTHS_FULL[m.month - 1]} {m.year}</p>
                            <span className="badge-closed text-[10px]">Closed</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {m.manager ? (
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {rn(m.manager.name)?.[0]?.toUpperCase()}
                            </span>
                            <span className="text-slate-300 text-sm">{rn(m.manager.name)}</span>
                          </div>
                        ) : <span className="text-slate-600 text-sm">—</span>}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-sm hidden sm:table-cell">
                        {m.closedAt ? new Date(m.closedAt).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => reopenMonth(m.month, m.year)}
                            className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-xl"
                            style={{ background: 'rgba(52,211,153,0.08)', color: '#34d399', border: '1px solid rgba(52,211,153,0.20)' }}>
                            <Unlock size={11} /> Re-open
                          </button>
                          <button onClick={() => setDelConfirm(m)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center"
                            style={{ background: 'rgba(248,113,113,0.10)', border: '1px solid rgba(248,113,113,0.18)', WebkitTapHighlightColor: 'transparent' }}>
                            <Trash2 size={12} className="text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Add / Edit Modal ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
          <div className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl overflow-hidden" style={modalGlass}>

            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-2">
                {modal === 'edit' ? <UserCog size={16} className="text-blue-400" /> : <CalendarDays size={16} className="text-teal-400" />}
                <h2 className="font-bold text-white text-sm">
                  {modal === 'edit' ? `Edit — ${MONTHS_FULL[editTarget.month - 1]} ${editTarget.year}` : 'Open Month'}
                </h2>
              </div>
              <button onClick={() => setModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400"
                style={{ background: 'rgba(255,255,255,0.06)', WebkitTapHighlightColor: 'transparent' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
              {modal === 'add' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label text-xs">Month</label>
                    <div className="relative">
                      <select className="input appearance-none pr-8 cursor-pointer" value={form.month}
                        onChange={e => setForm({ ...form, month: +e.target.value })}>
                        {MONTHS_FULL.map((mn, i) => <option key={i} value={i + 1}>{mn}</option>)}
                      </select>
                      <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">▾</div>
                    </div>
                  </div>
                  <div>
                    <label className="label text-xs">Year</label>
                    <input className="input" type="number" value={form.year}
                      onChange={e => setForm({ ...form, year: +e.target.value })} min="2020" max="2030" />
                  </div>
                </div>
              )}

              <div>
                <label className="label text-xs">
                  {modal === 'edit' ? 'Reassign Manager' : 'Assign Manager'}
                  <span className="text-slate-600 font-normal ml-1">(optional)</span>
                </label>
                <div className="relative">
                  <select className="input appearance-none pr-8 cursor-pointer" value={form.managerId}
                    onChange={e => setForm({ ...form, managerId: e.target.value })}>
                    <option value="">— No Manager —</option>
                    {members.map(m => (
                      <option key={m._id} value={m._id}>
                        {rn(m.name)}{m.room ? ` · Room ${m.room}` : ''}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">▾</div>
                </div>
                {members.length === 0 && (
                  <p className="text-[11px] text-slate-600 mt-1">No active members found</p>
                )}
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1 text-sm">Cancel</button>
                <button type="submit" className="btn-primary flex-1 text-sm" disabled={loading}>
                  {loading ? 'Saving…' : modal === 'edit' ? 'Update' : 'Open Month'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ── */}
      {delConfirm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
          <div className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl p-5 space-y-4" style={modalGlass}>
            <h2 className="font-bold text-white">Delete Month?</h2>
            <p className="text-slate-400 text-sm">
              Permanently delete <span className="text-white font-medium">{MONTHS_FULL[delConfirm.month - 1]} {delConfirm.year}</span>?
              This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDelConfirm(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={() => deleteMonth(delConfirm)} className="btn-danger flex-1">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
