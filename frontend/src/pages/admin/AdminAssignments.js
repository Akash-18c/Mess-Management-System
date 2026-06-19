import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, X } from 'lucide-react';
import api from '../../api';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const realName = (name) => { const m = name?.match(/^\w+\s*\((.+)\)$/); return m ? m[1] : name; };

export default function AdminAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [members, setMembers] = useState([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear(), managerId: '' });
  const [loading, setLoading] = useState(false);

  const load = () => Promise.all([
    api.get('/admin/assignments').then(r => setAssignments(r.data)),
    api.get('/admin/members').then(r => setMembers(r.data.filter(m => m.isActive && m.role !== 'admin'))),
  ]);
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editing) {
        await api.put(`/admin/assignments/${editing}`, { managerId: form.managerId });
        toast.success('Manager reassigned');
      } else {
        await api.post('/admin/assignments', form);
        toast.success('Manager assigned');
      }
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Revoke this assignment?')) return;
    await api.delete(`/admin/assignments/${id}`);
    toast.success('Assignment revoked');
    load();
  };

  const openAdd = () => { setEditing(null); setForm({ month: new Date().getMonth() + 1, year: new Date().getFullYear(), managerId: '' }); setModal(true); };
  const openEdit = (a) => { setEditing(a._id); setForm({ month: a.month, year: a.year, managerId: a.managerId._id }); setModal(true); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Manager Assignments</h1>
          <p className="text-slate-400 text-sm">Assign managers per month</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2"><Plus size={16} /> Assign</button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <th className="text-left py-2 px-3 font-medium" style={{ color: '#4a5a7a' }}>Month</th>
              <th className="text-left py-2 px-3 font-medium" style={{ color: '#4a5a7a' }}>Manager</th>
              <th className="text-left py-2 px-3 font-medium hidden md:table-cell" style={{ color: '#4a5a7a' }}>Assigned By</th>
              <th className="text-left py-2 px-3 font-medium hidden sm:table-cell" style={{ color: '#4a5a7a' }}>Date</th>
              <th className="text-right py-2 px-3 font-medium" style={{ color: '#4a5a7a' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map(a => (
              <tr key={a._id} className="transition-colors"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <td className="py-2.5 px-3 text-white font-medium">{MONTHS[a.month - 1]} {a.year}</td>
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold">
                      {realName(a.managerId?.name)?.[0]?.toUpperCase()}
                    </span>
                    <span className="text-white">{realName(a.managerId?.name)}</span>
                  </div>
                </td>
                <td className="py-2.5 px-3 text-slate-400 hidden md:table-cell">{realName(a.assignedBy?.name)}</td>
                <td className="py-2.5 px-3 text-slate-400 hidden sm:table-cell">{new Date(a.assignedAt).toLocaleDateString('en-IN')}</td>
                <td className="py-2.5 px-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => openEdit(a)} className="text-xs btn-amber px-2 py-1">Change</button>
                    <button onClick={() => handleDelete(a._id)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {assignments.length === 0 && (
              <tr><td colSpan={5} className="py-8 text-center text-slate-500">No assignments yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #0d1528 0%, #0a1020 100%)', border: '1px solid rgba(255,255,255,0.10)', boxShadow: '0 32px 80px rgba(0,0,0,0.8)' }}>
            <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <h2 className="font-semibold text-white">{editing ? 'Change Manager' : 'Assign Manager'}</h2>
              <button onClick={() => setModal(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {!editing && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Month</label>
                    <select className="input" value={form.month} onChange={e => setForm({...form, month: +e.target.value})}>
                      {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Year</label>
                    <input className="input" type="number" value={form.year} onChange={e => setForm({...form, year: +e.target.value})} min="2020" max="2030" />
                  </div>
                </div>
              )}
              <div>
                <label className="label">Select Manager</label>
                <select className="input" value={form.managerId} onChange={e => setForm({...form, managerId: e.target.value})} required>
                  <option value="">-- Select Member --</option>
                  {members.map(m => <option key={m._id} value={m._id}>{realName(m.name)} (Room: {m.room})</option>)}
                </select>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
