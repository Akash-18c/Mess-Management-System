import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Trash2, AlertTriangle, ShieldAlert, CheckCircle2, Database, ChevronDown, Flame } from 'lucide-react';
import api from '../../api';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const DATA_ITEMS = [
  { key: 'meals',         label: 'Meal Records',       color: '#34d399', bg: 'rgba(52,211,153,0.10)'  },
  { key: 'groceries',     label: 'Grocery Expenses',   color: '#f97316', bg: 'rgba(249,115,22,0.10)'  },
  { key: 'otherExpenses', label: 'Other Expenses',     color: '#f59e0b', bg: 'rgba(245,158,11,0.10)'  },
  { key: 'otherCharges',  label: 'Other Charges',      color: '#f472b6', bg: 'rgba(244,114,182,0.10)' },
  { key: 'payments',      label: 'Payments',           color: '#60a5fa', bg: 'rgba(96,165,250,0.10)'  },
  { key: 'bills',         label: 'Bills',              color: '#a78bfa', bg: 'rgba(167,139,250,0.10)' },
  { key: 'masiSalary',    label: 'Masi Salary',        color: '#e879f9', bg: 'rgba(232,121,249,0.10)' },
  { key: 'summary',       label: 'Monthly Summary',    color: '#2dd4bf', bg: 'rgba(45,212,191,0.10)'  },
  { key: 'assignment',    label: 'Manager Assignment', color: '#fb923c', bg: 'rgba(251,146,60,0.10)'  },
  { key: 'gasCylinders',  label: 'Gas Cylinders',      color: '#94a3b8', bg: 'rgba(148,163,184,0.10)' },
  { key: 'riceBags',      label: 'Rice Bags',          color: '#fbbf24', bg: 'rgba(251,191,36,0.10)'  },
];

const glass = {
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(40px)',
  WebkitBackdropFilter: 'blur(40px)',
  border: '1px solid rgba(255,255,255,0.09)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07)',
};

const redGlass = {
  background: 'rgba(239,68,68,0.06)',
  backdropFilter: 'blur(40px)',
  WebkitBackdropFilter: 'blur(40px)',
  border: '1px solid rgba(239,68,68,0.18)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
};

