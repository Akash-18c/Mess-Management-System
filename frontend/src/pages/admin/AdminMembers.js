import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, UserCheck, UserX, Trash2, X, ShieldCheck } from 'lucide-react';
import api from '../../api';

const EMPTY = { name: '', email: '', password: '', phone: '', room: '', joinDate: '', role: 'member' };

export default function AdminMembers() {
  const [members, setMembers] = useState([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const load = () => api.get('/admin/members').then(r => setMembers(r.data));
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm(EMPTY); setModal(true); };
  const openEdit = (m) => {
    setEditing(m._id);
    setForm({ name: m.name, email: m.email, password: '', phone: m.phone || '', room: m.room || '', joinDate: m.joinDate?.slice(0, 10) || '', role: m.role });
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editing) {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        await api.put(`/admin/members/${editing}`, payload);
        toast.success('Member updated');
      } else {
        await api.post('/admin/members', form);
        toast.success('Member added');
      }
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (m) => {
    await api.put(`/admin/members/${m._id}`, { isActive: !m.isActive });
    toast.success(m.isActive ? 'Member disabled' : 'Member enabled');
    load();
  };

  const hardDelete = async (id) => {
    try {
      await api.delete(`/admin/members/${id}`);
      toast.success('Member deleted');
      setDeleteConfirm(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting');
    }
  };

  const roleBadge = (role) => {
    if (role === 'admin') return <span className="badge-admin">Admin</span>;
    if (role === 'manager') return <span className="badge-manager">Manager</span>;
    return <span className="badge-member">Member</span>;
  };

  // Extract real name from "Admin (Real Name)" or "Manager (Real Name)" format
  const realName = (name, role) => {
    const match = name?.match(/^\w+\s*\((.+)\)$/);
    return match ? match[1] : name;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Members</h1>
          <p className="text-slate-400 text-sm">Full control — edit, role change, enable/disable, delete</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Member
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <th className="text-left py-2 px-3 font-medium" style={{ color: '#4a5a7a' }}>Name</th>
              <th className="text-left py-2 px-3 font-medium hidden md:table-cell" style={{ color: '#4a5a7a' }}>Email</th>
              <th className="text-left py-2 px-3 font-medium hidden sm:table-cell" style={{ color: '#4a5a7a' }}>Room</th>
              <th className="text-left py-2 px-3 font-medium" style={{ color: '#4a5a7a' }}>Role</th>
              <th className="text-center py-2 px-3 font-medium" style={{ color: '#4a5a7a' }}>Status</th>
              <th className="text-right py-2 px-3 font-medium" style={{ color: '#4a5a7a' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map(m => (
              <tr key={m._id} className={`transition-colors ${!m.isActive ? 'opacity-50' : ''}`}
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-600 flex items-center justify-center text-xs font-bold text-white">
                      {realName(m.name, m.role)?.[0]?.toUpperCase()}
                    </div>
                    <span className="text-white font-medium">{realName(m.name, m.role)}</span>
                  </div>
                </td>
                <td className="py-2.5 px-3 text-slate-300 hidden md:table-cell">{m.email}</td>
                <td className="py-2.5 px-3 text-slate-300 hidden sm:table-cell">{m.room || '—'}</td>
                <td className="py-2.5 px-3">{roleBadge(m.role)}</td>
                <td className="py-2.5 px-3 text-center">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${m.isActive ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'}`}>
                    {m.isActive ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button onClick={() => openEdit(m)} title="Edit" className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-600 rounded-lg transition-colors">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => toggleActive(m)} title={m.isActive ? 'Disable' : 'Enable'}
                      className={`p-1.5 rounded-lg transition-colors ${m.isActive ? 'text-amber-400 hover:bg-amber-500/10' : 'text-green-400 hover:bg-green-500/10'}`}>
                      {m.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                    </button>
                    {m.role !== 'admin' && (
                      <button onClick={() => setDeleteConfirm(m)} title="Delete" className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {members.length === 0 && (
              <tr><td colSpan={6} className="py-8 text-center text-slate-500">No members yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit/Add Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #0d1528 0%, #0a1020 100%)', border: '1px solid rgba(255,255,255,0.10)', boxShadow: '0 32px 80px rgba(0,0,0,0.8)' }}>
            <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <h2 className="font-semibold text-white">{editing ? 'Edit Member' : 'Add Member'}</h2>
              <button onClick={() => setModal(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Name</label>
                  <input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input className="input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
                </div>
                <div>
                  <label className="label">{editing ? 'New Password' : 'Password'}</label>
                  <input className="input" type="password" placeholder={editing ? 'Leave blank to keep' : 'mess1234'} value={form.password} onChange={e => setForm({...form, password: e.target.value})} required={!editing} />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input className="input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                </div>
                <div>
                  <label className="label">Room</label>
                  <input className="input" value={form.room} onChange={e => setForm({...form, room: e.target.value})} />
                </div>
                <div>
                  <label className="label">Join Date</label>
                  <input className="input" type="date" value={form.joinDate} onChange={e => setForm({...form, joinDate: e.target.value})} />
                </div>
                <div className="col-span-2">
                  <label className="label flex items-center gap-1.5"><ShieldCheck size={13} />Role</label>
                  <select className="input" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                    <option value="member">Member</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-sm p-6 space-y-4 rounded-2xl" style={{ background: 'linear-gradient(135deg, #0d1528 0%, #0a1020 100%)', border: '1px solid rgba(239,68,68,0.25)', boxShadow: '0 32px 80px rgba(0,0,0,0.8)' }}>
            <h2 className="font-semibold text-white">Delete Member</h2>
            <p className="text-slate-400 text-sm">Permanently delete <span className="text-white font-medium">{deleteConfirm.name}</span>? This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={() => hardDelete(deleteConfirm._id)} className="btn-danger flex-1">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
