import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, Send, X, Check } from 'lucide-react';
import api from '../../api';
import toast from 'react-hot-toast';
import { buildWaLink } from '../../hooks/useMarketDutyNotifier';
import useAuthStore from '../../store/authStore';

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const EMPTY = { memberId: '', dayOfWeek: 1, meal: 'lunch', time: '08:00', note: '' };
const rn = (name) => { const m = name?.match(/^\w+\s*\((.+)\)$/); return m ? m[1] : (name || ''); };

const cardGlass = {
  background: 'rgba(255,255,255,0.18)',
  backdropFilter: 'blur(40px)',
  WebkitBackdropFilter: 'blur(40px)',
  border: '1px solid rgba(255,255,255,0.28)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.35)',
};

const inputStyle = {
  background: 'rgba(0,0,0,0.25)',
  border: '1px solid rgba(255,255,255,0.18)',
  color: '#fff',
  borderRadius: '12px',
  padding: '10px 12px',
  fontSize: '14px',
  width: '100%',
  outline: 'none',
};

function PersonCard({ d, isLunch, onEdit, onDelete, onSend }) {
  const name      = rn(d.memberId?.name);
  const avatarBg  = isLunch ? 'rgba(251,191,36,0.25)' : 'rgba(99,102,241,0.25)';
  const avatarClr = isLunch ? '#fcd34d'               : '#a5b4fc';

  return (
    <div className="relative rounded-2xl p-3 overflow-hidden"
      style={{ background: 'rgba(0,0,0,0.20)', border: '1px solid rgba(255,255,255,0.15)' }}>
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.40),transparent)' }} />

      {/* Name row */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
          style={{ background: avatarBg, color: avatarClr }}>
          {name?.[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm">{name}</p>
          <p className="text-slate-300 text-xs mt-0.5">⏰ {d.time}{d.note ? ` · ${d.note}` : ''}</p>
        </div>
      </div>

      {/* Buttons — full width stacked */}
      <button onClick={() => onSend(d)}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold mb-2 active:scale-95 transition-transform"
        style={{ background: 'rgba(37,211,102,0.25)', border: '1px solid rgba(37,211,102,0.55)', color: '#22c55e' }}>
        <Send size={14} /> Send WhatsApp
      </button>
      <div className="flex gap-2">
        <button onClick={() => onEdit(d)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-bold active:scale-95 transition-transform"
          style={{ background: 'rgba(96,165,250,0.20)', border: '1px solid rgba(96,165,250,0.45)', color: '#60a5fa' }}>
          <Edit2 size={13} /> Edit
        </button>
        <button onClick={() => onDelete(d._id)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-bold active:scale-95 transition-transform"
          style={{ background: 'rgba(248,113,113,0.20)', border: '1px solid rgba(248,113,113,0.45)', color: '#f87171' }}>
          <Trash2 size={13} /> Delete
        </button>
      </div>
    </div>
  );
}

function MealSection({ meal, duties, day, onAdd, onEdit, onDelete, onSend }) {
  const isLunch  = meal === 'lunch';
  const label    = isLunch ? '☀️ Lunch' : '🌙 Dinner';
  const color    = isLunch ? '#fcd34d'  : '#a5b4fc';
  const borderC  = isLunch ? 'rgba(251,191,36,0.35)' : 'rgba(99,102,241,0.35)';
  const bgC      = isLunch ? 'rgba(251,191,36,0.07)' : 'rgba(99,102,241,0.07)';

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: bgC, border: `1px solid ${borderC}` }}>
      {/* Meal header */}
      <div className="flex items-center justify-between px-4 py-2.5"
        style={{ borderBottom: `1px solid ${borderC}` }}>
        <span className="text-sm font-bold" style={{ color }}>{label}</span>
        <button onClick={() => onAdd({ meal, dayOfWeek: day })}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold active:scale-95 transition-transform"
          style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', color: '#e2e8f0' }}>
          <Plus size={12} /> Add
        </button>
      </div>

      {duties.length === 0 ? (
        <p className="text-center text-slate-400 text-sm py-5">No duty assigned</p>
      ) : (
        <div className="p-3 space-y-2">
          {duties.map(d => (
            <PersonCard key={d._id} d={d} isLunch={isLunch}
              onEdit={onEdit} onDelete={onDelete} onSend={onSend} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminMarketDuty() {
  const [duties,   setDuties]   = useState([]);
  const [members,  setMembers]  = useState([]);
  const [form,     setForm]     = useState(EMPTY);
  const [editId,   setEditId]   = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const { user } = useAuthStore();

  const load = () => api.get('/admin/market-duty').then(r => setDuties(r.data)).catch(() => {});

  useEffect(() => {
    load();
    api.get('/admin/members').then(r => setMembers(r.data.filter(m => m.isActive))).catch(() => {});
  }, []);

  const openAdd = (prefill = {}) => {
    setForm({ ...EMPTY, ...prefill });
    setEditId(null);
    setShowForm(true);
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
  };

  const openEdit = (d) => {
    setForm({ memberId: d.memberId._id, dayOfWeek: d.dayOfWeek, meal: d.meal, time: d.time, note: d.note || '' });
    setEditId(d._id);
    setShowForm(true);
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
  };

  const save = async () => {
    if (!form.memberId) return toast.error('Select a member');
    setLoading(true);
    try {
      editId
        ? await api.put(`/admin/market-duty/${editId}`, form)
        : await api.post('/admin/market-duty', form);
      toast.success(editId ? 'Duty updated' : 'Duty added');
      setShowForm(false);
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Error'); }
    finally { setLoading(false); }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this duty?')) return;
    await api.delete(`/admin/market-duty/${id}`);
    toast.success('Deleted');
    load();
  };

  const sendWhatsApp = (duty) => {
    const url = buildWaLink(duty, false, user);
    if (!url) return toast.error('No phone number for this member');
    window.open(url, '_blank');
  };

  const todayDay = new Date().getDay();
  const byDay = Array.from({ length: 7 }, (_, i) => ({
    day: i,
    lunch:  duties.filter(d => d.dayOfWeek === i && d.meal === 'lunch'),
    dinner: duties.filter(d => d.dayOfWeek === i && d.meal === 'dinner'),
  })).filter(g => g.lunch.length > 0 || g.dinner.length > 0);
  const todayDuties = duties.filter(d => d.dayOfWeek === todayDay);

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="relative rounded-2xl overflow-hidden p-4" style={cardGlass}>
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.60),transparent)' }} />
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: 'rgba(34,197,94,0.18)', border: '1px solid rgba(34,197,94,0.35)' }}>
              🛒
            </div>
            <div>
              <h1 className="font-bold text-white text-base">Market Duty</h1>
              <p className="text-slate-300 text-xs opacity-70">Weekly grocery schedule</p>
            </div>
          </div>
          <button onClick={() => openAdd()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold active:scale-95 transition-transform flex-shrink-0"
            style={{ background: 'rgba(34,197,94,0.22)', border: '1px solid rgba(34,197,94,0.55)', color: '#4ade80', boxShadow: '0 0 16px rgba(34,197,94,0.20)' }}>
            <Plus size={15} /> Add Duty
          </button>
        </div>
      </div>

      {/* ── Add / Edit Form ── */}
      {showForm && (
        <div className="relative rounded-2xl overflow-hidden"
          style={{ background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', border: '1px solid rgba(255,255,255,0.18)', boxShadow: '0 8px 32px rgba(0,0,0,0.40)' }}>
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.40),transparent)' }} />
          <div className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.10)' }}>
            <p className="font-bold text-white text-sm">{editId ? '✏️ Edit Duty' : '➕ Add Duty'}</p>
            <button onClick={() => setShowForm(false)}
              className="w-8 h-8 rounded-xl flex items-center justify-center active:scale-95"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', color: '#94a3b8' }}>
              <X size={14} />
            </button>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <label className="text-xs text-slate-400 font-semibold mb-1.5 block uppercase tracking-wide">Member</label>
              <select value={form.memberId} onChange={e => setForm(f => ({ ...f, memberId: e.target.value }))} style={inputStyle}>
                <option value="">Select member...</option>
                {members.map(m => (
                  <option key={m._id} value={m._id}>{rn(m.name)}{m.phone ? ` · ${m.phone}` : ' · ⚠️ no phone'}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1.5 block uppercase tracking-wide">Day</label>
                <select value={form.dayOfWeek} onChange={e => setForm(f => ({ ...f, dayOfWeek: Number(e.target.value) }))} style={inputStyle}>
                  {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1.5 block uppercase tracking-wide">Meal</label>
                <select value={form.meal} onChange={e => setForm(f => ({ ...f, meal: e.target.value }))} style={inputStyle}>
                  <option value="lunch">☀️ Lunch</option>
                  <option value="dinner">🌙 Dinner</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1.5 block uppercase tracking-wide">Time</label>
                <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                  style={{ ...inputStyle, colorScheme: 'dark' }} />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1.5 block uppercase tracking-wide">Note</label>
                <input type="text" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                  placeholder="Optional..." style={inputStyle} />
              </div>
            </div>
            <button onClick={save} disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold active:scale-95 transition-transform"
              style={{ background: 'rgba(34,197,94,0.25)', border: '1px solid rgba(34,197,94,0.55)', color: '#4ade80', opacity: loading ? 0.7 : 1 }}>
              <Check size={15} /> {loading ? 'Saving...' : editId ? 'Update Duty' : 'Save Duty'}
            </button>
          </div>
        </div>
      )}

      {/* ── Today Banner ── */}
      {todayDuties.length > 0 && (
        <div className="relative rounded-2xl overflow-hidden" style={{ ...cardGlass, border: '1px solid rgba(34,197,94,0.45)' }}>
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg,transparent,rgba(34,197,94,0.70),transparent)' }} />
          <div className="px-4 py-3 flex items-center gap-2"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.12)', background: 'rgba(34,197,94,0.08)' }}>
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
            <p className="text-sm font-bold text-green-300">Today — {DAYS[todayDay]}</p>
          </div>
          <div className="p-3 space-y-3">
            {['lunch','dinner'].map(meal => {
              const dd = todayDuties.filter(d => d.meal === meal);
              if (!dd.length) return null;
              return <MealSection key={meal} meal={meal} duties={dd} day={todayDay}
                onAdd={openAdd} onEdit={openEdit} onDelete={remove} onSend={sendWhatsApp} />;
            })}
          </div>
        </div>
      )}

      {/* ── Weekly Schedule ── */}
      {byDay.length === 0 ? (
        <div className="relative rounded-2xl overflow-hidden p-12 text-center" style={cardGlass}>
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.60),transparent)' }} />
          <p className="text-4xl mb-3">🛒</p>
          <p className="text-white font-semibold text-sm">No duties scheduled yet</p>
          <p className="text-slate-400 text-xs mt-1">Tap "Add Duty" to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {byDay.map(({ day, lunch, dinner }) => (
            <div key={day} className="relative rounded-2xl overflow-hidden" style={cardGlass}>
              <div className="absolute top-0 left-0 right-0 h-px"
                style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.60),transparent)' }} />
              {/* Day header */}
              <div className="px-4 py-3 flex items-center gap-2"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.14)', background: 'rgba(0,0,0,0.15)' }}>
                <span className="text-sm font-bold text-white">{DAYS[day]}</span>
                {day === todayDay && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(34,197,94,0.22)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.45)' }}>TODAY</span>
                )}
                <span className="ml-auto text-xs font-medium text-slate-400">
                  {lunch.length + dinner.length} {lunch.length + dinner.length === 1 ? 'person' : 'people'}
                </span>
              </div>
              {/* Lunch then Dinner — stacked vertically, full width */}
              <div className="p-3 space-y-3">
                <MealSection meal="lunch"  duties={lunch}  day={day}
                  onAdd={openAdd} onEdit={openEdit} onDelete={remove} onSend={sendWhatsApp} />
                <MealSection meal="dinner" duties={dinner} day={day}
                  onAdd={openAdd} onEdit={openEdit} onDelete={remove} onSend={sendWhatsApp} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
