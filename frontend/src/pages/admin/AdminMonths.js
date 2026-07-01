import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Lock, Unlock, Plus, X, CalendarDays, Sparkles } from 'lucide-react';
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

const now = new Date();

export default function AdminMonths() {
  const [months,  setMonths]  = useState([]);
  const [members, setMembers] = useState([]);
  const [modal,   setModal]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [form,    setForm]    = useState({ month: now.getMonth() + 1, year: now.getFullYear(), managerId: '' });

  const load = () => {
    api.get('/admin/months').then(r => setMonths(r.data)).catch(() => {});
    api.get('/admin/members').then(r => setMembers(r.data.filter(m => m.isActive && m.role !== 'admin'))).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const openMonth = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post(`/admin/open-month/${form.month}/${form.year}`, { managerId: form.managerId || undefined });
      toast.success(`${MONTHS_FULL[form.month - 1]} ${form.year} opened`);
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
          onClick={() => { setForm({ month: now.getMonth() + 1, year: now.getFullYear(), managerId: '' }); setModal(true); }}
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
              <button onClick={() => closeMonth(m.month, m.year)}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl flex-shrink-0"
                style={{ background: 'rgba(248,113,113,0.10)', color: '#f87171', border: '1px solid rgba(248,113,113,0.22)' }}>
                <Lock size={12} /> Lock
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Locked Months ── */}
      {closedMonths.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5 pl-1">Locked</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {closedMonths.map(m => (
              <div key={`${m.month}-${m.year}`} className="rounded-2xl p-4" style={glass}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.20)' }}>
                      <Lock size={13} style={{ color: '#f87171' }} />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{MONTHS_FULL[m.month - 1].slice(0,3)} {m.year}</p>
                      <span className="badge-closed text-[10px]">Closed</span>
                    </div>
                  </div>
                  <button onClick={() => reopenMonth(m.month, m.year)}
                    className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-xl flex-shrink-0"
                    style={{ background: 'rgba(52,211,153,0.08)', color: '#34d399', border: '1px solid rgba(52,211,153,0.20)' }}>
                    <Unlock size={11} /> Re-open
                  </button>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <div>
                    <p className="text-slate-600 mb-0.5">Manager</p>
                    <p className="text-slate-300 font-medium truncate max-w-[100px]">{m.manager ? rn(m.manager.name) : '—'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-600 mb-0.5">Locked On</p>
                    <p className="text-slate-400">{m.closedAt ? new Date(m.closedAt).toLocaleDateString('en-IN') : '—'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Modal ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg,#0d1528,#0a1020)', border: '1px solid rgba(255,255,255,0.10)', boxShadow: '0 32px 80px rgba(0,0,0,0.8)' }}>
            <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <h2 className="font-semibold text-white">Open Month for Manager</h2>
              <button onClick={() => setModal(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={openMonth} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Month</label>
                  <select className="input" value={form.month} onChange={e => setForm({ ...form, month: +e.target.value })}>
                    {MONTHS_FULL.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Year</label>
                  <input className="input" type="number" value={form.year} onChange={e => setForm({ ...form, year: +e.target.value })} min="2020" max="2030" />
                </div>
              </div>
              <div>
                <label className="label">Assign Manager <span className="text-slate-600">(optional)</span></label>
                <select className="input" value={form.managerId} onChange={e => setForm({ ...form, managerId: e.target.value })}>
                  <option value="">-- Select Member --</option>
                  {members.map(m => <option key={m._id} value={m._id}>{rn(m.name)} (Room: {m.room})</option>)}
                </select>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1" disabled={loading}>{loading ? 'Opening…' : 'Open Month'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
