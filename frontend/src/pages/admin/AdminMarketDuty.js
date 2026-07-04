import React, { useEffect, useState } from 'react';
import { ShoppingCart, Plus, Trash2, Edit2, Send, X, Check } from 'lucide-react';
import api from '../../api';
import toast from 'react-hot-toast';
import { buildWaLink } from '../../hooks/useMarketDutyNotifier';
import useAuthStore from '../../store/authStore';

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

const glass = {
  background: 'rgba(255,255,255,0.08)',
  backdropFilter: 'blur(40px)',
  WebkitBackdropFilter: 'blur(40px)',
  border: '1px solid rgba(255,255,255,0.18)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.25)',
};

const EMPTY = { memberId: '', dayOfWeek: 1, meal: 'lunch', time: '08:00', note: '' };
const rn = (name) => { const m = name?.match(/^\w+\s*\((.+)\)$/); return m ? m[1] : (name || ''); };

function PersonCard({ d, isLunch, onEdit, onDelete, onSend }) {
  return (
    <div className="rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
      {/* Avatar + name + time row */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 text-white"
          style={{ background: isLunch ? 'rgba(251,191,36,0.25)' : 'rgba(99,102,241,0.25)', border: isLunch ? '1px solid rgba(251,191,36,0.4)' : '1px solid rgba(99,102,241,0.4)' }}>
          {rn(d.memberId?.name)?.[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm truncate">{rn(d.memberId?.name)}</p>
          <p className="text-slate-400 text-xs">⏰ {d.time}{d.note ? ` · ${d.note}` : ''}</p>
        </div>
      </div>
      {/* Buttons row */}
      <div className="flex gap-2">
        <button onClick={() => onSend(d)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95"
          style={{ background: 'rgba(37,211,102,0.20)', border: '1px solid rgba(37,211,102,0.40)', color: '#22c55e' }}>
          <Send size={13} /> WhatsApp
        </button>
        <button onClick={() => onEdit(d)}
          className="flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95"
          style={{ background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.35)', color: '#60a5fa' }}>
          <Edit2 size={13} /> Edit
        </button>
        <button onClick={() => onDelete(d._id)}
          className="flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95"
          style={{ background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.35)', color: '#f87171' }}>
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

function MealSlot({ meal, duties, day, onAdd, onEdit, onDelete, onSend }) {
  const isLunch = meal === 'lunch';
  const accent  = isLunch ? 'rgba(251,191,36,0.10)' : 'rgba(99,102,241,0.10)';
  const border  = isLunch ? 'rgba(251,191,36,0.25)' : 'rgba(99,102,241,0.25)';
  const color   = isLunch ? '#fcd34d'               : '#a5b4fc';
  const label   = isLunch ? '☀️ Lunch'             : '🌙 Dinner';

  return (
    <div className="flex-1 rounded-2xl overflow-hidden" style={{ background: accent, border: `1px solid ${border}`, minWidth: 0 }}>
      {/* Meal header */}
      <div className="px-3 py-2.5 flex items-center justify-between" style={{ borderBottom: `1px solid ${border}` }}>
        <span className="text-xs font-bold tracking-wide" style={{ color }}>{label}</span>
        <button onClick={() => onAdd({ meal, dayOfWeek: day })}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold transition-all active:scale-95"
          style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.18)', color: '#94a3b8' }}>
          <Plus size={11} /> Add
        </button>
      </div>

      {duties.length === 0 ? (
        <div className="px-3 py-4 text-center text-slate-600 text-xs">No duty assigned</div>
      ) : (
        <div className="p-2 space-y-2">
          {duties.map(d => (
            <PersonCard key={d._id} d={d} isLunch={isLunch} onEdit={onEdit} onDelete={onDelete} onSend={onSend} />
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
      editId ? await api.put(`/admin/market-duty/${editId}`, form) : await api.post('/admin/market-duty', form);
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

      {/* Header */}
      <div className="rounded-2xl p-4" style={glass}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.30)' }}>
              <ShoppingCart size={20} className="text-green-400" />
            </div>
            <div>
              <h1 className="font-bold text-white text-base leading-tight">Market Duty</h1>
              <p className="text-slate-500 text-xs mt-0.5">Weekly grocery schedule</p>
            </div>
          </div>
          {/* Add Duty button — prominent on mobile */}
          <button onClick={() => openAdd()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.30), rgba(16,185,129,0.20))', border: '1px solid rgba(34,197,94,0.50)', color: '#4ade80', boxShadow: '0 0 16px rgba(34,197,94,0.15)' }}>
            <Plus size={16} />
            <span className="hidden sm:inline">Add Duty</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="rounded-2xl overflow-hidden" style={{ ...glass, border: '1px solid rgba(34,197,94,0.30)' }}>
          <div className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.10)', background: 'rgba(34,197,94,0.06)' }}>
            <p className="font-bold text-white text-sm">{editId ? '✏️ Edit Duty' : '➕ Add New Duty'}</p>
            <button onClick={() => setShowForm(false)}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-95"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)', color: '#94a3b8' }}>
              <X size={15} />
            </button>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <label className="text-xs text-slate-400 font-semibold mb-1.5 block">Member</label>
              <select value={form.memberId} onChange={e => setForm(f => ({ ...f, memberId: e.target.value }))}
                className="w-full rounded-xl px-3 py-3 text-sm text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.16)' }}>
                <option value="">Select member...</option>
                {members.map(m => (
                  <option key={m._id} value={m._id}>{rn(m.name)}{m.phone ? ` · ${m.phone}` : ' · ⚠️ no phone'}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1.5 block">Day</label>
                <select value={form.dayOfWeek} onChange={e => setForm(f => ({ ...f, dayOfWeek: Number(e.target.value) }))}
                  className="w-full rounded-xl px-3 py-3 text-sm text-white outline-none"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.16)' }}>
                  {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1.5 block">Meal</label>
                <select value={form.meal} onChange={e => setForm(f => ({ ...f, meal: e.target.value }))}
                  className="w-full rounded-xl px-3 py-3 text-sm text-white outline-none"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.16)' }}>
                  <option value="lunch">☀️ Lunch</option>
                  <option value="dinner">🌙 Dinner</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1.5 block">Time</label>
                <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                  className="w-full rounded-xl px-3 py-3 text-sm text-white outline-none"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.16)', colorScheme: 'dark' }} />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1.5 block">Note</label>
                <input type="text" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                  placeholder="Optional..."
                  className="w-full rounded-xl px-3 py-3 text-sm text-white outline-none placeholder-slate-600"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.16)' }} />
              </div>
            </div>
            <button onClick={save} disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 mt-1"
              style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.30), rgba(16,185,129,0.20))', border: '1px solid rgba(34,197,94,0.50)', color: '#4ade80', opacity: loading ? 0.7 : 1, boxShadow: '0 0 20px rgba(34,197,94,0.12)' }}>
              <Check size={16} /> {loading ? 'Saving...' : editId ? 'Update Duty' : 'Save Duty'}
            </button>
          </div>
        </div>
      )}

      {/* Today banner */}
      {todayDuties.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ ...glass, border: '1px solid rgba(34,197,94,0.35)' }}>
          <div className="px-4 py-3 flex items-center gap-2"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.10)', background: 'rgba(34,197,94,0.08)' }}>
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
            <p className="text-sm font-bold text-green-300">Today's Duty — {DAYS[todayDay]}</p>
          </div>
          <div className="p-3 flex gap-3">
            {['lunch','dinner'].map(meal => {
              const dd = todayDuties.filter(d => d.meal === meal);
              if (!dd.length) return null;
              return (
                <MealSlot key={meal} meal={meal} duties={dd} day={todayDay}
                  onAdd={openAdd} onEdit={openEdit} onDelete={remove} onSend={sendWhatsApp} />
              );
            })}
          </div>
        </div>
      )}

      {/* Weekly Schedule */}
      {byDay.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={glass}>
          <ShoppingCart size={32} className="text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 text-sm font-medium">No duties scheduled yet</p>
          <p className="text-slate-600 text-xs mt-1">Tap "Add" to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {byDay.map(({ day, lunch, dinner }) => (
            <div key={day} className="rounded-2xl overflow-hidden" style={glass}>
              {/* Day header */}
              <div className="px-4 py-3 flex items-center gap-2"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.04)' }}>
                <span className="text-sm font-bold text-white tracking-wide">{DAYS[day]}</span>
                {day === todayDay && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(34,197,94,0.20)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.40)' }}>TODAY</span>
                )}
                <span className="ml-auto text-[11px] font-medium text-slate-500">
                  {lunch.length + dinner.length} {lunch.length + dinner.length === 1 ? 'person' : 'people'}
                </span>
              </div>
              {/* Lunch + Dinner side by side */}
              <div className="p-3 flex gap-3">
                <MealSlot meal="lunch"  duties={lunch}  day={day}
                  onAdd={openAdd} onEdit={openEdit} onDelete={remove} onSend={sendWhatsApp} />
                <MealSlot meal="dinner" duties={dinner} day={day}
                  onAdd={openAdd} onEdit={openEdit} onDelete={remove} onSend={sendWhatsApp} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
