import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, UserCheck, UserX, Trash2, X, ShieldCheck, Sparkles, KeyRound, Eye, EyeOff, Lock } from 'lucide-react';
import api from '../../api';

const EMPTY = { name: '', email: '', password: '', phone: '', room: '', joinDate: '', role: 'member' };

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

const realName = (name) => { const m = name?.match(/^\w+\s*\((.+)\)$/); return m ? m[1] : (name || ''); };

const roleAccent = {
  admin:   { avatarBg: 'rgba(239,68,68,0.15)',  border: 'rgba(239,68,68,0.25)',   text: '#f87171' },
  manager: { avatarBg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.22)',  text: '#fbbf24' },
  member:  { avatarBg: 'rgba(20,184,166,0.15)', border: 'rgba(20,184,166,0.18)',  text: '#2dd4bf' },
};

export default function AdminMembers() {
  const [members,       setMembers]       = useState([]);
  const [modal,         setModal]         = useState(false);
  const [editing,       setEditing]       = useState(null);
  const [form,          setForm]          = useState(EMPTY);
  const [loading,       setLoading]       = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [pinModal,      setPinModal]      = useState(false);
  const [pin,           setPin]           = useState('');
  const [pinError,      setPinError]      = useState('');
  const [credentials,   setCredentials]   = useState(null);
  const [showPassMap,   setShowPassMap]   = useState({});

  const load = async () => { try { const r = await api.get('/admin/members'); setMembers(r.data); } catch {} };

  const openCredentials = () => { setPinModal(true); setPin(''); setPinError(''); };
  const submitPin = async () => {
    if (pin !== '99077') { setPinError('Incorrect code. Try again.'); setPin(''); return; }
    try {
      const r = await api.get('/admin/credentials');
      setCredentials(r.data);
      setPinModal(false);
    } catch { setPinError('Failed to load credentials.'); }
  };

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

  const MemberTable = ({ rows, label, labelColor }) => (
    <div>
      <p className={`text-[10px] font-bold uppercase tracking-widest mb-2.5 pl-1`} style={{ color: labelColor }}>{label}</p>
      <div className="rounded-2xl overflow-hidden" style={glass}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Member</th>
                <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Room</th>
                <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Phone</th>
                <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Role</th>
                <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="text-right py-2.5 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(m => {
                const ac = roleAccent[m.role] || roleAccent.member;
                return (
                  <tr key={m._id}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', opacity: m.isActive ? 1 : 0.55 }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ background: ac.avatarBg, border: `1px solid ${ac.border}`, color: ac.text }}>
                          {realName(m.name)?.[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-semibold text-sm truncate">{realName(m.name)}</p>
                          <p className="text-slate-500 text-[11px] truncate">{m.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-sm hidden sm:table-cell">{m.room || '—'}</td>
                    <td className="py-3 px-4 text-slate-400 text-sm hidden md:table-cell">{m.phone || '—'}</td>
                    <td className="py-3 px-4">
                      {m.role === 'admin'   && <span className="badge-admin   text-[10px]">Admin</span>}
                      {m.role === 'manager' && <span className="badge-manager text-[10px]">Manager</span>}
                      {m.role === 'member'  && <span className="badge-member  text-[10px]">Member</span>}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${m.isActive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {m.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => openEdit(m)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ background: 'rgba(99,102,241,0.10)', border: '1px solid rgba(99,102,241,0.20)', WebkitTapHighlightColor: 'transparent' }}
                          title="Edit">
                          <Pencil size={12} className="text-violet-400" />
                        </button>
                        <button onClick={() => toggleActive(m)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ background: m.isActive ? 'rgba(245,158,11,0.10)' : 'rgba(52,211,153,0.10)', border: `1px solid ${m.isActive ? 'rgba(245,158,11,0.20)' : 'rgba(52,211,153,0.20)'}`, WebkitTapHighlightColor: 'transparent' }}
                          title={m.isActive ? 'Disable' : 'Enable'}>
                          {m.isActive ? <UserX size={12} className="text-amber-400" /> : <UserCheck size={12} className="text-teal-400" />}
                        </button>
                        {m.role !== 'admin' && (
                          <button onClick={() => setDeleteConfirm(m)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center"
                            style={{ background: 'rgba(248,113,113,0.10)', border: '1px solid rgba(248,113,113,0.20)', WebkitTapHighlightColor: 'transparent' }}
                            title="Delete">
                            <Trash2 size={12} className="text-red-400" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

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
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={openCredentials} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl flex-shrink-0"
            style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.25)', color: '#fbbf24', WebkitTapHighlightColor: 'transparent' }}>
            <Eye size={13} /> View Credentials
          </button>
          <button onClick={openAdd} className="btn-primary flex items-center gap-1.5 text-xs px-3 py-2 flex-shrink-0">
            <Plus size={14} /> Add Member
          </button>
        </div>
      </div>

      {members.length === 0 && (
        <div className="rounded-2xl py-12 text-center text-slate-600 text-sm" style={glass}>No members yet</div>
      )}

      {active.length > 0 && <MemberTable rows={active} label="Active Members" labelColor="#2dd4bf" />}
      {inactive.length > 0 && <MemberTable rows={inactive} label="Disabled" labelColor="#475569" />}

      {/* ── Add / Edit Modal ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden" style={modalGlass}>

            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <h2 className="font-bold text-white text-sm">{editing ? '✏️ Edit Member' : '👤 Add Member'}</h2>
              <button onClick={() => setModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400"
                style={{ background: 'rgba(255,255,255,0.06)', WebkitTapHighlightColor: 'transparent' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label text-xs">Name</label>
                  <input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                </div>
                <div>
                  <label className="label text-xs">Email</label>
                  <input className="input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
                </div>
                <div>
                  <label className="label text-xs">Room</label>
                  <input className="input" value={form.room} onChange={e => setForm({...form, room: e.target.value})} />
                </div>
                <div>
                  <label className="label text-xs">Phone</label>
                  <input className="input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                </div>
                <div>
                  <label className="label text-xs">Join Date</label>
                  <input className="input" type="date" value={form.joinDate} onChange={e => setForm({...form, joinDate: e.target.value})} />
                </div>
                <div>
                  <label className="label text-xs flex items-center gap-1"><ShieldCheck size={12} />Role</label>
                  <div className="relative">
                    <select className="input appearance-none pr-8 cursor-pointer" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                      <option value="member">Member</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                    <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">▾</div>
                  </div>
                </div>
              </div>

              {/* Password section */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '12px' }}>
                <label className="label text-xs flex items-center gap-1.5">
                  <KeyRound size={12} className="text-amber-400" />
                  {editing ? 'Change Password' : 'Password'}
                  {editing && <span className="text-slate-600 font-normal">(leave blank to keep)</span>}
                </label>
                <input className="input" type="password"
                  placeholder={editing ? 'Enter new password…' : 'mess1234'}
                  value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})}
                  required={!editing} />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1 text-sm">Cancel</button>
                <button type="submit" className="btn-primary flex-1 text-sm" disabled={loading}>
                  {loading ? 'Saving…' : editing ? 'Update' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── PIN Modal ── */}
      {pinModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(6px)' }}>
          <div className="w-full sm:max-w-xs rounded-t-3xl sm:rounded-2xl p-5 space-y-4" style={modalGlass}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock size={15} className="text-amber-400" />
                <h2 className="font-bold text-white text-sm">Enter Access Code</h2>
              </div>
              <button onClick={() => setPinModal(false)}
                className="w-7 h-7 flex items-center justify-center rounded-xl text-slate-400"
                style={{ background: 'rgba(255,255,255,0.06)', WebkitTapHighlightColor: 'transparent' }}>
                <X size={14} />
              </button>
            </div>
            <input
              className="input text-center text-lg tracking-widest"
              type="password" maxLength={10}
              placeholder="Enter code"
              value={pin}
              onChange={e => { setPin(e.target.value); setPinError(''); }}
              onKeyDown={e => e.key === 'Enter' && submitPin()}
              autoFocus
            />
            {pinError && <p className="text-red-400 text-xs text-center">{pinError}</p>}
            <div className="flex gap-3">
              <button onClick={() => setPinModal(false)} className="btn-secondary flex-1 text-sm">Cancel</button>
              <button onClick={submitPin} className="btn-primary flex-1 text-sm">Unlock</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Credentials Modal ── */}
      {credentials && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(6px)' }}>
          <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl overflow-hidden" style={modalGlass}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-2">
                <KeyRound size={15} className="text-amber-400" />
                <h2 className="font-bold text-white text-sm">Member Credentials</h2>
              </div>
              <button onClick={() => { setCredentials(null); setShowPassMap({}); }}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400"
                style={{ background: 'rgba(255,255,255,0.06)', WebkitTapHighlightColor: 'transparent' }}>
                <X size={16} />
              </button>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: '70vh' }}>
              {credentials.map((c, i) => {
                const ac = roleAccent[c.role] || roleAccent.member;
                const shown = showPassMap[c._id];
                return (
                  <div key={c._id} className="flex items-center gap-3 px-5 py-3.5"
                    style={{ borderBottom: i < credentials.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', opacity: c.isActive ? 1 : 0.45 }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ background: ac.avatarBg, border: `1px solid ${ac.border}`, color: ac.text }}>
                      {realName(c.name)?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{realName(c.name)}</p>
                      <p className="text-slate-500 text-xs truncate">{c.email}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-mono text-sm tabular-nums"
                        style={{ color: '#fbbf24', letterSpacing: shown ? '0.05em' : '0.2em' }}>
                        {shown ? (c.plainPassword || '—') : '••••••'}
                      </span>
                      <button onClick={() => setShowPassMap(p => ({ ...p, [c._id]: !p[c._id] }))}
                        className="w-7 h-7 flex items-center justify-center rounded-lg"
                        style={{ background: 'rgba(255,255,255,0.06)', WebkitTapHighlightColor: 'transparent' }}>
                        {shown ? <EyeOff size={13} className="text-slate-400" /> : <Eye size={13} className="text-slate-400" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
          <div className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl p-5 space-y-4" style={modalGlass}>
            <h2 className="font-bold text-white">Delete Member?</h2>
            <p className="text-slate-400 text-sm">
              Permanently delete <span className="text-white font-medium">{realName(deleteConfirm.name)}</span>? This cannot be undone.
            </p>
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
