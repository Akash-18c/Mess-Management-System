import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Plus, X, UserPlus, UtensilsCrossed, Pencil, ChevronDown, ChevronUp, Users, Download } from 'lucide-react';
import api from '../../api';
import useActivePeriod from '../../hooks/useActivePeriod';
import { downloadGuestReport } from '../../utils/downloadGuestReport';

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

const ACCENT = { color: '#fbbf24', bg: 'rgba(245,158,11,0.18)', border: 'rgba(245,158,11,0.40)' };

function totalMeals(g) { return g.meals.reduce((s, m) => s + (m.lunch ? 1 : 0) + (m.dinner ? 1 : 0), 0); }
function totalCharge(g) { return g.meals.reduce((s, m) => s + (m.charge || 0), 0); }

export default function ManagerGuestMembers() {
  const { period } = useActivePeriod();
  const MONTH = period?.month || now.getMonth() + 1;
  const YEAR  = period?.year  || now.getFullYear();

  const [guests,      setGuests]      = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [guestModal,  setGuestModal]  = useState(false); // add/edit guest info
  const [mealModal,   setMealModal]   = useState(false); // add/edit meal
  const [editGuest,   setEditGuest]   = useState(null);  // guest being edited
  const [editMeal,    setEditMeal]    = useState(null);  // { guestId, meal } or null for new
  const [expanded,    setExpanded]    = useState({});

  const [gForm, setGForm] = useState({ name: '', phone: '', note: '', mealRate: '' });
  const [mForm, setMForm] = useState({ date: now.toISOString().slice(0, 10), lunch: false, dinner: false, customRate: '', note: '' });

  const load = useCallback(() => {
    api.get(`/guests/${MONTH}/${YEAR}`).then(r => setGuests(r.data)).catch(() => {});
  }, [MONTH, YEAR]);

  useEffect(() => { load(); }, [load]);

  // ── Guest modal helpers ──
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
      const payload = { name: gForm.name.trim(), phone: gForm.phone, note: gForm.note, mealRate: +gForm.mealRate || 0, month: MONTH, year: YEAR };
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

  // ── Meal modal helpers ──
  const openAddMeal = (guest) => {
    setEditMeal({ guestId: guest._id, meal: null, guest });
    setMForm({ date: now.toISOString().slice(0, 10), lunch: false, dinner: false, customRate: guest.mealRate || '', note: '' });
    setMealModal(true);
  };
  const openEditMeal = (guest, meal) => {
    setEditMeal({ guestId: guest._id, meal, guest });
    setMForm({ date: meal.date?.slice(0, 10) || now.toISOString().slice(0, 10), lunch: meal.lunch, dinner: meal.dinner, customRate: meal.customRate || guest.mealRate || '', note: meal.note || '' });
    setMealModal(true);
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
          ? { ...m, date: mForm.date, lunch: mForm.lunch, dinner: mForm.dinner, customRate: rate, charge, note: mForm.note }
          : m
      );
    } else {
      updatedMeals = [...guest.meals, { date: mForm.date, lunch: mForm.lunch, dinner: mForm.dinner, customRate: rate, charge, note: mForm.note }];
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

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="rounded-2xl p-4" style={glass}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: ACCENT.bg, border: `1px solid ${ACCENT.border}` }}>
              <Users size={20} style={{ color: ACCENT.color }} />
            </div>
            <div>
              <h1 className="font-bold text-white text-base">Guest Members</h1>
              <p className="text-slate-400 text-xs mt-0.5">{guests.length} guest{guests.length !== 1 ? 's' : ''} this month</p>
            </div>
          </div>
          <button onClick={openAddGuest}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold active:scale-95 transition-transform flex-shrink-0"
            style={{ background: ACCENT.bg, border: `1px solid ${ACCENT.border}`, color: ACCENT.color, boxShadow: '0 0 16px rgba(245,158,11,0.15)' }}>
            <UserPlus size={15} /> Add Guest
          </button>
        </div>
      </div>

      {/* ── Empty state ── */}
      {guests.length === 0 && (
        <div className="rounded-2xl p-12 text-center" style={glass}>
          <Users size={38} className="mx-auto mb-3 text-slate-600" />
          <p className="text-white font-semibold text-sm">No guests yet</p>
          <p className="text-slate-500 text-xs mt-1">Tap "Add Guest" to register a guest member</p>
        </div>
      )}

      {/* ── Guest Cards ── */}
      {guests.map((g, gi) => {
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
                  {g.mealRate > 0 && <span className="ml-1 text-amber-400">· ₹{g.mealRate}/meal</span>}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={e => { e.stopPropagation(); openEditGuest(g); }}
                  className="w-8 h-8 rounded-xl flex items-center justify-center active:scale-95"
                  style={{ background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.30)', color: '#60a5fa' }}>
                  <Pencil size={13} />
                </button>
                <button onClick={e => { e.stopPropagation(); downloadGuestReport(g); }}
                  className="w-8 h-8 rounded-xl flex items-center justify-center active:scale-95"
                  style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.28)', color: '#34d399' }}
                  title="Download Report">
                  <Download size={13} />
                </button>
                {isOpen ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
              </div>
            </div>

            {/* Expanded: meals list + add meal */}
            {isOpen && (
              <div>
                {/* Add meal button */}
                <div className="px-4 py-2.5 flex items-center justify-between"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(245,158,11,0.04)' }}>
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
                  <div className="p-3 grid gap-2">
                    {[...g.meals].sort((a, b) => a.date > b.date ? 1 : -1).map((m) => (
                      <div key={m._id} className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        {/* Date badge */}
                        <div className="flex-shrink-0 text-center rounded-lg px-2 py-1.5 min-w-[44px]"
                          style={{ background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.18)' }}>
                          <p className="text-[9px] font-bold text-amber-500 uppercase leading-none">
                            {new Date(m.date + 'T00:00:00').toLocaleDateString('en-IN', { month: 'short' })}
                          </p>
                          <p className="text-base font-extrabold text-amber-400 leading-tight">
                            {new Date(m.date + 'T00:00:00').getDate()}
                          </p>
                          <p className="text-[9px] text-amber-600 leading-none">
                            {new Date(m.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short' })}
                          </p>
                        </div>
                        {/* Meal info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {m.lunch  && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.25)' }}>☀️ Lunch</span>}
                            {m.dinner && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.15)', color: '#a78bfa', border: '1px solid rgba(99,102,241,0.25)' }}>🌙 Dinner</span>}
                          </div>
                          {(m.note || m.customRate > 0) && (
                            <p className="text-[10px] text-slate-500 mt-1 truncate">
                              {m.customRate > 0 && `₹${m.customRate}/meal`}{m.customRate > 0 && m.note && ' · '}{m.note && `📝 ${m.note}`}
                            </p>
                          )}
                        </div>
                        {/* Charge + edit */}
                        <span className="text-sm font-bold text-amber-400 flex-shrink-0">₹{(m.charge || 0).toFixed(2)}</span>
                        <button onClick={() => openEditMeal(g, m)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center active:scale-95 flex-shrink-0"
                          style={{ background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.22)', color: '#60a5fa' }}>
                          <Pencil size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Total footer */}
                {g.meals.length > 0 && (
                  <div className="flex items-center justify-between px-4 py-2.5"
                    style={{ background: 'rgba(245,158,11,0.06)', borderTop: '1px solid rgba(245,158,11,0.15)' }}>
                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-wide">{tm} meals · Total</span>
                    <span className="text-sm font-bold text-amber-400">₹{tc.toFixed(2)}</span>
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

              {/* Meal toggles */}
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
                <input style={inputStyle} type="number" min="0" step="0.01" placeholder={`Default: ${editMeal.guest.mealRate || 0}`}
                  value={mForm.customRate} onChange={e => setMForm(p => ({ ...p, customRate: e.target.value }))} />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1.5 block">Note</label>
                <input style={inputStyle} placeholder="e.g. special request, occasion…" value={mForm.note}
                  onChange={e => setMForm(p => ({ ...p, note: e.target.value }))} />
              </div>

              {/* Live charge preview */}
              {(mForm.lunch || mForm.dinner) && (
                <div className="rounded-xl px-4 py-3 flex items-center justify-between"
                  style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.20)' }}>
                  <span className="text-xs text-slate-400">Charge for this entry</span>
                  <span className="text-base font-bold text-amber-400">
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
    </div>
  );
}
