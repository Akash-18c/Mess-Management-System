import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Trash2, AlertTriangle, ShieldAlert, CheckCircle2, Database, ChevronDown } from 'lucide-react';
import api from '../../api';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const DATA_ITEMS = [
  { key: 'meals',         label: 'Meal Records',       color: '#34d399' },
  { key: 'groceries',     label: 'Grocery Expenses',   color: '#f97316' },
  { key: 'otherExpenses', label: 'Other Expenses',     color: '#f59e0b' },
  { key: 'otherCharges',  label: 'Other Charges',      color: '#f472b6' },
  { key: 'payments',      label: 'Payments',           color: '#60a5fa' },
  { key: 'bills',         label: 'Bills',              color: '#a78bfa' },
  { key: 'masiSalary',    label: 'Masi Salary',        color: '#e879f9' },
  { key: 'summary',       label: 'Monthly Summary',    color: '#2dd4bf' },
  { key: 'assignment',    label: 'Manager Assignment', color: '#fb923c' },
  { key: 'gasCylinders',  label: 'Gas Cylinders',      color: '#94a3b8' },
  { key: 'riceBags',      label: 'Rice Bags',          color: '#fbbf24' },
];

const glass = {
  background: 'rgba(255,255,255,0.03)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.08)',
};

function Dropdown({ value, onChange, options, label }) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);
  return (
    <div>
      <label className="text-xs text-slate-400 mb-1.5 block">{label}</label>
      <div style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="w-full flex items-center justify-between text-sm font-medium text-white"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '12px', padding: '10px 14px', outline: 'none' }}
        >
          <span>{selected?.label}</span>
          <ChevronDown size={14} className="text-slate-400" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>
        {open && (
          <div
            style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 50, background: 'rgba(10,15,30,0.98)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 16px 40px rgba(0,0,0,0.7)' }}
          >
            <div style={{ maxHeight: '220px', overflowY: 'auto', scrollbarWidth: 'thin' }}>
              {options.map(o => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => { onChange(o.value); setOpen(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm transition-colors"
                  style={{ color: value === o.value ? '#f87171' : '#94a3b8', background: value === o.value ? 'rgba(239,68,68,0.08)' : 'transparent', borderLeft: value === o.value ? '2px solid #ef4444' : '2px solid transparent' }}
                  onMouseEnter={e => { if (value !== o.value) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                  onMouseLeave={e => { if (value !== o.value) e.currentTarget.style.background = 'transparent'; }}
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

export default function AdminPurge() {
  const now = new Date();
  const [month,   setMonth]   = useState(now.getMonth() + 1);
  const [year,    setYear]    = useState(now.getFullYear());
  const [modal,   setModal]   = useState(false);
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null);

  const selectedLabel = `${MONTHS[month - 1]} ${year}`;
  const confirmPhrase = `DELETE ${selectedLabel.toUpperCase()}`;
  const isMatch       = confirm.trim() === confirmPhrase;

  const openModal = () => { setConfirm(''); setModal(true); };

  const handlePurge = async () => {
    if (!isMatch) return toast.error('Confirmation text does not match');
    setLoading(true);
    try {
      const { data } = await api.delete(`/admin/purge-month/${month}/${year}`);
      setResult(data.deleted);
      toast.success(data.message);
      setModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Purge failed');
    } finally {
      setLoading(false);
    }
  };

  const monthOptions = MONTHS.map((m, i) => ({ value: i + 1, label: m }));
  const yearOptions  = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(y => ({ value: y, label: String(y) }));

  return (
    <div className="space-y-4 sm:space-y-5 max-w-2xl">

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <ShieldAlert size={18} className="text-red-400" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Purge Data</h1>
          <p className="text-slate-500 text-xs sm:text-sm">Permanently delete all records for a selected month</p>
        </div>
      </div>

      {/* ── Warning Banner ── */}
      <div className="rounded-2xl p-4 flex gap-3"
        style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.20)' }}>
        <AlertTriangle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-red-300">This action is permanent and cannot be undone</p>
          <p className="text-xs text-slate-400 leading-relaxed">
            All records for the chosen month will be wiped from the database.{' '}
            <span className="text-white font-medium">Member accounts are never deleted.</span>
          </p>
        </div>
      </div>

      {/* ── What gets deleted ── */}
      <div className="rounded-2xl p-4 sm:p-5" style={glass}>
        <div className="flex items-center gap-2 mb-3">
          <Database size={14} className="text-slate-500" />
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Records that will be erased</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {DATA_ITEMS.map(({ label, color }) => (
            <div key={label} className="flex items-center gap-2 rounded-xl px-3 py-2"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
              <span className="text-xs text-slate-300 truncate">{label}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-600 mt-3 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
          Member accounts &amp; profiles are kept safe
        </p>
      </div>

      {/* ── Month Selector ── */}
      <div className="rounded-2xl p-4 sm:p-5 space-y-4" style={glass}>
        <p className="text-sm font-semibold text-white">Select Month to Purge</p>

        <div className="grid grid-cols-2 gap-3" style={{ position: 'relative', zIndex: 20 }}>
          <Dropdown
            label="Month"
            value={month}
            onChange={v => { setMonth(v); setResult(null); }}
            options={monthOptions}
          />
          <Dropdown
            label="Year"
            value={year}
            onChange={v => { setYear(v); setResult(null); }}
            options={yearOptions}
          />
        </div>

        {/* Selected preview + action */}
        <div className="rounded-xl px-4 py-3 flex items-center justify-between gap-3"
          style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)' }}>
          <div>
            <p className="text-xs text-slate-500">Selected for purge</p>
            <p className="text-base font-bold text-red-300 mt-0.5">{selectedLabel}</p>
          </div>
          <button
            onClick={openModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white flex-shrink-0 transition-opacity hover:opacity-80"
            style={{ background: 'linear-gradient(135deg,#ef4444,#b91c1c)', border: '1px solid rgba(239,68,68,0.3)' }}
          >
            <Trash2 size={14} />
            Purge {selectedLabel}
          </button>
        </div>
      </div>

      {/* ── Result ── */}
      {result && (
        <div className="rounded-2xl p-4 sm:p-5"
          style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.20)' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)' }}>
              <CheckCircle2 size={15} className="text-emerald-400" />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">Purge Complete</p>
              <p className="text-xs text-slate-500">Records deleted from {selectedLabel}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {DATA_ITEMS.map(({ key, label, color }) => (
              <div key={key} className="rounded-xl px-3 py-2.5 flex items-center justify-between gap-2"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <span className="text-xs text-slate-400 truncate">{label}</span>
                <span className="text-sm font-bold flex-shrink-0" style={{ color }}>{result[key] ?? 0}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Confirm Modal ── */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(10px)' }}
          onClick={e => e.target === e.currentTarget && setModal(false)}
        >
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden"
            style={{ background: 'linear-gradient(160deg,#130a0a 0%,#0a0f1e 100%)', border: '1px solid rgba(239,68,68,0.25)', boxShadow: '0 -4px 40px rgba(0,0,0,0.7)' }}>

            {/* drag handle */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.12)' }} />
            </div>

            {/* Modal header */}
            <div className="px-5 pt-4 pb-4 flex items-start gap-3"
              style={{ borderBottom: '1px solid rgba(239,68,68,0.12)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
                <AlertTriangle size={16} className="text-red-400" />
              </div>
              <div>
                <p className="font-bold text-white">Confirm Permanent Purge</p>
                <p className="text-xs text-red-400 mt-0.5">{selectedLabel} · Cannot be undone</p>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-sm text-slate-400 leading-relaxed">
                Type the phrase below exactly to confirm deletion of all data for{' '}
                <span className="text-white font-semibold">{selectedLabel}</span>:
              </p>

              {/* Phrase to type */}
              <div className="rounded-xl px-4 py-3 text-center"
                style={{ background: 'rgba(239,68,68,0.07)', border: '1px dashed rgba(239,68,68,0.30)' }}>
                <span className="font-mono font-bold text-sm text-red-300 tracking-wide select-all">
                  {confirmPhrase}
                </span>
              </div>

              <input
                className="input font-mono text-sm w-full"
                placeholder={confirmPhrase}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                autoFocus
                style={{ borderColor: confirm.length > 0 ? (isMatch ? 'rgba(52,211,153,0.5)' : 'rgba(239,68,68,0.4)') : undefined }}
              />

              {confirm.length > 0 && (
                <p className="text-xs font-medium flex items-center gap-1.5"
                  style={{ color: isMatch ? '#34d399' : '#f87171' }}>
                  {isMatch
                    ? <><CheckCircle2 size={12} /> Phrase matches — ready to delete</>
                    : <><AlertTriangle size={12} /> Phrase does not match</>}
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-300 transition-colors"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.09)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                >
                  Cancel
                </button>
                <button
                  onClick={handlePurge}
                  disabled={loading || !isMatch}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm text-white transition-opacity disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-80"
                  style={{ background: 'linear-gradient(135deg,#ef4444,#b91c1c)', border: '1px solid rgba(239,68,68,0.3)' }}
                >
                  <Trash2 size={14} />
                  {loading ? 'Deleting…' : 'Delete Forever'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
