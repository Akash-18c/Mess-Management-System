import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Plus, X, UserPlus, UtensilsCrossed, Pencil, Trash2, ChevronDown, ChevronUp, Users } from 'lucide-react';
import api from '../../api';

const now = new Date();

const glass = {
  background: 'rgba(15,20,35,0.85)',
  border: '1px solid rgba(255,255,255,0.10)',
  boxShadow: '0 4px 20px rgba(0,0,0,0.40)',
};
const modalGlass = {
  background: 'rgba(10,15,30,0.97)',
  backdropFilter: 'blur(48px)',
  WebkitBackdropFilter: 'blur(48px)',
  border: '1px solid rgba(255,255,255,0.14)',
  boxShadow: '0 24px 64px rgba(0,0,0,0.75)',
};
const inputStyle = {
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.16)',
  color: '#fff',
  borderRadius: '12px',
  padding: '11px 14px',
  fontSize: '14px',
  width: '100%',
  outline: 'none',
};

const ACCENT = { color: '#10b981', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.35)' };

function totalMeals(g) { return g.meals.reduce((s, m) => s + (m.lunch ? 1 : 0) + (m.dinner ? 1 : 0), 0); }
function totalCharge(g) { return g.meals.reduce((s, m) => s + (m.charge || 0), 0); }

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function AdminGuestMembers() {
  const [selMonth, setSelMonth] = useState(now.getMonth() + 1);
  const [selYear,  setSelYear]  = useState(now.getFullYear());

  const [guests,     setGuests]     = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [guestModal, setGuestModal] = useState(false);
  const [mealModal,  setMealModal]  = useState(false);
  const [delModal,   setDelModal]   = useState(null); // guest to delete
  const [editGuest,  setEditGuest]  = useState(null);
  const [editMeal,   setEditMeal]   = useState(null);
  const [expanded,   setExpanded]   = useState({});

  const [gForm, setGForm] = useState({ name: '', phone: '', note: '', mealRate: '' });
  const [mForm, setMForm] = useState({ date: now.toISOString().slice(0,10), lunch: false, dinner: false, customRate: '' });

  const load = useCallback(() => {
    api.get(`/guests/${selMonth}/${selYear}`).then(r => setGuests(r.data)).catch(() => {});
  }, [selMonth, selYear]);

  useEffect(() => { load(); }, [load]);

  // ── Guest helpers ──
  const openAddGuest = () => {
    setEditGuest(null);
    setGForm({ name: '', phone: '', note: '', mealRate: '' });
    setGuestModal(true);
  };
  const openEditGuest = (g) => {
    setEditGuest(g);
    setGForm({ name: g.name, phone: g.phone || '', note: g.note || '', mealRate: g.mealRate || '' });
    setGuestModal(true);
  };
  const saveGuest = async (e) => {
    e.preventDefault();
    if (!gForm.name.trim()) return toast.error('Name required');
    setLoading(true);
    try {
      const payload = { name: gForm.name.trim(), phone: gForm.phone, note: gForm.note, mealRate: +gForm.mealRate || 0, month: selMonth, year: selYear };
      if (editGuest) {
        await api.put(`/guests/${editGuest._id}`, payload);
        toast.success('Guest updated');
      } else {
        const r = await api.post('/guests', payload);
        setExpanded(p => ({ ...p, [r.data._id]: true }));
        toast.success('Guest added');
      }
      setGuestModal(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setLoading(false); }
  };
  const deleteGuest = async () => {
    if (!delModal) return;
    setLoading(true);
    try {
      await api.delete(`/guests/${delModal._id}`);
      toast.success('Guest deleted');
      setDelModal(null);
      load();
    } catch { toast.error('Error deleting guest'); }
    finally { setLoading(false); }
  };

  // ── Meal helpers ──
  const openAddMeal = (guest) => {
    setEditMeal({ guestId: guest._id, meal: null, guest });
    setMForm({ date: now.toISOString().slice(0,10), lunch: false, dinner: false, customRate: guest.mealRate || '' });
    setMealModal(true);
  };
  const openEditMeal = (guest, meal) => {
    setEditMeal({ guestId: guest._id, meal, guest });
    setMForm({ date: meal.date?.slice(0,10) || now.toISOString().slice(0,10), lunch: meal.lunch, dinner: meal.dinner, customRate: meal.customRate || guest.mealRate || '' });
    setMealModal(true);
  };
  const deleteMeal = async (guest, mealId) => {
    const updatedMeals = guest.meals.filter(m => m._id !== mealId);
    try {
      await api.put(`/guests/${guest._id}`, { meals: updatedMeals });
      toast.success('Meal deleted');
      load();
    } catch { toast.error('Error'); }
  };
  const saveMeal = async (e) => {
    e.preventDefault();
    if (!mForm.lunch && !mForm.dinner) return toast.error('Select at least one meal');
    const rate = +mForm.customRate || 0;
    const count = (mForm.lunch ? 1 : 0) + (mForm.dinner ? 1 : 0);
    const charge = parseFloat((count * rate).toFixed(2));
    const guest = guests.find(g => g._id === editMeal.guestId);
    if (!guest) return;
    let updatedMeals;
    if (editMeal.meal) {
      updatedMeals = guest.meals.map(m =>
        m._id === editMeal.meal._id
          ? { ...m, date: mForm.date, lunch: mForm.lunch, dinner: mForm.dinner, customRate: rate, charge }
          : m
      );
    } else {
      updatedMeals = [...guest.meals, { date: mForm.date, lunch: mForm.lunch, dinner: mForm.dinner, customRate: rate, charge }];
    }
    setLoading(true);
    try {
      await api.put(`/guests/${editMeal.guestId}`, { meals: updatedMeals });
      toast.success(editMeal.meal ? 'Meal updated' : 'Meal added');
      setMealModal(false);
      load();
    } catch { toast.error('Error saving meal'); }
    finally { setLoading(false); }
  };

  const toggle = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));
  const years = [selYear - 1, selYear, selYear + 1];

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="rounded-2xl p-4" style={glass}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: ACCENT.bg, border: `1px solid ${ACCENT.border}` }}>
              <Users size={20} style={{ color: ACCENT.color }} />
            </div>
            <div>
              <h1 className="font-bold text-white text-base">Guest Members</h1>
              <p className="text-slate-400 text-xs mt-0.5">{guests.length} guest{guests.length !== 1 ? 's' : ''} · {MONTHS[selMonth-1]} {selYear}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Month selector */}
            <select value={selMonth} onChange={e => setSelMonth(+e.target.value)}
              style={{ ...inputStyle, width: 'auto', padding: '8px 12px', fontSize: '13px' }}>
              {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
            </select>
            {/* Year selector */}
            <select value={selYear} onChange={e => setSelYear(+e.target.value)}
              style={{ ...inputStyle, width: 'auto', padding: '8px 12px', fontSize: '13px' }}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button onClick={openAddGuest}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold active:scale-95 transition-transform flex-shrink-0"
              style={{ background: ACCENT.bg, border: `1px solid ${ACCENT.border}`, color: ACCENT.color, boxShadow: '0 0 16px rgba(16,185,129,0.15)' }}>
              <UserPlus size={15} /> Add Guest
            </button>
          </div>
        </div>
      </div>

      {/* ── Empty state ── */}
      {guests.length === 0 && (
        <div className="rounded-2xl p-12 text-center" style={glass}>
          <Users size={38} className="mx-auto mb-3 text-slate-600" />
          <p className="text-white font-semibold text-sm">No guests for this period</p>
          <p className="text-slate-500 text-xs mt-1">Tap "Add Guest" to register a guest member</p>
        </div>
      )}

      {/* ── Guest Cards ── */}
      {guests.map((g) => {
        const isOpen = expanded[g._id];
        const tc = totalCharge(g);
        const tm = totalMeals(g);
        return (
          <div key={g._id} className="rounded-2xl overflow-hidden" style={glass}>

            {/* Guest header */}
            <div className="flex items-center gap-3 px-4 py-3 cursor-pointer"
              style={{ borderBottom: isOpen ? '1px solid rgba(255,255,255,0.08)' : 'none', background: 'rgba(0,0,0,0.15)' }}
              onClick={() => toggle(g._id)}>
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ background: ACCENT.bg, color: ACCENT.color, border: `1px solid ${ACCENT.border}` }}>
                {g.name[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm truncate">{g.name}</p>
                <p className="text-slate-400 text-xs mt-0.5">
                  {tm} meal{tm !== 1 ? 's' : ''} · ₹{tc.toFixed(2)} total
                  {g.mealRate > 0 && <span className="ml-1 text-emerald-400">· ₹{g.mealRate}/meal</span>}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={e => { e.stopPropagation(); openEditGuest(g); }}
                  className="w-8 h-8 rounded-xl flex items-center justify-center active:scale-95"
                  style={{ background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.30)', color: '#60a5fa' }}>
                  <Pencil size={13} />
                </button>
                <button onClick={e => { e.stopPropagation(); setDelModal(g); }}
                  className="w-8 h-8 rounded-xl flex items-center justify-center active:scale-95"
                  style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.28)', color: '#f87171' }}>
                  <Trash2 size={13} />
                </button>
                {isOpen ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
              </div>
            </div>

            {/* Expanded: meals */}
            {isOpen && (
              <div>
                <div className="px-4 py-2.5 flex items-center justify-between"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(16,185,129,0.04)' }}>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Meal Entries</p>
                  <button onClick={() => openAddMeal(g)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold active:scale-95"
                    style={{ background: ACCENT.bg, border: `1px solid ${ACCENT.border}`, color: ACCENT.color }}>
                    <Plus size={12} /> Add Meal
                  </button>
                </div>

                {g.meals.length === 0 ? (
                  <div className="py-6 text-center">
                    <UtensilsCrossed size={24} className="mx-auto mb-2 text-slate-600" />
                    <p className="text-slate-500 text-xs">No meals added yet</p>
                  </div>
                ) : (
                  <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    {[...g.meals].sort((a, b) => a.date > b.date ? 1 : -1).map((m) => (
                      <div key={m._id} className="flex items-center gap-3 px-4 py-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-semibold">
                            {new Date(m.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {m.lunch  && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.25)' }}>☀️ Lunch</span>}
                            {m.dinner && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.15)', color: '#a78bfa', border: '1px solid rgba(99,102,241,0.25)' }}>🌙 Dinner</span>}
                            {m.customRate > 0 && <span className="text-[10px] text-slate-500">₹{m.customRate}/meal</span>}
                          </div>
                        </div>
                        <span className="text-sm font-bold text-emerald-400 flex-shrink-0">₹{(m.charge || 0).toFixed(2)}</span>
                        <button onClick={() => openEditMeal(g, m)}
                          className="w-8 h-8 rounded-xl flex items-center justify-center active:scale-95 flex-shrink-0"
                          style={{ background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.30)', color: '#60a5fa' }}>
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => deleteMeal(g, m._id)}
                          className="w-8 h-8 rounded-xl flex items-center justify-center active:scale-95 flex-shrink-0"
                          style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.28)', color: '#f87171' }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {g.meals.length > 0 && (
                  <div className="flex items-center justify-between px-4 py-2.5"
                    style={{ background: 'rgba(16,185,129,0.06)', borderTop: '1px solid rgba(16,185,129,0.15)' }}>
                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-wide">{tm} meals · Total</span>
                    <span className="text-sm font-bold text-emerald-400">₹{tc.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* ── Guest Modal ── */}
      {guestModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden" style={modalGlass}>
            <div className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.10)' }}>
              <h2 className="font-bold text-white text-sm">{editGuest ? 'Edit Guest' : 'Add Guest'}</h2>
              <button onClick={() => setGuestModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)', color: '#94a3b8' }}>
                <X size={15} />
              </button>
            </div>
            <form onSubmit={saveGuest} className="px-5 py-4 space-y-4">
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1.5 block">Name *</label>
                <input style={inputStyle} placeholder="Guest name" value={gForm.name}
                  onChange={e => setGForm(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1.5 block">Phone</label>
                  <input style={inputStyle} placeholder="Optional" value={gForm.phone}
                    onChange={e => setGForm(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1.5 block">Default Rate (₹)</label>
                  <input style={inputStyle} type="number" min="0" step="0.01" placeholder="0.00" value={gForm.mealRate}
                    onChange={e => setGForm(p => ({ ...p, mealRate: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1.5 block">Note</label>
                <input style={inputStyle} placeholder="Optional note" value={gForm.note}
                  onChange={e => setGForm(p => ({ ...p, note: e.target.value }))} />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setGuestModal(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-bold active:scale-95"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)', color: '#94a3b8' }}>
                  Cancel
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 py-3 rounded-xl text-sm font-bold active:scale-95"
                  style={{ background: ACCENT.bg, border: `1px solid ${ACCENT.border}`, color: ACCENT.color, opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Saving…' : editGuest ? 'Update' : 'Add Guest'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Meal Modal ── */}
      {mealModal && editMeal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
          <div className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl overflow-hidden" style={modalGlass}>
            <div className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.10)' }}>
              <div>
                <h2 className="font-bold text-white text-sm">{editMeal.meal ? 'Edit Meal' : 'Add Meal'}</h2>
                <p className="text-slate-500 text-xs mt-0.5">{editMeal.guest.name}</p>
              </div>
              <button onClick={() => setMealModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)', color: '#94a3b8' }}>
                <X size={15} />
              </button>
            </div>
            <form onSubmit={saveMeal} className="px-5 py-4 space-y-4">
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1.5 block">Date</label>
                <input style={{ ...inputStyle, colorScheme: 'dark' }} type="date"
                  value={mForm.date} onChange={e => setMForm(p => ({ ...p, date: e.target.value }))} required />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2 block">Meals</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'lunch',  label: '☀️ Lunch',  active: 'rgba(251,191,36,0.20)', border: 'rgba(251,191,36,0.45)', color: '#fbbf24' },
                    { key: 'dinner', label: '🌙 Dinner', active: 'rgba(99,102,241,0.20)',  border: 'rgba(99,102,241,0.45)',  color: '#a78bfa' },
                  ].map(({ key, label, active, border, color }) => (
                    <button key={key} type="button"
                      onClick={() => setMForm(p => ({ ...p, [key]: !p[key] }))}
                      className="py-3 rounded-xl text-sm font-bold active:scale-95 transition-all"
                      style={{
                        background: mForm[key] ? active : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${mForm[key] ? border : 'rgba(255,255,255,0.10)'}`,
                        color: mForm[key] ? color : '#64748b',
                      }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1.5 block">
                  Rate per meal (₹) <span className="text-slate-600 normal-case font-normal">— overrides default</span>
                </label>
                <input style={inputStyle} type="number" min="0" step="0.01"
                  placeholder={`Default: ${editMeal.guest.mealRate || 0}`}
                  value={mForm.customRate} onChange={e => setMForm(p => ({ ...p, customRate: e.target.value }))} />
              </div>
              {(mForm.lunch || mForm.dinner) && (
                <div className="rounded-xl px-4 py-3 flex items-center justify-between"
                  style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.20)' }}>
                  <span className="text-xs text-slate-400">Charge for this entry</span>
                  <span className="text-base font-bold text-emerald-400">
                    ₹{(((mForm.lunch ? 1 : 0) + (mForm.dinner ? 1 : 0)) * (+mForm.customRate || editMeal.guest.mealRate || 0)).toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setMealModal(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-bold active:scale-95"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)', color: '#94a3b8' }}>
                  Cancel
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 py-3 rounded-xl text-sm font-bold active:scale-95"
                  style={{ background: ACCENT.bg, border: `1px solid ${ACCENT.border}`, color: ACCENT.color, opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Saving…' : editMeal.meal ? 'Update' : 'Add Meal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {delModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={modalGlass}>
            <div className="px-5 py-5 text-center">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.30)' }}>
                <Trash2 size={20} className="text-red-400" />
              </div>
              <h2 className="font-bold text-white text-sm mb-1">Delete Guest?</h2>
              <p className="text-slate-400 text-xs">This will permanently delete <span className="text-white font-semibold">{delModal.name}</span> and all their meal entries.</p>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setDelModal(null)}
                  className="flex-1 py-3 rounded-xl text-sm font-bold active:scale-95"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)', color: '#94a3b8' }}>
                  Cancel
                </button>
                <button onClick={deleteGuest} disabled={loading}
                  className="flex-1 py-3 rounded-xl text-sm font-bold active:scale-95"
                  style={{ background: 'rgba(239,68,68,0.18)', border: '1px solid rgba(239,68,68,0.35)', color: '#f87171', opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
