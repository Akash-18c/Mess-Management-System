import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, UserCheck, UserX, Trash2, X, ShieldCheck, Users, Sparkles } from 'lucide-react';
import api from '../../api';

const EMPTY = { name: '', email: '', password: '', phone: '', room: '', joinDate: '', role: 'member' };

const glass = {
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(32px)',
  WebkitBackdropFilter: 'blur(32px)',
  border: '1px solid rgba(255,255,255,0.09)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07)',
};

const realName = (name) => { const m = name?.match(/^\w+\s*\((.+)\)$/); return m ? m[1] : (name || ''); };

const roleAccent = {
  admin:   { bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.25)',   text: '#f87171',  avatarBg: 'rgba(239,68,68,0.15)'   },
  manager: { bg: 'rgba(245,158,11,0.10)',  border: 'rgba(245,158,11,0.22)',  text: '#fbbf24',  avatarBg: 'rgba(245,158,11,0.15)'  },
  member:  { bg: 'rgba(20,184,166,0.08)',  border: 'rgba(20,184,166,0.18)',  text: '#2dd4bf',  avatarBg: 'rgba(20,184,166,0.15)'  },
};

export default function AdminMembers() {
  const [members,       setMembers]       = useState([]);
  const [modal,         setModal]         = useState(false);
  const [editing,       setEditing]       = useState(null);
  const [form,          setForm]          = useState(EMPTY);
  const [loading,       setLoading]       = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const load = () => api.get('/admin/members').then(r => setMembers(r.data));
  useEffect(() => { load(); }, []);

  const openAdd  = () => { setEditing(null); setForm(EMPTY); setModal(true); };
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
      setModal(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setLoading(false); }
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
      setDeleteConfirm(null); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error deleting'); }
  };

  const active   = members.filter(m => m.isActive);
  const inactive = members.filter(m => !m.isActive);

  const MemberCard = ({ m }) => {
    const ac = roleAccent[m.role] || roleAccent.member;
    return (
      <div className="rounded-2xl p-4 transition-all" style={{ ...glass, opacity: m.isActive ? 1 : 0.55 }}>
        {/* Top row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{ background: ac.avatarBg, border: `1px solid ${ac.border}`, color: ac.text }}>
              {realName(m.name)?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm truncate">{realName(m.name)}</p>
              <p className="text-slate-500 text-[11px] truncate">{m.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {m.role === 'admin'   && <span className="badge-admin   text-[10px]">Admin</span>}
            {m.role === 'manager' && <span className="badge-manager text-[10px]">Manager</span>}
            {m.role === 'member'  && <span className="badge-member  text-[10px]">Member</span>}
          </div>
        </div>

        {/* Info row */}
        <div className="flex items-center gap-3 mb-3 text-[11px] text-slate-500">
          {m.room && <span className="flex items-center gap-1">🚪 Room {m.room}</span>}
          {m.phone && <span className="flex items-center gap-1">📞 {m.phone}</span>}
          <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-semibold ${m.isActive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
            {m.isActive ? 'Active' : 'Disabled'}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={() => openEdit(m)}
            className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-xl flex-1 justify-center"
            style={{ background: 'rgba(99,102,241,0.10)', color: '#a78bfa', border: '1px solid rgba(99,102,241,0.20)' }}>
            <Pencil size={12} /> Edit
          </button>
          <button onClick={() => toggleActive(m)}
            className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-xl flex-1 justify-center"
            style={{ background: m.isActive ? 'rgba(245,158,11,0.10)' : 'rgba(52,211,153,0.10)', color: m.isActive ? '#fbbf24' : '#34d399', border: `1px solid ${m.isActive ? 'rgba(245,158,11,0.20)' : 'rgba(52,211,153,0.20)'}` }}>
            {m.isActive ? <><UserX size={12} /> Disable</> : <><UserCheck size={12} /> Enable</>}
          </button>
          {m.role !== 'admin' && (
            <button onClick={() => setDeleteConfirm(m)}
              className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-xl"
              style={{ background: 'rgba(248,113,113,0.10)', color: '#f87171', border: '1px solid rgba(248,113,113,0.20)' }}>
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>
    );
  };

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
            }}>Members</h1>
          </div>
          <p className="text-slate-500 text-[11px] mt-0.5 pl-5">
            {active.length} active · {inactive.length} disabled
          </p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-1.5 text-xs px-3 py-2 flex-shrink-0">
          <Plus size={14} /> Add Member
        </button>
      </div>

      {/* ── Active Members ── */}
      {active.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-teal-400 uppercase tracking-widest mb-2.5 pl-1 flex items-center gap-1.5">
            <Users size={11} /> Active Members
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {active.map(m => <MemberCard key={m._id} m={m} />)}
          </div>
        </div>
      )}

      {/* ── Disabled Members ── */}
      {inactive.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2.5 pl-1">Disabled</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {inactive.map(m => <MemberCard key={m._id} m={m} />)}
          </div>
        </div>
      )}

      {members.length === 0 && (
        <div className="rounded-2xl py-12 text-center text-slate-600 text-sm" style={glass}>No members yet</div>
      )}

      {/* ── Add / Edit Modal ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg,#0d1528,#0a1020)', border: '1px solid rgba(255,255,255,0.10)', boxShadow: '0 32px 80px rgba(0,0,0,0.8)' }}>
            <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <h2 className="font-semibold text-white">{editing ? 'Edit Member' : 'Add Member'}</h2>
              <button onClick={() => setModal(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
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
                <button type="submit" className="btn-primary flex-1" disabled={loading}>{loading ? 'Saving…' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-sm p-6 space-y-4 rounded-2xl" style={{ background: 'linear-gradient(135deg,#0d1528,#0a1020)', border: '1px solid rgba(239,68,68,0.25)', boxShadow: '0 32px 80px rgba(0,0,0,0.8)' }}>
            <h2 className="font-semibold text-white">Delete Member</h2>
            <p className="text-slate-400 text-sm">Permanently delete <span className="text-white font-medium">{realName(deleteConfirm.name)}</span>? This cannot be undone.</p>
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
