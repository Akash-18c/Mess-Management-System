import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Cake, Pencil, Check, X, CalendarDays } from 'lucide-react';
import api from '../../api';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const glass = {
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(32px)',
  WebkitBackdropFilter: 'blur(32px)',
  border: '1px solid rgba(255,255,255,0.09)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07)',
};

const realName = (n) => { const m = n?.match(/^\w+\s*\((.+)\)$/); return m ? m[1] : (n || ''); };

export default function AdminBirthdays() {
  const [members, setMembers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editVal, setEditVal] = useState({ month: '', day: '' });
  const [saving, setSaving] = useState(false);

  const load = () => api.get('/admin/members').then(r => setMembers(r.data));
  useEffect(() => { load(); }, []);

  const startEdit = (m) => {
    setEditingId(m._id);
    if (m.birthday) {
      const [mm, dd] = m.birthday.split('-');
      setEditVal({ month: mm, day: dd });
    } else {
      setEditVal({ month: '', day: '' });
    }
  };
  const cancelEdit = () => { setEditingId(null); setEditVal({ month: '', day: '' }); };

  const save = async (id) => {
    const { month, day } = editVal;
    if (!month || !day) { toast.error('Pick a month and day'); return; }
    const mm = month.padStart(2, '0');
    const dd = day.padStart(2, '0');
    setSaving(true);
    try {
      await api.put(`/admin/members/${id}`, { birthday: `${mm}-${dd}` });
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

  const active = members.filter(m => m.isActive);
  const withBday = active.filter(m => m.birthday);
  const withoutBday = active.filter(m => !m.birthday);

  // Sort withBday by upcoming: compute daysLeft
  const today = new Date();
  const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const sorted = [...withBday].sort((a, b) => {
    const daysLeft = (mmdd) => {
      const [mm, dd] = mmdd.split('-').map(Number);
      let d = new Date(today.getFullYear(), mm - 1, dd);
      if (d < todayMid) d = new Date(today.getFullYear() + 1, mm - 1, dd);
      return Math.floor((d - todayMid) / 86400000);
    };
    return daysLeft(a.birthday) - daysLeft(b.birthday);
  });

  const MemberCard = ({ m }) => {
    const isEditing = editingId === m._id;
    const hasBday = !!m.birthday;
    const [mm, dd] = hasBday ? m.birthday.split('-').map(Number) : [];
    const dateLabel = hasBday ? `${dd} ${MONTHS_SHORT[mm - 1]}` : null;
    const fullDate  = hasBday ? `${MONTHS[mm - 1]} ${dd}` : null;

    // compute daysLeft
    let daysLeft = null;
    let isUpcoming = false;
    if (hasBday) {
      let bday = new Date(today.getFullYear(), mm - 1, dd);
      if (bday < todayMid) bday = new Date(today.getFullYear() + 1, mm - 1, dd);
      daysLeft = Math.floor((bday - todayMid) / 86400000);
      isUpcoming = daysLeft <= 2;
    }

    const upcomingBadge = daysLeft === 0 ? { label: 'Today! 🎉', color: '#fbbf24' }
      : daysLeft === 1 ? { label: 'Tomorrow 🎈', color: '#fb923c' }
      : daysLeft === 2 ? { label: 'In 2 Days 🎁', color: '#fcd34d' }
      : null;

    return (
      <div className="relative rounded-2xl p-4 transition-all duration-200"
        style={{
          background: isUpcoming
            ? 'linear-gradient(135deg,rgba(251,191,36,0.10) 0%,rgba(245,158,11,0.06) 100%)'
            : 'rgba(255,255,255,0.04)',
          border: isUpcoming
            ? '1px solid rgba(251,191,36,0.28)'
            : '1px solid rgba(255,255,255,0.08)',
          boxShadow: isUpcoming ? '0 4px 20px rgba(245,158,11,0.10)' : 'none',
        }}>

        {/* Upcoming glow strip */}
        {isUpcoming && (
          <div className="absolute top-0 left-0 right-0 h-px rounded-t-2xl"
            style={{ background: 'linear-gradient(90deg,transparent,rgba(251,191,36,0.55),transparent)' }} />
        )}

        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-base font-bold"
              style={{
                background: isUpcoming ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.07)',
                border: isUpcoming ? '1px solid rgba(251,191,36,0.30)' : '1px solid rgba(255,255,255,0.10)',
                color: isUpcoming ? '#fbbf24' : '#94a3b8',
              }}>
              {realName(m.name)?.[0]?.toUpperCase()}
            </div>
            {isUpcoming && (
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px]"
                style={{ background: '#fbbf24', boxShadow: '0 0 8px rgba(251,191,36,0.6)' }}>
                🎂
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm truncate">{realName(m.name)}</p>
            <p className="text-slate-500 text-[11px] truncate">{m.room || m.email}</p>
          </div>

          {/* Birthday display / edit */}
          <div className="flex-shrink-0 text-right">
            {isEditing ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                <select
                  className="input text-xs py-1 px-2"
                  style={{ width: '90px' }}
                  value={editVal.month}
                  onChange={e => setEditVal(v => ({ ...v, month: e.target.value }))}
                  autoFocus>
                  <option value="">Month</option>
                  {MONTHS.map((mn, i) => (
                    <option key={i+1} value={String(i+1).padStart(2,'0')}>{mn.slice(0,3)}</option>
                  ))}
                </select>
                <select
                  className="input text-xs py-1 px-2"
                  style={{ width: '68px' }}
                  value={editVal.day}
                  onChange={e => setEditVal(v => ({ ...v, day: e.target.value }))}>
                  <option value="">Day</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                    <option key={d} value={String(d).padStart(2,'0')}>{d}</option>
                  ))}
                </select>
                <button onClick={() => save(m._id)} disabled={saving}
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', WebkitTapHighlightColor: 'transparent' }}>
                  <Check size={13} className="text-green-400" />
                </button>
                <button onClick={cancelEdit}
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(248,113,113,0.10)', border: '1px solid rgba(248,113,113,0.20)', WebkitTapHighlightColor: 'transparent' }}>
                  <X size={13} className="text-red-400" />
                </button>
              </div>
            ) : hasBday ? (
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-amber-400 font-bold text-sm">{dateLabel}</p>
                  {upcomingBadge && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: `${upcomingBadge.color}18`, color: upcomingBadge.color, border: `1px solid ${upcomingBadge.color}35` }}>
                      {upcomingBadge.label}
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(m)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(99,102,241,0.10)', border: '1px solid rgba(99,102,241,0.20)', WebkitTapHighlightColor: 'transparent' }}>
                    <Pencil size={11} className="text-violet-400" />
                  </button>
                  <button onClick={() => clear(m._id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.18)', WebkitTapHighlightColor: 'transparent' }}>
                    <X size={11} className="text-red-400" />
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => startEdit(m)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                style={{ background: 'rgba(99,102,241,0.10)', border: '1px solid rgba(99,102,241,0.20)', color: '#a5b4fc', WebkitTapHighlightColor: 'transparent' }}>
                <CalendarDays size={12} /> Set Date
              </button>
            )}
          </div>
        </div>

        {/* Full date label below for set birthdays */}
        {hasBday && !isEditing && (
          <p className="text-[10px] mt-2 pl-14" style={{ color: 'rgba(148,163,184,0.45)' }}>
            🗓 {fullDate} every year
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="relative rounded-2xl overflow-hidden p-5" style={{
        background: 'linear-gradient(135deg,rgba(251,191,36,0.10) 0%,rgba(245,158,11,0.06) 50%,rgba(217,119,6,0.08) 100%)',
        border: '1px solid rgba(251,191,36,0.20)',
        boxShadow: '0 8px 32px rgba(245,158,11,0.08)',
      }}>
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg,transparent,rgba(251,191,36,0.50),transparent)' }} />
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
              style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.28)' }}>
              🎂
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full animate-ping"
              style={{ background: 'rgba(251,191,36,0.40)' }} />
          </div>
          <div>
            <h1 style={{
              fontFamily: "'Dancing Script', cursive",
              fontSize: 'clamp(1.4rem,5vw,2rem)', fontWeight: 700,
              background: 'linear-gradient(135deg,#ffffff 0%,#fef3c7 40%,#fbbf24 75%,#d97706 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              lineHeight: 1.2,
            }}>Member Birthdays</h1>
            <p className="text-[11px] mt-0.5" style={{ color: 'rgba(251,191,36,0.55)' }}>
              {withBday.length} set · {withoutBday.length} not set · banner shows 2 days before 🎉
            </p>
          </div>
        </div>
      </div>

      {active.length === 0 && (
        <div className="rounded-2xl py-14 text-center text-slate-600 text-sm" style={glass}>No active members</div>
      )}

      {/* ── Set birthdays ── */}
      {sorted.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-3 pl-1" style={{ color: '#fbbf24' }}>
            🎂 Birthday Set — {sorted.length} member{sorted.length !== 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sorted.map(m => <MemberCard key={m._id} m={m} />)}
          </div>
        </div>
      )}

      {/* ── Not set ── */}
      {withoutBday.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-3 pl-1" style={{ color: '#475569' }}>
            📅 Birthday Not Set — {withoutBday.length} member{withoutBday.length !== 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {withoutBday.map(m => <MemberCard key={m._id} m={m} />)}
          </div>
        </div>
      )}
    </div>
  );
}
