import React, { useEffect, useState } from 'react';
import { ShoppingCart, Plus, Trash2, Edit2, Send, X, Check } from 'lucide-react';
import api from '../../api';
import toast from 'react-hot-toast';
import { buildMessage, buildWaLink } from '../../hooks/useMarketDutyNotifier';

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const DAY_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const glass = {
  background: 'rgba(255,255,255,0.08)',
  backdropFilter: 'blur(40px)',
  WebkitBackdropFilter: 'blur(40px)',
  border: '1px solid rgba(255,255,255,0.18)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.25)',
};

const EMPTY = { memberId: '', dayOfWeek: 1, meal: 'lunch', time: '08:00', note: '' };

export default function AdminMarketDuty() {
  const [duties,  setDuties]  = useState([]);
  const [members, setMembers] = useState([]);
  const [form,    setForm]    = useState(EMPTY);
  const [editId,  setEditId]  = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = () => {
    api.get('/admin/market-duty').then(r => setDuties(r.data)).catch(() => {});
  };

  useEffect(() => {
    load();
    api.get('/admin/members')
      .then(r => setMembers(r.data.filter(m => m.isActive)))
      .catch(() => {});
  }, []);

  const rn = (name) => { const m = name?.match(/^\w+\s*\((.+)\)$/); return m ? m[1] : (name || ''); };

  const openAdd = () => { setForm(EMPTY); setEditId(null); setShowForm(true); };
  const openEdit = (d) => {
    setForm({ memberId: d.memberId._id, dayOfWeek: d.dayOfWeek, meal: d.meal, time: d.time, note: d.note || '' });
    setEditId(d._id);
    setShowForm(true);
  };

  const save = async () => {
    if (!form.memberId) return toast.error('Select a member');
    setLoading(true);
    try {
      if (editId) {
        await api.put(`/admin/market-duty/${editId}`, form);
        toast.success('Duty updated');
      } else {
        await api.post('/admin/market-duty', form);
        toast.success('Duty added');
      }
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

  const sendWhatsApp = (duty, isNightBefore = false) => {
    const url = buildWaLink(duty, isNightBefore);
    if (!url) return toast.error('No phone number for this member');
    window.open(url, '_blank');
  };

  // Group by day
  const byDay = Array.from({ length: 7 }, (_, i) => ({
    day: i,
    duties: duties.filter(d => d.dayOfWeek === i),
  })).filter(g => g.duties.length > 0);

  // Today's duties
  const todayDay = new Date().getDay();
  const todayDuties = duties.filter(d => d.dayOfWeek === todayDay);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 rounded-2xl p-4" style={glass}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.25)' }}>
            <ShoppingCart size={18} className="text-green-400" />
          </div>
          <div>
            <h1 className="font-bold text-white text-base leading-tight">Market Duty</h1>
            <p className="text-slate-500 text-xs mt-0.5">Weekly grocery schedule · WhatsApp reminders</p>
          </div>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95"
          style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.30)', color: '#4ade80' }}>
          <Plus size={15} /> Add Duty
        </button>
      </div>

      {/* Today's duties — quick send */}
      {todayDuties.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ ...glass, border: '1px solid rgba(34,197,94,0.35)' }}>
          <div className="px-4 py-3 flex items-center gap-2"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.10)', background: 'rgba(34,197,94,0.08)' }}>
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <p className="text-sm font-bold text-green-300">Today's Duty — {DAYS[todayDay]}</p>
          </div>
          <div className="p-3 space-y-2">
            {todayDuties.map(d => (
              <div key={d._id} className="flex items-center justify-between rounded-xl px-3 py-2.5"
                style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.18)' }}>
                <div>
                  <p className="text-white font-semibold text-sm">{rn(d.memberId?.name)}</p>
                  <p className="text-slate-400 text-xs mt-0.5">
                    {d.meal === 'lunch' ? '☀️ Lunch' : '🌙 Dinner'} · {d.time}
                    {d.memberId?.phone && <span className="ml-2 text-slate-500">{d.memberId.phone}</span>}
                  </p>
                </div>
                <button onClick={() => sendWhatsApp(d)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
                  style={{ background: 'rgba(37,211,102,0.18)', border: '1px solid rgba(37,211,102,0.35)', color: '#25d366' }}>
                  <Send size={13} /> Send WhatsApp
                </button>
                {d.meal === 'lunch' && (
                  <button onClick={() => sendWhatsApp(d, true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
                    style={{ background: 'rgba(139,92,246,0.18)', border: '1px solid rgba(139,92,246,0.35)', color: '#c4b5fd' }}>
                    <Send size={13} /> Send Tonight
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="rounded-2xl overflow-hidden" style={glass}>
          <div className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.04)' }}>
            <p className="font-bold text-white text-sm">{editId ? 'Edit Duty' : 'Add New Duty'}</p>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white"><X size={16} /></button>
          </div>
          <div className="p-4 space-y-3">
            {/* Member */}
            <div>
              <label className="text-xs text-slate-400 font-medium mb-1 block">Member</label>
              <select value={form.memberId} onChange={e => setForm(f => ({ ...f, memberId: e.target.value }))}
                className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)' }}>
                <option value="">Select member...</option>
                {members.map(m => (
                  <option key={m._id} value={m._id}>{rn(m.name)}{m.phone ? ` · ${m.phone}` : ' · ⚠️ no phone'}</option>
                ))}
              </select>
            </div>
            {/* Day + Meal */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-medium mb-1 block">Day of Week</label>
                <select value={form.dayOfWeek} onChange={e => setForm(f => ({ ...f, dayOfWeek: Number(e.target.value) }))}
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)' }}>
                  {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium mb-1 block">Meal</label>
                <select value={form.meal} onChange={e => setForm(f => ({ ...f, meal: e.target.value }))}
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)' }}>
                  <option value="lunch">☀️ Lunch</option>
                  <option value="dinner">🌙 Dinner</option>
                </select>
              </div>
            </div>
            {/* Time + Note */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-medium mb-1 block">Reminder Time</label>
                <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', colorScheme: 'dark' }} />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium mb-1 block">Note (optional)</label>
                <input type="text" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                  placeholder="e.g. Buy vegetables"
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none placeholder-slate-600"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)' }} />
              </div>
            </div>
            <button onClick={save} disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95"
              style={{ background: 'rgba(34,197,94,0.20)', border: '1px solid rgba(34,197,94,0.35)', color: '#4ade80', opacity: loading ? 0.7 : 1 }}>
              <Check size={15} /> {loading ? 'Saving...' : editId ? 'Update Duty' : 'Add Duty'}
            </button>
          </div>
        </div>
      )}

      {/* Weekly Schedule */}
      {byDay.length === 0 ? (
        <div className="rounded-2xl p-10 text-center text-slate-600 text-sm" style={glass}>
          No duties scheduled yet. Tap "Add Duty" to get started.
        </div>
      ) : (
        <div className="space-y-3">
          {byDay.map(({ day, duties: dd }) => (
            <div key={day} className="rounded-2xl overflow-hidden" style={glass}>
              <div className="px-4 py-2.5 flex items-center gap-2"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.04)' }}>
                <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">{DAYS[day]}</span>
                {day === todayDay && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,0.20)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.35)' }}>TODAY</span>}
              </div>
              <div className="p-3 space-y-2">
                {dd.map(d => (
                  <div key={d._id} className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 text-white"
                      style={{ background: 'rgba(255,255,255,0.10)' }}>
                      {rn(d.memberId?.name)?.[0]?.toUpperCase()}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{rn(d.memberId?.name)}</p>
                      <p className="text-slate-400 text-xs mt-0.5">
                        {d.meal === 'lunch' ? '☀️ Lunch' : '🌙 Dinner'} · ⏰ {d.time}
                        {d.note && <span className="ml-1 text-slate-500">· {d.note}</span>}
                      </p>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button onClick={() => sendWhatsApp(d)} title="Send WhatsApp"
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-95"
                        style={{ background: 'rgba(37,211,102,0.15)', border: '1px solid rgba(37,211,102,0.28)', color: '#25d366' }}>
                        <Send size={13} />
                      </button>
                      {d.meal === 'lunch' && (
                        <button onClick={() => sendWhatsApp(d, true)} title="Send tonight (night before reminder)"
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-95"
                          style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.28)', color: '#c4b5fd' }}>
                          🌙
                        </button>
                      )}
                      <button onClick={() => openEdit(d)} title="Edit"
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-95"
                        style={{ background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.25)', color: '#93c5fd' }}>
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => remove(d._id)} title="Delete"
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-95"
                        style={{ background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171' }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
