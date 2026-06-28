import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Trash2, AlertTriangle, ShieldAlert, CheckCircle2, Database } from 'lucide-react';
import api from '../../api';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const DATA_LABELS = [
  { key: 'meals',         label: 'Meal Records',       color: '#34d399', bg: 'rgba(52,211,153,0.10)'  },
  { key: 'groceries',     label: 'Grocery Expenses',   color: '#f97316', bg: 'rgba(249,115,22,0.10)'  },
  { key: 'otherExpenses', label: 'Other Expenses',     color: '#f59e0b', bg: 'rgba(245,158,11,0.10)'  },
  { key: 'otherCharges',  label: 'Other Charges',      color: '#f472b6', bg: 'rgba(244,114,182,0.10)' },
  { key: 'payments',      label: 'Payments',           color: '#60a5fa', bg: 'rgba(96,165,250,0.10)'  },
  { key: 'bills',         label: 'Bills',              color: '#a78bfa', bg: 'rgba(167,139,250,0.10)' },
  { key: 'summary',       label: 'Monthly Summary',    color: '#2dd4bf', bg: 'rgba(45,212,191,0.10)'  },
  { key: 'assignment',    label: 'Manager Assignment', color: '#fb923c', bg: 'rgba(251,146,60,0.10)'  },
  { key: 'gasCylinders',  label: 'Gas Cylinders',      color: '#e879f9', bg: 'rgba(232,121,249,0.10)' },
  { key: 'riceBags',      label: 'Rice Bags',          color: '#94a3b8', bg: 'rgba(148,163,184,0.10)' },
];

