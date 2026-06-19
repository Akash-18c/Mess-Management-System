import React, { useEffect, useRef, useState } from 'react';
import { IndianRupee, Users, Pencil, Trash2, CheckCircle2, ChevronDown, HandCoins, Info, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api';

const MONTHS_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const glass = {
  background: 'rgba(255,255,255,0.03)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(255,255,255,0.08)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
};

const rn = (name) => { const m = name?.match(/^\w+\s*\((.+)\)$/); return m ? m[1] : (name || ''); };

export default function AdminMasiSalary() {
  const now = new Date();
  const [month,   setMonth]   = useState(now.getMonth() + 1);
  const [year,    setYear]    = useState(now.getFullYear());
  const [amount,  setAmount]  = useState('');
  const [record,  setRecord]  = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const inputRef  = useRef(null);
  const monthRef  = useRef(null);
  const yearRef   = useRef(null);
  const [monthOpen, setMonthOpen] = useState(false);
  const [yearOpen,  setYearOpen]  = useState(false);

  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

  // close dropdowns on outside click
  useEffect(() => {
    const h = (e) => {
      if (monthRef.current && !monthRef.current.contains(e.target)) setMonthOpen(false);
      if (yearRef.current  && !yearRef.current.contains(e.target))  setYearOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => {
    api.get('/admin/members').then(r => setMembers(r.data.filter(m => m.isActive))).catch(() => {});
  }, []);

  useEffect(() => {
    setEditing(false);
    setConfirmDelete(false);
    api.get(`/admin/masi-salary/${month}/${year}`)
      .then(r => { setRecord(r.data); setAmount(r.data.totalAmount > 0 ? String(r.data.totalAmount) : ''); })
      .catch(() => { setRecord(null); setAmount(''); });
  }, [month, year]);

  const handleSave = async () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return toast.error('Enter a valid amount');
    setLoading(true);
    try {
      const r = await api.post('/admin/masi-salary', { month, year, totalAmount: amt });
      setRecord(r.data);
      setEditing(false);
      toast.success(`₹${amt.toFixed(2)} set for ${MONTHS_FULL[month - 1]} ${year}`);
    } catch { toast.error('Failed to save'); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await api.post('/admin/masi-salary', { month, year, totalAmount: 0 });
      setRecord(null); setAmount(''); setEditing(false); setConfirmDelete(false);
      toast.success('Masi salary removed');
    } catch { toast.error('Failed to remove'); }
    finally { setLoading(false); }
  };

  const startEdit = () => { setEditing(true); setTimeout(() => inputRef.current?.focus(), 80); };
  const cancelEdit = () => { setEditing(false); setAmount(record?.totalAmount > 0 ? String(record.totalAmount) : ''); };

  const isSet   = record && record.totalAmount > 0;
  const preview = parseFloat(amount) || 0;

  /* ─────────────────── render ─────────────────── */
  return (
    <div className="space-y-5 max-w-xl">

      {/* PAGE HEADER */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' }}>
          <HandCoins size={18} className="text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Masi Salary</h1>
          <p className="text-slate-500 text-sm">Fixed charge added to every member's bill each month</p>
        </div>
      </div>

      {/* MONTH / YEAR — z-index wrapper so dropdowns float above everything */}
      <div style={{ position: 'relative', zIndex: 30 }}>
        <div className="rounded-2xl p-5 space-y-4" style={glass}>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Select Period</p>
          <div className="grid grid-cols-2 gap-3">

            {/* Month picker */}
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Month</label>
              <div ref={monthRef} style={{ position: 'relative' }}>
                <button type="button"
                  onClick={() => { setMonthOpen(o => !o); setYearOpen(false); }}
                  className="w-full flex items-center justify-between text-sm font-medium text-white"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '12px', padding: '10px 14px' }}
                >
                  {MONTHS_FULL[month - 1]}
                  <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${monthOpen ? 'rotate-180' : ''}`} />
                </button>
                {monthOpen && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 999, background: 'rgba(8,14,28,0.98)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '14px', boxShadow: '0 24px 60px rgba(0,0,0,0.85)', overflow: 'hidden' }}>
                    <div style={{ maxHeight: '220px', overflowY: 'auto', scrollbarWidth: 'thin' }}>
                      {MONTHS_FULL.map((m, i) => (
                        <button key={i} type="button"
                          onClick={() => { setMonth(i + 1); setMonthOpen(false); }}
                          className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors"
                          style={{ color: month === i + 1 ? '#4ade80' : '#94a3b8', background: month === i + 1 ? 'rgba(74,222,128,0.08)' : 'transparent', borderLeft: month === i + 1 ? '2px solid #22c55e' : '2px solid transparent' }}
                          onMouseEnter={e => { if (month !== i+1) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                          onMouseLeave={e => { if (month !== i+1) e.currentTarget.style.background = 'transparent'; }}
                        >
                          {month === i+1 && <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />}
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Year picker */}
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Year</label>
              <div ref={yearRef} style={{ position: 'relative' }}>
                <button type="button"
                  onClick={() => { setYearOpen(o => !o); setMonthOpen(false); }}
                  className="w-full flex items-center justify-between text-sm font-medium text-white"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '12px', padding: '10px 14px' }}
                >
                  {year}
                  <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${yearOpen ? 'rotate-180' : ''}`} />
                </button>
                {yearOpen && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 999, background: 'rgba(8,14,28,0.98)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '14px', boxShadow: '0 24px 60px rgba(0,0,0,0.85)', overflow: 'hidden' }}>
                    {years.map(y => (
                      <button key={y} type="button"
                        onClick={() => { setYear(y); setYearOpen(false); }}
                        className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors"
                        style={{ color: year === y ? '#4ade80' : '#94a3b8', background: year === y ? 'rgba(74,222,128,0.08)' : 'transparent', borderLeft: year === y ? '2px solid #22c55e' : '2px solid transparent' }}
                        onMouseEnter={e => { if (year !== y) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                        onMouseLeave={e => { if (year !== y) e.currentTarget.style.background = 'transparent'; }}
                      >
                        {year === y && <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />}
                        {y}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* SET / EDIT FORM */}
      {(!isSet || editing) && (
        <div className="rounded-2xl p-5 space-y-4" style={{ ...glass, border: '1px solid rgba(16,185,129,0.20)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 rounded-full bg-emerald-400" />
              <p className="text-white font-semibold text-sm">
                {editing ? 'Edit Salary' : 'Set Salary'} — {MONTHS_FULL[month-1]} {year}
              </p>
            </div>
            {editing && (
              <button onClick={cancelEdit} className="text-slate-500 hover:text-slate-300 transition-colors">
                <X size={16} />
              </button>
            )}
          </div>

          {/* info strip */}
          <div className="flex items-start gap-2.5 rounded-xl px-3.5 py-3"
            style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.14)' }}>
            <Info size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" />
            <p className="text-slate-400 text-xs leading-relaxed">
              This amount is charged to <span className="text-white font-medium">each member individually</span> — it is not split among them.
            </p>
          </div>

          {/* amount input */}
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Amount per member (₹)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold pointer-events-none select-none">₹</span>
              <input
                ref={inputRef}
                type="number" min="0" step="1"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0"
                className="w-full text-white font-bold"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '14px', padding: '13px 16px 13px 32px', fontSize: '22px', outline: 'none' }}
                onFocus={e => { e.target.style.border = '1px solid rgba(16,185,129,0.50)'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.08)'; }}
                onBlur={e =>  { e.target.style.border = '1px solid rgba(255,255,255,0.12)'; e.target.style.boxShadow = 'none'; }}
                onKeyDown={e => e.key === 'Enter' && handleSave()}
              />
            </div>
            {preview > 0 && (
              <p className="text-emerald-400 text-xs mt-2">
                ₹{preview.toFixed(2)} × {members.length} members = <span className="font-bold">₹{(preview * members.length).toFixed(2)}</span> total
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            {editing && (
              <button onClick={cancelEdit}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-300 transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.09)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              >Cancel</button>
            )}
            <button onClick={handleSave} disabled={loading || preview <= 0}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: preview > 0 ? '0 4px 18px rgba(16,185,129,0.28)' : 'none' }}
            >
              <CheckCircle2 size={15} />
              {loading ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* ACTIVE RECORD CARD */}
      {isSet && !editing && (
        <div className="rounded-2xl overflow-hidden" style={glass}>

          {/* header */}
          <div className="px-5 py-4 flex items-center justify-between"
            style={{ background: 'rgba(16,185,129,0.05)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.22)' }}>
                <IndianRupee size={16} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{MONTHS_FULL[month - 1]} {year}</p>
                <p className="text-slate-500 text-xs">Masi salary — active</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(74,222,128,0.10)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.20)' }}>
                ✓ Active
              </span>
              <button onClick={startEdit}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.09)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#94a3b8'; }}
              >
                <Pencil size={12} /> Edit
              </button>
              <button onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all"
                style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.18)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.16)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
              >
                <Trash2 size={12} /> Delete
              </button>
            </div>
          </div>

          {/* stats */}
          <div className="grid grid-cols-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {[
              { icon: IndianRupee, label: 'Per Member',    value: `₹${(record.perMemberAmount||0).toFixed(2)}`, color: '#4ade80' },
              { icon: Users,       label: 'Active Members', value: record.memberCount || members.length,         color: '#60a5fa' },
              { icon: IndianRupee, label: 'Total Charged',  value: `₹${((record.perMemberAmount||0) * (record.memberCount || members.length)).toFixed(2)}`, color: '#a78bfa' },
            ].map(({ icon: Icon, label, value, color }, i) => (
              <div key={label} className="px-4 py-4 text-center"
                style={{ borderRight: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                <Icon size={14} className="mx-auto mb-2" style={{ color }} />
                <p className="font-bold text-white text-xl leading-none">{value}</p>
                <p className="text-slate-500 text-xs mt-1.5">{label}</p>
              </div>
            ))}
          </div>

          {/* member list */}
          {members.length > 0 && (
            <div className="p-4">
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest mb-3">
                {members.length} Members · Each paying
              </p>
              <div className="space-y-1.5">
                {members.map((m, i) => (
                  <div key={m._id}
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-colors"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ background: `hsl(${(i * 53 + 140) % 360},40%,28%)`, border: '1px solid rgba(255,255,255,0.10)' }}>
                        {rn(m.name)?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium leading-none">{rn(m.name)}</p>
                        <p className="text-slate-600 text-xs mt-0.5">{m.room ? `Room ${m.room}` : m.email}</p>
                      </div>
                    </div>
                    <span className="font-bold text-sm text-emerald-400">+ ₹{(record.perMemberAmount||0).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* EMPTY STATE */}
      {!isSet && !editing && (
        <div className="rounded-2xl p-10 text-center" style={glass}>
          <div className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <HandCoins size={22} className="text-slate-600" />
          </div>
          <p className="text-slate-400 text-sm font-medium">No salary set for {MONTHS_FULL[month-1]} {year}</p>
          <p className="text-slate-600 text-xs mt-1">Use the form above to set an amount for all members.</p>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-sm rounded-2xl p-6 space-y-4"
            style={{ background: 'linear-gradient(135deg,#0d1528,#0a1020)', border: '1px solid rgba(239,68,68,0.25)', boxShadow: '0 32px 80px rgba(0,0,0,0.8)' }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
                <Trash2 size={16} className="text-red-400" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Remove Masi Salary</p>
                <p className="text-slate-500 text-xs">{MONTHS_FULL[month-1]} {year}</p>
              </div>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              This will set masi salary to <span className="text-white font-semibold">₹0</span> for {MONTHS_FULL[month-1]} {year}. Members' bills will no longer include this charge.
            </p>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setConfirmDelete(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-300 transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.09)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              >Cancel</button>
              <button onClick={handleDelete} disabled={loading}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', boxShadow: '0 4px 16px rgba(239,68,68,0.28)' }}
              >{loading ? 'Removing…' : 'Remove'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
