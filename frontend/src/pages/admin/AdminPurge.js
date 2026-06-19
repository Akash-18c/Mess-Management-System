import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Trash2, AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import api from '../../api';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const glass = {
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.08)',
};

const DATA_LABELS = [
  { key: 'meals',        label: 'Meal Records',      color: '#34d399' },
  { key: 'groceries',    label: 'Grocery Expenses',  color: '#f97316' },
  { key: 'otherExpenses',label: 'Other Expenses',    color: '#f59e0b' },
  { key: 'payments',     label: 'Payments',          color: '#60a5fa' },
  { key: 'bills',        label: 'Bills',             color: '#a78bfa' },
  { key: 'summary',      label: 'Monthly Summary',   color: '#2dd4bf' },
  { key: 'assignment',   label: 'Manager Assignment',color: '#fb923c' },
  { key: 'gasCylinders', label: 'Gas Cylinders',     color: '#e879f9' },
  { key: 'riceBags',     label: 'Rice Bags',         color: '#94a3b8' },
];

export default function AdminPurge() {
  const now = new Date();
  const [month,     setMonth]     = useState(now.getMonth() + 1);
  const [year,      setYear]      = useState(now.getFullYear());
  const [modal,     setModal]     = useState(false);
  const [confirm,   setConfirm]   = useState('');
  const [loading,   setLoading]   = useState(false);
  const [result,    setResult]    = useState(null);

  const selectedLabel = `${MONTHS[month - 1]} ${year}`;
  const confirmPhrase = `DELETE ${selectedLabel.toUpperCase()}`;

  const openModal = () => { setConfirm(''); setResult(null); setModal(true); };

  const handlePurge = async () => {
    if (confirm !== confirmPhrase) {
      toast.error('Confirmation text does not match');
      return;
    }
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
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
          <ShieldAlert size={20} style={{ color: '#f87171' }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Purge Month Data</h1>
          <p className="text-sm" style={{ color: '#64748b' }}>Permanently delete all calculations for a selected month — members are never affected</p>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="rounded-2xl p-4 flex items-start gap-3"
        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
        <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" style={{ color: '#f87171' }} />
        <div className="text-sm space-y-1">
          <p className="font-semibold" style={{ color: '#fca5a5' }}>This action is irreversible</p>
          <p style={{ color: '#94a3b8' }}>
            Deletes: meals, groceries, other expenses, payments, bills, monthly summary, manager assignment, gas cylinders, rice bags for the chosen month.
            Member accounts and expense categories are <span className="text-white font-medium">never deleted</span>.
          </p>
        </div>
      </div>

      {/* What gets deleted list */}
      <div className="rounded-2xl p-5" style={glass}>
        <p className="text-sm font-semibold text-white mb-4">Data that will be deleted</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {DATA_LABELS.map(({ label, color }) => (
            <div key={label} className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
              <span style={{ color: '#94a3b8' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Month selector + action */}
      <div className="rounded-2xl p-5" style={glass}>
        <p className="text-sm font-semibold text-white mb-4">Select Month to Purge</p>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="label">Month</label>
            <select className="input w-44" value={month} onChange={e => { setMonth(+e.target.value); setResult(null); }}>
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Year</label>
            <input className="input w-28" type="number" value={year} min="2020" max="2035"
              onChange={e => { setYear(+e.target.value); setResult(null); }} />
          </div>
          <button onClick={openModal}
            className="flex items-center gap-2 px-5 py-2 rounded-xl font-semibold text-sm transition-all"
            style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff', boxShadow: '0 4px 20px rgba(239,68,68,0.30)' }}>
            <Trash2 size={16} /> Purge {selectedLabel}
          </button>
        </div>
      </div>

      {/* Result summary after purge */}
      {result && (
        <div className="rounded-2xl p-5" style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.25)' }}>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 size={18} style={{ color: '#34d399' }} />
            <p className="font-semibold text-white">Purge Complete</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {DATA_LABELS.map(({ key, label, color }) => (
              <div key={key} className="rounded-xl px-3 py-2 flex items-center justify-between"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <span className="text-xs" style={{ color: '#64748b' }}>{label}</span>
                <span className="text-sm font-bold" style={{ color }}>{result[key] ?? 0}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(10px)' }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden"
            style={{ background: 'linear-gradient(135deg,#120a0a 0%,#0a0f1e 100%)', border: '1px solid rgba(239,68,68,0.30)', boxShadow: '0 32px 80px rgba(0,0,0,0.9)' }}>

            {/* Modal Header */}
            <div className="p-5 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(239,68,68,0.20)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
                <AlertTriangle size={18} style={{ color: '#f87171' }} />
              </div>
              <div>
                <p className="font-bold text-white">Confirm Purge</p>
                <p className="text-xs" style={{ color: '#f87171' }}>{selectedLabel} · All data will be permanently lost</p>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-sm" style={{ color: '#94a3b8' }}>
                Type <span className="font-mono font-bold text-white">{confirmPhrase}</span> to confirm:
              </p>
              <input
                className="input font-mono"
                placeholder={confirmPhrase}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                autoFocus
              />
              <div className="flex gap-3 pt-1">
                <button onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button
                  onClick={handlePurge}
                  disabled={loading || confirm !== confirmPhrase}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff' }}>
                  <Trash2 size={15} />
                  {loading ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
