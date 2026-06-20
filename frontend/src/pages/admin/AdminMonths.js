import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Lock, Unlock, Plus, X, CalendarDays } from 'lucide-react';
import api from '../../api';

const MONTHS_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const rn = (name) => { const m = name?.match(/^\w+\s*\((.+)\)$/); return m ? m[1] : (name || '—'); };

const glass = {
  background: 'rgba(255,255,255,0.03)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(255,255,255,0.07)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
};

const now = new Date();

export default function AdminMonths() {
  const [months, setMonths] = useState([]);
  const [members, setMembers] = useState([]);
  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ month: now.getMonth() + 1, year: now.getFullYear(), managerId: '' });

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
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    } finally { setLoading(false); }
  };

  const closeMonth = async (month, year) => {
    if (!window.confirm(`Lock ${MONTHS_FULL[month - 1]} ${year}? This will prevent manager edits.`)) return;
    try {
      await api.post(`/admin/close-month/${month}/${year}`);
      toast.success('Month locked');
      load();
    } catch { toast.error('Error'); }
  };

  const reopenMonth = async (month, year) => {
    try {
      await api.post(`/admin/close-month/${month}/${year}`, { reopen: true });
      // also set isOpen back
      await api.post(`/admin/open-month/${month}/${year}`, {});
      toast.success('Month re-opened');
      load();
    } catch { toast.error('Error'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays size={20} className="text-teal-400" />
            <h1 className="text-2xl font-bold text-white">Month Control</h1>
          </div>
          <p className="text-slate-400 text-sm mt-0.5 pl-7">Open months for manager access · Lock to finalize</p>
        </div>
        <button onClick={() => { setForm({ month: now.getMonth() + 1, year: now.getFullYear(), managerId: '' }); setModal(true); }}
          className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Open Month
        </button>
      </div>

      {/* Active months */}
      <div>
        <p className="text-xs font-bold text-teal-400 uppercase tracking-widest mb-3 pl-1">Active / Open</p>
        <div className="space-y-2">
          {months.filter(m => m.isOpen && !m.isClosed).length === 0 && (
            <div className="rounded-2xl py-8 text-center text-slate-600 text-sm" style={glass}>No open months — click "Open Month" to give manager access</div>
          )}
          {months.filter(m => m.isOpen && !m.isClosed).map(m => (
            <div key={`${m.month}-${m.year}`} className="rounded-2xl p-4 flex items-center justify-between gap-3" style={{ ...glass, border: '1px solid rgba(52,211,153,0.20)' }}>
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
                <div>
                  <p className="text-white font-semibold">{MONTHS_FULL[m.month - 1]} {m.year}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Manager: <span className="text-slate-300">{m.manager ? rn(m.manager.name) : <span className="text-slate-600">Unassigned</span>}</span>
                    {m.openedAt && <span className="ml-2">· Opened {new Date(m.openedAt).toLocaleDateString('en-IN')}</span>}
                  </p>
                </div>
              </div>
              <button onClick={() => closeMonth(m.month, m.year)}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl"
                style={{ background: 'rgba(248,113,113,0.10)', color: '#f87171', border: '1px solid rgba(248,113,113,0.20)' }}>
                <Lock size={12} /> Lock
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Closed months */}
      {months.filter(m => m.isClosed).length > 0 && (
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 pl-1">Locked</p>
          <div className="rounded-2xl overflow-hidden" style={glass}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                  {['Month', 'Manager', 'Locked On', ''].map(h => (
                    <th key={h} className="py-2.5 px-4 text-left text-slate-500 font-semibold text-xs uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {months.filter(m => m.isClosed).map(m => (
                  <tr key={`${m.month}-${m.year}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Lock size={12} className="text-red-400 flex-shrink-0" />
                        <span className="text-white font-medium">{MONTHS_FULL[m.month - 1]} {m.year}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-400">{m.manager ? rn(m.manager.name) : '—'}</td>
                    <td className="py-3 px-4 text-slate-500 text-xs">{m.closedAt ? new Date(m.closedAt).toLocaleDateString('en-IN') : '—'}</td>
                    <td className="py-3 px-4">
                      <button onClick={() => reopenMonth(m.month, m.year)}
                        className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg"
                        style={{ background: 'rgba(52,211,153,0.08)', color: '#34d399', border: '1px solid rgba(52,211,153,0.18)' }}>
                        <Unlock size={11} /> Re-open
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
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
