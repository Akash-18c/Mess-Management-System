import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Cake, Pencil, Check, X } from 'lucide-react';
import api from '../../api';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const glass = {
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(32px)',
  WebkitBackdropFilter: 'blur(32px)',
  border: '1px solid rgba(255,255,255,0.09)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07)',
};

const realName = (name) => { const m = name?.match(/^\w+\s*\((.+)\)$/); return m ? m[1] : (name || ''); };

function parseBirthday(val) {
  if (!val) return '';
  // accept both MM-DD and YYYY-MM-DD (date input)
  const parts = val.split('-');
  if (parts.length === 3) return `${parts[1]}-${parts[2]}`; // YYYY-MM-DD → MM-DD
  return val;
}

function toDateInputValue(mmdd) {
  if (!mmdd) return '';
  return `2000-${mmdd}`; // use year 2000 as placeholder for date input
}

export default function AdminBirthdays() {
  const [members, setMembers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editVal, setEditVal] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => api.get('/admin/members').then(r => setMembers(r.data));
  useEffect(() => { load(); }, []);

  const startEdit = (m) => {
    setEditingId(m._id);
    setEditVal(toDateInputValue(m.birthday || ''));
  };

  const cancelEdit = () => { setEditingId(null); setEditVal(''); };

  const save = async (id) => {
    setSaving(true);
    try {
      const birthday = parseBirthday(editVal);
      await api.put(`/admin/members/${id}`, { birthday });
      toast.success('Birthday saved');
      setEditingId(null);
      load();
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const clear = async (id) => {
    try {
      await api.put(`/admin/members/${id}`, { birthday: '' });
      toast.success('Birthday cleared');
      load();
    } catch { toast.error('Failed to clear'); }
  };

  const active = members.filter(m => m.isActive && m.role !== 'admin');

  const withBday   = active.filter(m => m.birthday);
  const withoutBday = active.filter(m => !m.birthday);

  const MemberRow = ({ m }) => {
    const isEditing = editingId === m._id;
    const [mm, dd] = (m.birthday || '').split('-').map(Number);
    const dateLabel = m.birthday ? `${dd} ${MONTHS[mm - 1]}` : null;

    return (
      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

        {/* Member */}
        <td className="py-3 px-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.22)', color: '#fbbf24' }}>
              {realName(m.name)?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm truncate">{realName(m.name)}</p>
              <p className="text-slate-500 text-[11px] truncate">{m.room || m.email}</p>
            </div>
          </div>
        </td>

        {/* Birthday */}
        <td className="py-3 px-4">
          {isEditing ? (
            <input
              type="date"
              className="input text-sm py-1.5 w-36"
              value={editVal}
              onChange={e => setEditVal(e.target.value)}
              autoFocus
            />
          ) : (
            dateLabel
              ? <span className="text-amber-400 font-medium text-sm">🎂 {dateLabel}</span>
              : <span className="text-slate-600 text-sm">— not set</span>
          )}
        </td>

        {/* Actions */}
        <td className="py-3 px-4">
          <div className="flex items-center justify-end gap-1.5">
            {isEditing ? (
              <>
                <button onClick={() => save(m._id)} disabled={saving}
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', WebkitTapHighlightColor: 'transparent' }}>
                  <Check size={13} className="text-green-400" />
                </button>
                <button onClick={cancelEdit}
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(248,113,113,0.10)', border: '1px solid rgba(248,113,113,0.20)', WebkitTapHighlightColor: 'transparent' }}>
                  <X size={13} className="text-red-400" />
                </button>
              </>
            ) : (
              <>
                <button onClick={() => startEdit(m)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(99,102,241,0.10)', border: '1px solid rgba(99,102,241,0.20)', WebkitTapHighlightColor: 'transparent' }}
                  title="Set birthday">
                  <Pencil size={12} className="text-violet-400" />
                </button>
                {m.birthday && (
                  <button onClick={() => clear(m._id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(248,113,113,0.10)', border: '1px solid rgba(248,113,113,0.20)', WebkitTapHighlightColor: 'transparent' }}
                    title="Clear birthday">
                    <X size={12} className="text-red-400" />
                  </button>
                )}
              </>
            )}
          </div>
        </td>
      </tr>
    );
  };

  const Table = ({ rows, label, labelColor }) => (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest mb-2.5 pl-1" style={{ color: labelColor }}>{label}</p>
      <div className="rounded-2xl overflow-hidden" style={glass}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Member</th>
                <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Birthday</th>
                <th className="text-right py-2.5 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody>{rows.map(m => <MemberRow key={m._id} m={m} />)}</tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="rounded-2xl p-4 px-5 flex items-center gap-3" style={glass}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.22)' }}>
          <Cake size={20} style={{ color: '#fbbf24' }} />
        </div>
        <div>
          <h1 style={{
            fontFamily: "'Dancing Script', cursive",
            fontSize: 'clamp(1.3rem,5vw,1.8rem)', fontWeight: 700,
            background: 'linear-gradient(135deg,#ffffff 0%,#fef3c7 40%,#fbbf24 75%,#d97706 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            lineHeight: 1.2,
          }}>Birthdays</h1>
          <p className="text-slate-500 text-[11px] mt-0.5">
            {withBday.length} set · {withoutBday.length} not set — banner auto-shows 2 days before
          </p>
        </div>
      </div>

      {active.length === 0 && (
        <div className="rounded-2xl py-12 text-center text-slate-600 text-sm" style={glass}>No active members</div>
      )}

      {withBday.length > 0   && <Table rows={withBday}    label="Birthday Set"     labelColor="#fbbf24" />}
      {withoutBday.length > 0 && <Table rows={withoutBday} label="Birthday Not Set" labelColor="#475569" />}
    </div>
  );
}
