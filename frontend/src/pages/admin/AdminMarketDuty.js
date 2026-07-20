import React, { useEffect, useState, useRef } from 'react';
import { Plus, Trash2, Edit2, Send, X, Check, ShoppingCart, Clock, ChevronRight } from 'lucide-react';
import api from '../../api';
import toast from 'react-hot-toast';
import { buildWaLink } from '../../hooks/useMarketDutyNotifier';
import useAuthStore from '../../store/authStore';

const DAYS     = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const DAYS_FULL= ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const EMPTY    = { memberId: '', dayOfWeek: 1, meal: 'lunch', time: '08:00', note: '' };
const rn = (name) => { const m = name?.match(/^\w+\s*\((.+)\)$/); return m ? m[1] : (name || ''); };

const glass = {
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(255,255,255,0.10)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
};

const inp = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.14)',
  color: '#fff',
  borderRadius: '12px',
  padding: '11px 13px',
  fontSize: '14px',
  width: '100%',
  outline: 'none',
};

// Avatar initials with deterministic color
const AVATAR_COLORS = [
  ['rgba(20,184,166,0.25)','#2dd4bf'],
  ['rgba(99,102,241,0.25)','#a5b4fc'],
  ['rgba(245,158,11,0.25)','#fcd34d'],
  ['rgba(236,72,153,0.25)','#f9a8d4'],
  ['rgba(34,197,94,0.25)', '#86efac'],
  ['rgba(249,115,22,0.25)','#fdba74'],
];
function avatarColor(name) {
  let h = 0;
  for (let i = 0; i < (name?.length || 0); i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function Avatar({ name, size = 36 }) {
  const [bg, fg] = avatarColor(name);
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: bg, color: fg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: size * 0.38, flexShrink: 0 }}>
      {name?.[0]?.toUpperCase()}
    </div>
  );
}

function DutyCard({ d, onEdit, onDelete, onSend }) {
  const name = rn(d.memberId?.name);
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
      {/* Top row */}
      <div className="flex items-center gap-3 px-3 pt-3 pb-2.5">
        <Avatar name={name} />
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm leading-tight truncate">{name}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <Clock size={10} className="text-slate-500 flex-shrink-0" />
            <p className="text-slate-400 text-xs">{d.time}{d.note ? ` · ${d.note}` : ''}</p>
          </div>
        </div>
        {/* Action icons */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button onClick={() => onEdit(d)}
            className="w-8 h-8 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
            style={{ background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.30)' }}>
            <Edit2 size={13} style={{ color: '#60a5fa' }} />
          </button>
          <button onClick={() => onDelete(d._id)}
            className="w-8 h-8 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
            style={{ background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.30)' }}>
            <Trash2 size={13} style={{ color: '#f87171' }} />
          </button>
        </div>
      </div>
      {/* WhatsApp button */}
      <div className="px-3 pb-3">
        <button onClick={() => onSend(d)}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold active:scale-95 transition-transform"
          style={{ background: 'rgba(37,211,102,0.12)', border: '1px solid rgba(37,211,102,0.30)', color: '#22c55e' }}>
          <Send size={12} /> Notify on WhatsApp
        </button>
      </div>
    </div>
  );
}

function MealBlock({ meal, duties, day, onAdd, onEdit, onDelete, onSend }) {
  const isLunch = meal === 'lunch';
  const accent  = isLunch ? '#fbbf24' : '#818cf8';
  const bg      = isLunch ? 'rgba(251,191,36,0.06)' : 'rgba(129,140,248,0.06)';
  const border  = isLunch ? 'rgba(251,191,36,0.20)' : 'rgba(129,140,248,0.20)';
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: bg, border: `1px solid ${border}` }}>
      <div className="flex items-center justify-between px-3 py-2.5" style={{ borderBottom: `1px solid ${border}` }}>
        <span className="text-xs font-bold" style={{ color: accent }}>{isLunch ? '☀️ Lunch' : '🌙 Dinner'}</span>
        <button onClick={() => onAdd({ meal, dayOfWeek: day })}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold active:scale-95 transition-transform"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', color: '#cbd5e1' }}>
          <Plus size={11} /> Add
        </button>
      </div>
      {duties.length === 0
        ? <p className="text-center text-slate-600 text-xs py-4">No one assigned</p>
        : <div className="p-2.5 space-y-2">{duties.map(d => <DutyCard key={d._id} d={d} onEdit={onEdit} onDelete={onDelete} onSend={onSend} />)}</div>
      }
    </div>
  );
}