export default function AdminPurge() {
  const now = new Date();
  const [month,   setMonth]   = useState(now.getMonth() + 1);
  const [year,    setYear]    = useState(now.getFullYear());
  const [modal,   setModal]   = useState(false);
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null);

  const selectedLabel  = `${MONTHS[month - 1]} ${year}`;
  const confirmPhrase  = `DELETE ${selectedLabel.toUpperCase()}`;
  const isMatch        = confirm === confirmPhrase;

  const openModal = () => { setConfirm(''); setResult(null); setModal(true); };

  const handlePurge = async () => {
    if (!isMatch) { toast.error('Confirmation text does not match'); return; }
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

  return (
    <div className="space-y-5 max-w-3xl mx-auto">

      {/* ── Page Header ── */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,rgba(239,68,68,0.20),rgba(220,38,38,0.10))', border: '1px solid rgba(239,68,68,0.35)', boxShadow: '0 0 24px rgba(239,68,68,0.15)' }}>
          <ShieldAlert size={22} style={{ color: '#f87171' }} />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight">Purge Month Data</h1>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: '#64748b' }}>
            Permanently delete all records for a selected month
          </p>
        </div>
      </div>

      {/* ── Danger Banner ── */}
      <div className="rounded-2xl p-4 flex gap-3"
        style={{ background: 'linear-gradient(135deg,rgba(239,68,68,0.08),rgba(185,28,28,0.06))', border: '1px solid rgba(239,68,68,0.25)' }}>
        <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" style={{ color: '#f87171' }} />
        <div className="space-y-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: '#fca5a5' }}>This action is permanent and cannot be undone</p>
          <p className="text-xs leading-relaxed" style={{ color: '#94a3b8' }}>
            All meal, expense, payment, bill, and assignment data for the chosen month will be wiped.{' '}
            <span className="text-white font-medium">Member accounts and expense categories are never deleted.</span>
          </p>
        </div>
      </div>

      {/* ── Data Scope Card ── */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Database size={15} style={{ color: '#64748b' }} />
          <p className="text-sm font-semibold text-white">Records that will be erased</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {DATA_LABELS.map(({ label, color, bg }) => (
            <div key={label} className="flex items-center gap-2 rounded-xl px-3 py-2"
              style={{ background: bg, border: `1px solid ${color}22` }}>
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
              <span className="text-xs font-medium truncate" style={{ color: '#cbd5e1' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Month Selector ── */}
      <div className="card space-y-4">
        <p className="text-sm font-semibold text-white">Select Month to Purge</p>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="label">Month</label>
            <select className="input" value={month} onChange={e => { setMonth(+e.target.value); setResult(null); }}>
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div className="sm:w-32">
            <label className="label">Year</label>
            <input className="input" type="number" value={year} min="2020" max="2035"
              onChange={e => { setYear(+e.target.value); setResult(null); }} />
          </div>
        </div>

        {/* Selected preview */}
        <div className="rounded-xl px-4 py-3 flex items-center justify-between gap-2"
          style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)' }}>
          <div>
            <p className="text-xs" style={{ color: '#64748b' }}>Selected for purge</p>
            <p className="text-base font-bold" style={{ color: '#fca5a5' }}>{selectedLabel}</p>
          </div>
          <button onClick={openModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-95 flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff', boxShadow: '0 4px 20px rgba(239,68,68,0.35)' }}>
            <Trash2 size={15} />
            <span className="hidden xs:inline">Purge</span>
            <span className="xs:hidden">Purge</span> {selectedLabel}
          </button>
        </div>
      </div>

      {/* ── Result Summary ── */}
      {result && (
        <div className="card"
          style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.25)' }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)' }}>
              <CheckCircle2 size={16} style={{ color: '#34d399' }} />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">Purge Complete</p>
              <p className="text-xs" style={{ color: '#64748b' }}>Records deleted from {selectedLabel}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {DATA_LABELS.map(({ key, label, color, bg }) => (
              <div key={key} className="rounded-xl px-3 py-2.5 flex items-center justify-between gap-2"
                style={{ background: bg, border: `1px solid ${color}22` }}>
                <span className="text-xs truncate" style={{ color: '#94a3b8' }}>{label}</span>
                <span className="text-sm font-bold flex-shrink-0" style={{ color }}>{result[key] ?? 0}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Confirm Modal ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
          onClick={e => e.target === e.currentTarget && setModal(false)}>

          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden"
            style={{ background: 'linear-gradient(160deg,#13080d 0%,#0a0f1e 100%)', border: '1px solid rgba(239,68,68,0.30)', boxShadow: '0 -8px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(239,68,68,0.1)' }}>

            {/* drag handle on mobile */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
            </div>

            {/* Modal header */}
            <div className="px-5 pt-4 pb-4 sm:pt-5 flex items-start gap-3"
              style={{ borderBottom: '1px solid rgba(239,68,68,0.15)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)' }}>
                <AlertTriangle size={18} style={{ color: '#f87171' }} />
              </div>
              <div>
                <p className="font-bold text-white">Confirm Permanent Purge</p>
                <p className="text-xs mt-0.5" style={{ color: '#f87171' }}>
                  {selectedLabel} · All data will be lost forever
                </p>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>
                This will permanently delete ALL records for{' '}
                <span className="font-semibold text-white">{selectedLabel}</span>.
                To proceed, type the phrase below exactly:
              </p>

              {/* phrase chip */}
              <div className="rounded-xl px-3 py-2 text-center"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px dashed rgba(239,68,68,0.35)' }}>
                <span className="font-mono font-bold text-sm" style={{ color: '#fca5a5', letterSpacing: '0.03em' }}>
                  {confirmPhrase}
                </span>
              </div>

              <input
                className="input font-mono text-sm"
                placeholder={confirmPhrase}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                autoFocus
                style={{ borderColor: confirm.length > 0 ? (isMatch ? 'rgba(52,211,153,0.5)' : 'rgba(239,68,68,0.4)') : undefined }}
              />

              {/* match indicator */}
              {confirm.length > 0 && (
                <p className="text-xs font-medium flex items-center gap-1.5"
                  style={{ color: isMatch ? '#34d399' : '#f87171' }}>
                  {isMatch
                    ? <><CheckCircle2 size={12} /> Phrase matches — ready to delete</>
                    : <><AlertTriangle size={12} /> Phrase does not match</>}
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button onClick={() => setModal(false)} className="btn-secondary flex-1 text-sm">
                  Cancel
                </button>
                <button onClick={handlePurge}
                  disabled={loading || !isMatch}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-95"
                  style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff', boxShadow: isMatch ? '0 4px 20px rgba(239,68,68,0.35)' : 'none' }}>
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