function Dropdown({ value, onChange, options, label }) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);
  return (
    <div>
      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">{label}</label>
      <div style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="w-full flex items-center justify-between text-sm font-semibold text-white"
          style={{ ...glass, borderRadius: '14px', padding: '11px 14px', outline: 'none' }}
        >
          <span>{selected?.label}</span>
          <ChevronDown size={14} className="text-slate-400" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>
        {open && (
          <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 50, background: 'rgba(6,10,22,0.98)', border: '1px solid rgba(239,68,68,0.20)', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.8)', backdropFilter: 'blur(48px)', WebkitBackdropFilter: 'blur(48px)' }}>
            <div style={{ maxHeight: '220px', overflowY: 'auto', scrollbarWidth: 'thin' }}>
              {options.map(o => (
                <button key={o.value} type="button"
                  onClick={() => { onChange(o.value); setOpen(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm"
                  style={{ color: value === o.value ? '#f87171' : '#94a3b8', background: value === o.value ? 'rgba(239,68,68,0.10)' : 'transparent', borderLeft: value === o.value ? '2px solid #ef4444' : '2px solid transparent', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ConfirmModal({ open, onClose, title, subtitle, phrase, onConfirm, loading }) {
  const [val, setVal] = useState('');
  const match = val.trim() === phrase;
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full sm:max-w-md rounded-t-[28px] sm:rounded-[24px] overflow-hidden"
        style={{ background: 'linear-gradient(160deg,rgba(20,8,8,0.98) 0%,rgba(8,12,28,0.98) 100%)', border: '1px solid rgba(239,68,68,0.22)', boxShadow: '0 -8px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(239,68,68,0.08)' }}>

        {/* drag handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
        </div>

        {/* top shimmer */}
        <div className="h-px w-full" style={{ background: 'linear-gradient(90deg,transparent,rgba(239,68,68,0.5),transparent)' }} />

        <div className="px-5 pt-5 pb-4 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(239,68,68,0.10)' }}>
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.30)', boxShadow: '0 0 20px rgba(239,68,68,0.15)' }}>
            <Flame size={18} className="text-red-400" />
          </div>
          <div>
            <p className="font-bold text-white text-base">{title}</p>
            <p className="text-xs text-red-400 mt-0.5">{subtitle}</p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-slate-400 leading-relaxed">Type this phrase exactly to confirm:</p>
          <div className="rounded-2xl px-4 py-3 text-center"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px dashed rgba(239,68,68,0.35)' }}>
            <span className="font-mono font-bold text-sm text-red-300 tracking-wide select-all">{phrase}</span>
          </div>
          <input
            className="input font-mono text-sm w-full"
            placeholder={phrase}
            value={val}
            onChange={e => setVal(e.target.value)}
            autoFocus
            style={{ borderColor: val.length > 0 ? (match ? 'rgba(52,211,153,0.5)' : 'rgba(239,68,68,0.4)') : undefined, borderRadius: '14px' }}
          />
          {val.length > 0 && (
            <p className="text-xs font-semibold flex items-center gap-1.5" style={{ color: match ? '#34d399' : '#f87171' }}>
              {match ? <><CheckCircle2 size={12} /> Phrase matches — ready</> : <><AlertTriangle size={12} /> Does not match</>}
            </p>
          )}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose}
              className="flex-1 py-3 rounded-2xl text-sm font-semibold text-slate-300 transition-all hover:text-white"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}>
              Cancel
            </button>
            <button onClick={() => { onConfirm(); setVal(''); }} disabled={loading || !match}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm text-white disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: match ? 'linear-gradient(135deg,#dc2626,#ef4444)' : 'rgba(239,68,68,0.3)', border: '1px solid rgba(239,68,68,0.35)', boxShadow: match ? '0 4px 20px rgba(239,68,68,0.30)' : 'none', transition: 'all 0.2s' }}>
              <Trash2 size={14} />
              {loading ? 'Deleting…' : 'Delete Forever'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminPurge() {
  const now = new Date();
  const [month,   setMonth]   = useState(now.getMonth() + 1);
  const [year,    setYear]    = useState(now.getFullYear());
  const [modal,   setModal]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null);

  const [allModal,   setAllModal]   = useState(false);
  const [allLoading, setAllLoading] = useState(false);
  const [allResult,  setAllResult]  = useState(null);

  const selectedLabel = `${MONTHS[month - 1]} ${year}`;
  const confirmPhrase = `DELETE ${selectedLabel.toUpperCase()}`;
  const ALL_PHRASE    = 'DELETE ALL MEMBERS';

  const handlePurge = async () => {
    setLoading(true);
    try {
      const { data } = await api.delete(`/admin/purge-month/${month}/${year}`);
      setResult(data.deleted);
      toast.success(data.message);
      setModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Purge failed');
    } finally { setLoading(false); }
  };

  const handlePurgeAll = async () => {
    setAllLoading(true);
    try {
      const { data } = await api.delete('/admin/purge-all-members');
      setAllResult(data.deleted);
      toast.success(data.message);
      setAllModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Purge failed');
    } finally { setAllLoading(false); }
  };

  const monthOptions = MONTHS.map((m, i) => ({ value: i + 1, label: m }));
  const yearOptions  = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(y => ({ value: y, label: String(y) }));

  return (
    <div className="space-y-4 max-w-2xl relative">

      {/* ambient glow */}
      <div aria-hidden="true" style={{ pointerEvents: 'none', position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '10%', right: '5%', width: '40vw', height: '40vw', maxWidth: 400, maxHeight: 400, background: 'radial-gradient(circle,rgba(239,68,68,0.07) 0%,transparent 70%)', borderRadius: '50%', filter: 'blur(60px)' }} />
      </div>

      {/* ── Header ── */}
      <div className="relative rounded-2xl p-4 px-5 flex items-center gap-4" style={redGlass}>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.30)', boxShadow: '0 0 24px rgba(239,68,68,0.15)' }}>
          <ShieldAlert size={22} className="text-red-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Purge Data</h1>
          <p className="text-slate-500 text-xs mt-0.5">Permanently wipe records — irreversible action</p>
        </div>
        {/* top shimmer */}
        <div className="absolute top-0 left-8 right-8 h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(239,68,68,0.4),transparent)' }} />
      </div>

      {/* ── Warning ── */}
      <div className="rounded-2xl p-4 flex gap-3 items-start"
        style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <AlertTriangle size={15} className="text-red-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-red-300">This action cannot be undone</p>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            All records for the chosen month will be permanently wiped.{' '}
            <span className="text-emerald-400 font-semibold">Member accounts are never deleted.</span>
          </p>
        </div>
      </div>

      {/* ── What gets deleted ── */}
      <div className="rounded-2xl p-4 sm:p-5" style={glass}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: 'rgba(148,163,184,0.10)', border: '1px solid rgba(148,163,184,0.15)' }}>
            <Database size={13} className="text-slate-400" />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Records that will be erased</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {DATA_ITEMS.map(({ label, color, bg }) => (
            <div key={label} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
              style={{ background: bg, border: `1px solid ${color}22` }}>
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
              <span className="text-xs font-medium text-slate-300 truncate">{label}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 px-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" style={{ boxShadow: '0 0 6px #34d399' }} />
          <p className="text-xs text-slate-600">Member accounts &amp; profiles are always kept safe</p>
        </div>
      </div>

      {/* ── Month Purge ── */}
      <div className="rounded-2xl p-4 sm:p-5 space-y-4" style={glass}>
        <p className="text-sm font-bold text-white">Purge by Month</p>
        <div className="grid grid-cols-2 gap-3" style={{ position: 'relative', zIndex: 20 }}>
          <Dropdown label="Month" value={month} onChange={v => { setMonth(v); setResult(null); }} options={monthOptions} />
          <Dropdown label="Year"  value={year}  onChange={v => { setYear(v);  setResult(null); }} options={yearOptions}  />
        </div>
        <div className="rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)' }}>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Selected for purge</p>
            <p className="text-lg font-bold text-red-300 mt-0.5">{selectedLabel}</p>
          </div>
          <button onClick={() => setModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm text-white w-full sm:w-auto"
            style={{ background: 'linear-gradient(135deg,#dc2626,#ef4444)', border: '1px solid rgba(239,68,68,0.35)', boxShadow: '0 4px 20px rgba(239,68,68,0.25)', WebkitTapHighlightColor: 'transparent' }}>
            <Trash2 size={15} /> Purge {selectedLabel}
          </button>
        </div>

        {/* Month purge result */}
        {result && (
          <div className="rounded-2xl p-4" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.20)' }}>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <p className="text-sm font-bold text-emerald-400">Purge Complete</p>
              <span className="text-xs text-slate-500">— {selectedLabel}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DATA_ITEMS.map(({ key, label, color, bg }) => (
                <div key={key} className="rounded-xl px-3 py-2.5 flex items-center justify-between gap-2"
                  style={{ background: bg, border: `1px solid ${color}22` }}>
                  <span className="text-xs text-slate-400 truncate">{label}</span>
                  <span className="text-sm font-bold flex-shrink-0" style={{ color }}>{result[key] ?? 0}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Purge All Members ── */}
      <div className="rounded-2xl p-4 sm:p-5 space-y-4"
        style={{ background: 'rgba(127,29,29,0.12)', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', border: '1px solid rgba(239,68,68,0.22)', boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(239,68,68,0.18)', border: '1px solid rgba(239,68,68,0.30)', boxShadow: '0 0 20px rgba(239,68,68,0.12)' }}>
            <Flame size={16} className="text-red-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Purge All Members</p>
            <p className="text-[10px] text-red-400 mt-0.5">Nuclear option — wipes everything</p>
          </div>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Deletes <span className="text-white font-semibold">all members</span> and every record across all months.
          Only the <span className="text-emerald-400 font-semibold">admin account</span> is preserved.
        </p>
        <button onClick={() => { setAllResult(null); setAllModal(true); }}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl font-bold text-sm text-white"
          style={{ background: 'linear-gradient(135deg,#7f1d1d,#dc2626,#ef4444)', border: '1px solid rgba(239,68,68,0.35)', boxShadow: '0 4px 24px rgba(239,68,68,0.20)', WebkitTapHighlightColor: 'transparent' }}>
          <Trash2 size={15} /> Delete All Members &amp; Data
        </button>

        {allResult && (
          <div className="rounded-2xl p-4" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.20)' }}>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <p className="text-sm font-bold text-emerald-400">All Data Purged</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(allResult).map(([k, v]) => (
                <div key={k} className="rounded-xl px-3 py-2.5 flex items-center justify-between gap-2"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <span className="text-xs text-slate-400 truncate capitalize">{k}</span>
                  <span className="text-sm font-bold text-emerald-400">{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      <ConfirmModal
        open={modal}
        onClose={() => setModal(false)}
        title="Confirm Month Purge"
        subtitle={`${selectedLabel} · Cannot be undone`}
        phrase={confirmPhrase}
        onConfirm={handlePurge}
        loading={loading}
      />
      <ConfirmModal
        open={allModal}
        onClose={() => setAllModal(false)}
        title="Delete All Members & Data"
        subtitle="Admin account will be preserved"
        phrase={ALL_PHRASE}
        onConfirm={handlePurgeAll}
        loading={allLoading}
      />
    </div>
  );
}