// Bottom-sheet modal
function FormModal({ form, setForm, members, editId, loading, onSave, onClose }) {
  const sheetRef = useRef(null);
  // Close on backdrop tap
  const onBackdrop = (e) => { if (e.target === e.currentTarget) onClose(); };

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
      onClick={onBackdrop}>
      <div ref={sheetRef}
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden"
        style={{ background: 'rgba(10,16,32,0.98)', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 -8px 48px rgba(0,0,0,0.6)', maxHeight: '92vh', overflowY: 'auto' }}>
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.18)' }} />
        </div>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.30)' }}>
              {editId ? <Edit2 size={14} style={{ color: '#4ade80' }} /> : <Plus size={14} style={{ color: '#4ade80' }} />}
            </div>
            <p className="font-bold text-white text-sm">{editId ? 'Edit Duty' : 'Add Duty'}</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center active:scale-90"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)', color: '#94a3b8' }}>
            <X size={14} />
          </button>
        </div>
        {/* Fields */}
        <div className="p-5 space-y-4">
          {/* Member */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Member</label>
            <select value={form.memberId} onChange={e => setForm(f => ({ ...f, memberId: e.target.value }))} style={inp}>
              <option value="">Select member…</option>
              {members.map(m => (
                <option key={m._id} value={m._id}>{rn(m.name)}{m.phone ? ` · ${m.phone}` : ' · ⚠️ no phone'}</option>
              ))}
            </select>
          </div>
          {/* Day + Meal */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Day</label>
              <select value={form.dayOfWeek} onChange={e => setForm(f => ({ ...f, dayOfWeek: Number(e.target.value) }))} style={inp}>
                {DAYS_FULL.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Meal</label>
              <select value={form.meal} onChange={e => setForm(f => ({ ...f, meal: e.target.value }))} style={inp}>
                <option value="lunch">☀️ Lunch</option>
                <option value="dinner">🌙 Dinner</option>
              </select>
            </div>
          </div>
          {/* Time + Note */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Time</label>
              <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                style={{ ...inp, colorScheme: 'dark' }} />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Note</label>
              <input type="text" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                placeholder="Optional…" style={inp} />
            </div>
          </div>
          {/* Save */}
          <button onClick={onSave} disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold active:scale-95 transition-transform"
            style={{ background: loading ? 'rgba(34,197,94,0.12)' : 'rgba(34,197,94,0.20)', border: '1px solid rgba(34,197,94,0.45)', color: '#4ade80', opacity: loading ? 0.7 : 1 }}>
            <Check size={15} /> {loading ? 'Saving…' : editId ? 'Update Duty' : 'Save Duty'}
          </button>
        </div>
      </div>
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
  const [activeDay, setActiveDay] = useState(new Date().getDay());
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
  };

  const openEdit = (d) => {
    setForm({ memberId: d.memberId._id, dayOfWeek: d.dayOfWeek, meal: d.meal, time: d.time, note: d.note || '' });
    setEditId(d._id);
    setShowForm(true);
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
  // Days that have at least one duty
  const activeDays = Array.from({ length: 7 }, (_, i) => i).filter(i => duties.some(d => d.dayOfWeek === i));
  const lunchDuties  = duties.filter(d => d.dayOfWeek === activeDay && d.meal === 'lunch');
  const dinnerDuties = duties.filter(d => d.dayOfWeek === activeDay && d.meal === 'dinner');
  const totalToday   = duties.filter(d => d.dayOfWeek === todayDay).length;

  return (
    <div className="space-y-4 pb-6">
      {/* ── Header ── */}
      <div className="rounded-2xl p-4" style={glass}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.30)' }}>
              <ShoppingCart size={20} style={{ color: '#4ade80' }} />
            </div>
            <div>
              <h1 className="font-bold text-white text-base leading-tight">Market Duty</h1>
              <p className="text-slate-500 text-xs mt-0.5">Weekly grocery schedule</p>
            </div>
          </div>
          <button onClick={() => openAdd()}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold active:scale-95 transition-transform flex-shrink-0"
            style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.35)', color: '#4ade80' }}>
            <Plus size={14} /> Add Duty
          </button>
        </div>

        {/* Stats row */}
        {duties.length > 0 && (
          <div className="flex items-center gap-3 mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            {[
              { label: 'Total Duties', value: duties.length, color: '#4ade80' },
              { label: 'Days Covered', value: activeDays.length, color: '#60a5fa' },
              { label: "Today's Duties", value: totalToday, color: '#fbbf24' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex-1 text-center">
                <p className="text-base font-bold tabular-nums" style={{ color }}>{value}</p>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {duties.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={glass}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.20)' }}>
            <ShoppingCart size={28} style={{ color: '#4ade80' }} />
          </div>
          <p className="text-white font-semibold text-sm">No duties scheduled yet</p>
          <p className="text-slate-500 text-xs mt-1 mb-5">Tap "Add Duty" to get started</p>
          <button onClick={() => openAdd()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold active:scale-95 transition-transform"
            style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.35)', color: '#4ade80' }}>
            <Plus size={14} /> Add First Duty
          </button>
        </div>
      ) : (
        <>
          {/* ── Day Pill Tabs ── */}
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {Array.from({ length: 7 }, (_, i) => {
              const hasDuty = activeDays.includes(i);
              const isToday = i === todayDay;
              const isSel   = i === activeDay;
              return (
                <button key={i} onClick={() => setActiveDay(i)}
                  className="flex-shrink-0 flex flex-col items-center gap-1 px-3.5 py-2.5 rounded-2xl transition-all active:scale-95"
                  style={{
                    background: isSel ? 'rgba(34,197,94,0.18)' : 'rgba(255,255,255,0.04)',
                    border: isSel ? '1px solid rgba(34,197,94,0.45)' : '1px solid rgba(255,255,255,0.08)',
                    minWidth: 52,
                    WebkitTapHighlightColor: 'transparent',
                  }}>
                  <span className="text-[10px] font-bold uppercase tracking-wide"
                    style={{ color: isSel ? '#4ade80' : '#64748b' }}>{DAYS[i]}</span>
                  <div className="flex items-center gap-1">
                    {isToday && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />}
                    {hasDuty
                      ? <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: isSel ? '#4ade80' : '#334155' }} />
                      : <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'transparent' }} />
                    }
                  </div>
                </button>
              );
            })}
          </div>

          {/* ── Selected Day Panel ── */}
          <div className="rounded-2xl overflow-hidden" style={glass}>
            {/* Day header */}
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center gap-2">
                <p className="font-bold text-white text-sm">{DAYS_FULL[activeDay]}</p>
                {activeDay === todayDay && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(251,191,36,0.18)', color: '#fcd34d', border: '1px solid rgba(251,191,36,0.35)' }}>TODAY</span>
                )}
              </div>
              <button onClick={() => openAdd({ dayOfWeek: activeDay })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold active:scale-95 transition-transform"
                style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.28)', color: '#4ade80' }}>
                <Plus size={12} /> Add
              </button>
            </div>
            <div className="p-3 space-y-3">
              <MealBlock meal="lunch"  duties={lunchDuties}  day={activeDay} onAdd={openAdd} onEdit={openEdit} onDelete={remove} onSend={sendWhatsApp} />
              <MealBlock meal="dinner" duties={dinnerDuties} day={activeDay} onAdd={openAdd} onEdit={openEdit} onDelete={remove} onSend={sendWhatsApp} />
            </div>
          </div>

          {/* ── Full Week Overview ── */}
          <div className="rounded-2xl overflow-hidden" style={glass}>
            <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-sm font-bold text-white">Full Week Overview</p>
              <p className="text-slate-500 text-xs mt-0.5">{activeDays.length} of 7 days covered</p>
            </div>
            <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              {Array.from({ length: 7 }, (_, i) => {
                const dayDuties = duties.filter(d => d.dayOfWeek === i);
                const isToday   = i === todayDay;
                const isSel     = i === activeDay;
                return (
                  <button key={i} onClick={() => setActiveDay(i)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-white/5 transition-colors"
                    style={{ WebkitTapHighlightColor: 'transparent', background: isSel ? 'rgba(34,197,94,0.06)' : 'transparent' }}>
                    {/* Day pill */}
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: isSel ? 'rgba(34,197,94,0.18)' : 'rgba(255,255,255,0.05)', border: isSel ? '1px solid rgba(34,197,94,0.35)' : '1px solid rgba(255,255,255,0.08)' }}>
                      <span className="text-xs font-bold" style={{ color: isSel ? '#4ade80' : '#64748b' }}>{DAYS[i]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold" style={{ color: isSel ? '#4ade80' : '#e2e8f0' }}>{DAYS_FULL[i]}</span>
                        {isToday && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(251,191,36,0.18)', color: '#fcd34d', border: '1px solid rgba(251,191,36,0.30)' }}>TODAY</span>}
                      </div>
                      {dayDuties.length > 0 ? (
                        <div className="flex items-center gap-2 mt-0.5">
                          {['lunch','dinner'].map(meal => {
                            const cnt = dayDuties.filter(d => d.meal === meal).length;
                            if (!cnt) return null;
                            return (
                              <span key={meal} className="text-[10px] font-medium" style={{ color: meal === 'lunch' ? '#fbbf24' : '#818cf8' }}>
                                {meal === 'lunch' ? '☀️' : '🌙'} {cnt}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-600 mt-0.5">No duties</p>
                      )}
                    </div>
                    <ChevronRight size={14} style={{ color: isSel ? '#4ade80' : '#334155', flexShrink: 0 }} />
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ── Form Modal ── */}
      {showForm && (
        <FormModal
          form={form} setForm={setForm}
          members={members} editId={editId}
          loading={loading} onSave={save}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
