import React, { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, X, Pencil, UserCog, Sparkles, ChevronDown, Check, Calendar } from 'lucide-react';
import api from '../../api';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const rn = (name) => { const m = name?.match(/^\w+\s*\((.+)\)$/); return m ? m[1] : (name || '—'); };

const glass = {
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(32px)',
  WebkitBackdropFilter: 'blur(32px)',
  border: '1px solid rgba(255,255,255,0.09)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07)',
};

const modalGlass = {
  background: 'rgba(10,15,30,0.97)',
  backdropFilter: 'blur(48px)',
  WebkitBackdropFilter: 'blur(48px)',
  border: '1px solid rgba(255,255,255,0.12)',
  boxShadow: '0 24px 64px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.08)',
};

/* ── Custom Dropdown ── */
function CustomSelect({ value, onChange, options, placeholder = '— Select —', accent = '#2dd4bf' }) {
  const [open, setOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const toggle = () => {
    if (!open && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      // if less than 220px below, open upward
      setOpenUp(spaceBelow < 220);
    }
    setOpen(o => !o);
  };

  const selected = options.find(o => o.value === value);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm"
        style={{
          background: 'rgba(255,255,255,0.06)',
          border: open ? `1px solid ${accent}60` : '1px solid rgba(255,255,255,0.12)',
          boxShadow: open ? `0 0 0 3px ${accent}18` : 'none',
          color: selected ? '#fff' : '#64748b',
          transition: 'all 0.15s',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          {selected?.icon && <span className="flex-shrink-0">{selected.icon}</span>}
          <span className="truncate">{selected ? selected.label : placeholder}</span>
        </div>
        <ChevronDown size={14} className={`flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} style={{ color: '#64748b' }} />
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 z-[200] rounded-xl overflow-hidden"
          style={{
            ...(openUp ? { bottom: 'calc(100% + 6px)' } : { top: 'calc(100% + 6px)' }),
            background: 'rgba(8,14,28,0.99)',
            border: `1px solid ${accent}30`,
            boxShadow: openUp
              ? '0 -16px 48px rgba(0,0,0,0.85)'
              : '0 16px 48px rgba(0,0,0,0.85)',
            backdropFilter: 'blur(48px)',
          }}
        >
          <div className="overflow-y-auto max-h-48" style={{ scrollbarWidth: 'thin' }}>
            {options.map(opt => {
              const isSel = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors"
                  style={{
                    background: isSel ? `${accent}15` : 'transparent',
                    borderLeft: isSel ? `2px solid ${accent}` : '2px solid transparent',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    color: isSel ? accent : '#cbd5e1',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  {opt.icon && <span className="flex-shrink-0">{opt.icon}</span>}
                  <span className="flex-1 text-left truncate">{opt.label}</span>
                  {isSel && <Check size={12} style={{ color: accent, flexShrink: 0 }} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [members,     setMembers]     = useState([]);
  const [modal,       setModal]       = useState(false);
  const [editing,     setEditing]     = useState(null);
  const [form,        setForm]        = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear(), managerId: '' });
  const [loading,     setLoading]     = useState(false);
  const [delConfirm,  setDelConfirm]  = useState(null);

  const load = () => Promise.all([
    api.get('/admin/assignments').then(r => setAssignments(r.data)),
    api.get('/admin/members').then(r => setMembers(r.data.filter(m => m.isActive && m.role !== 'admin'))),
  ]);
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.managerId) return toast.error('Please select a manager');
    setLoading(true);
    try {
      if (editing) {
        await api.put(`/admin/assignments/${editing}`, { managerId: form.managerId });
        toast.success('Manager reassigned');
      } else {
        await api.post('/admin/assignments', form);
        toast.success('Manager assigned');
      }
      setModal(false); load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/admin/assignments/${id}`);
      toast.success('Assignment revoked');
      setDelConfirm(null); load();
    } catch { toast.error('Error'); }
  };

  const openAdd  = () => { setEditing(null); setForm({ month: new Date().getMonth() + 1, year: new Date().getFullYear(), managerId: '' }); setModal(true); };
  const openEdit = (a) => { setEditing(a._id); setForm({ month: a.month, year: a.year, managerId: a.managerId._id }); setModal(true); };

  // Build year options
  const currentYear = new Date().getFullYear();
  const yearOpts = Array.from({ length: 5 }, (_, i) => ({ value: currentYear - 1 + i, label: String(currentYear - 1 + i) }));
  const monthOpts = MONTHS.map((m, i) => ({ value: i + 1, label: m }));
  const memberOpts = members.map(m => ({
    value: m._id,
    label: rn(m.name) + (m.room ? ` · Room ${m.room}` : ''),
    icon: <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
      style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.25)', color: '#fbbf24' }}>
      {rn(m.name)?.[0]?.toUpperCase()}
    </span>,
  }));

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
            }}>Assignments</h1>
          </div>
          <p className="text-slate-500 text-[11px] mt-0.5 pl-5">{assignments.length} assignment{assignments.length !== 1 ? 's' : ''} · one manager per month</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-1.5 text-xs px-3 py-2 flex-shrink-0">
          <Plus size={14} /> Assign
        </button>
      </div>

      {/* ── Cards (mobile) / Table (desktop) ── */}
      <div className="rounded-2xl overflow-hidden" style={glass}>
        {assignments.length === 0 ? (
          <div className="py-14 text-center">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.15)' }}>
              <UserCog size={20} style={{ color: '#2dd4bf' }} />
            </div>
            <p className="text-slate-500 text-sm">No assignments yet</p>
            <p className="text-slate-600 text-xs mt-1">Click "Assign" to get started</p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-white/5">
              {assignments.map(a => (
                <div key={a._id} className="px-4 py-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Month badge */}
                      <div className="w-10 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(20,184,166,0.10)', border: '1px solid rgba(20,184,166,0.20)' }}>
                        <span className="text-[9px] font-bold uppercase" style={{ color: '#2dd4bf' }}>{MONTHS[a.month - 1].slice(0,3)}</span>
                        <span className="text-[9px] text-slate-500">{a.year}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-semibold text-sm truncate">{MONTHS[a.month - 1]} {a.year}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold flex-shrink-0"
                            style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24' }}>
                            {rn(a.managerId?.name)?.[0]?.toUpperCase()}
                          </div>
                          <span className="text-slate-300 text-xs truncate">{rn(a.managerId?.name)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button onClick={() => openEdit(a)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center"
                        style={{ background: 'rgba(96,165,250,0.10)', border: '1px solid rgba(96,165,250,0.20)', WebkitTapHighlightColor: 'transparent' }}>
                        <Pencil size={13} className="text-blue-400" />
                      </button>
                      <button onClick={() => setDelConfirm(a)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center"
                        style={{ background: 'rgba(248,113,113,0.10)', border: '1px solid rgba(248,113,113,0.20)', WebkitTapHighlightColor: 'transparent' }}>
                        <Trash2 size={13} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2 pl-13">
                    <span className="text-[10px] text-slate-600">By {rn(a.assignedBy?.name)} · {new Date(a.assignedAt).toLocaleDateString('en-IN')}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Month</th>
                    <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Manager</th>
                    <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Assigned By</th>
                    <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                    <th className="text-right py-2.5 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map(a => (
                    <tr key={a._id}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: 'rgba(20,184,166,0.12)', border: '1px solid rgba(20,184,166,0.22)' }}>
                            <span className="text-[10px] font-bold" style={{ color: '#2dd4bf' }}>{MONTHS[a.month - 1].slice(0,3)}</span>
                          </div>
                          <p className="text-white font-semibold">{MONTHS[a.month - 1]} {a.year}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.25)', color: '#fbbf24' }}>
                            {rn(a.managerId?.name)?.[0]?.toUpperCase()}
                          </div>
                          <span className="text-white font-medium">{rn(a.managerId?.name)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-400">{rn(a.assignedBy?.name)}</td>
                      <td className="py-3 px-4 text-slate-400">{new Date(a.assignedAt).toLocaleDateString('en-IN')}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => openEdit(a)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center"
                            style={{ background: 'rgba(96,165,250,0.10)', border: '1px solid rgba(96,165,250,0.20)', WebkitTapHighlightColor: 'transparent' }}>
                            <Pencil size={12} className="text-blue-400" />
                          </button>
                          <button onClick={() => setDelConfirm(a)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center"
                            style={{ background: 'rgba(248,113,113,0.10)', border: '1px solid rgba(248,113,113,0.20)', WebkitTapHighlightColor: 'transparent' }}>
                            <Trash2 size={12} className="text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ── Add / Edit Modal ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl overflow-hidden" style={modalGlass}>

            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(245,158,11,0.04)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}>
                  <UserCog size={15} className="text-amber-400" />
                </div>
                <div>
                  <h2 className="font-bold text-white text-sm">{editing ? 'Change Manager' : 'Assign Manager'}</h2>
                  <p className="text-[10px] text-slate-500">{editing ? 'Reassign for this month' : 'Set manager for a month'}</p>
                </div>
              </div>
              <button onClick={() => setModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400"
                style={{ background: 'rgba(255,255,255,0.06)', WebkitTapHighlightColor: 'transparent' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">

              {/* Month + Year (only for new) */}
              {!editing && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label text-xs flex items-center gap-1.5 mb-1.5">
                      <Calendar size={11} className="text-teal-400" /> Month
                    </label>
                    <CustomSelect
                      value={form.month}
                      onChange={v => setForm({ ...form, month: v })}
                      options={monthOpts}
                      accent="#2dd4bf"
                    />
                  </div>
                  <div>
                    <label className="label text-xs flex items-center gap-1.5 mb-1.5">
                      <Calendar size={11} className="text-teal-400" /> Year
                    </label>
                    <CustomSelect
                      value={form.year}
                      onChange={v => setForm({ ...form, year: v })}
                      options={yearOpts}
                      accent="#2dd4bf"
                    />
                  </div>
                </div>
              )}

              {/* Editing: show locked month/year */}
              {editing && (
                <div className="rounded-xl px-4 py-3 flex items-center gap-3"
                  style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.18)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}>
                    <Calendar size={14} className="text-amber-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 mb-0.5">Reassigning for</p>
                    <p className="text-white font-bold text-sm">{MONTHS[form.month - 1]} {form.year}</p>
                  </div>
                </div>
              )}

              {/* Manager select */}
              <div>
                <label className="label text-xs flex items-center gap-1.5 mb-1.5">
                  <UserCog size={11} className="text-amber-400" /> Select Manager
                </label>
                {members.length === 0 ? (
                  <div className="rounded-xl px-3 py-3 text-center text-xs text-slate-500"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    No active members available
                  </div>
                ) : (
                  <CustomSelect
                    value={form.managerId}
                    onChange={v => setForm({ ...form, managerId: v })}
                    options={memberOpts}
                    placeholder="— Choose a member —"
                    accent="#f59e0b"
                  />
                )}
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1 text-sm">Cancel</button>
                <button type="submit" className="btn-primary flex-1 text-sm" disabled={loading}>
                  {loading ? 'Saving…' : editing ? 'Update' : 'Assign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ── */}
      {delConfirm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl p-5 space-y-4" style={modalGlass}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.25)' }}>
                <Trash2 size={16} className="text-red-400" />
              </div>
              <div>
                <h2 className="font-bold text-white">Revoke Assignment?</h2>
                <p className="text-slate-500 text-xs mt-0.5">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-slate-400 text-sm">
              Remove <span className="text-white font-semibold">{rn(delConfirm.managerId?.name)}</span> as manager for{' '}
              <span className="text-white font-semibold">{MONTHS[delConfirm.month - 1]} {delConfirm.year}</span>?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDelConfirm(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={() => handleDelete(delConfirm._id)} className="btn-danger flex-1">Revoke</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
