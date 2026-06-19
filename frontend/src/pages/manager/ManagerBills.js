import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { RefreshCw } from 'lucide-react';
import api from '../../api';

const now = new Date();
const MONTH = now.getMonth() + 1;
const YEAR  = now.getFullYear();
const rn = (name) => { const m = name?.match(/^\w+\s*\((.+)\)$/); return m ? m[1] : (name || '—'); };

const glass = {
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(40px)',
  WebkitBackdropFilter: 'blur(40px)',
  border: '1px solid rgba(255,255,255,0.10)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)',
};

export default function ManagerBills() {
  const [bills,      setBills]      = useState([]);
  const [summary,    setSummary]    = useState(null);
  const [generating, setGenerating] = useState(false);

  const load = useCallback(() => {
    api.get(`/bills/${MONTH}/${YEAR}`).then(r => setBills(r.data)).catch(() => {});
    api.get(`/summary/${MONTH}/${YEAR}`).then(r => setSummary(r.data)).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  // auto-refresh every 30s so payments reflect quickly
  useEffect(() => {
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  const generateBills = async () => {
    setGenerating(true);
    try {
      await api.post(`/bills/generate/${MONTH}/${YEAR}`);
      toast.success('Bills generated');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error generating bills');
    } finally {
      setGenerating(false);
    }
  };

  const mealRate = summary?.mealRate || 0;

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3 rounded-2xl p-3 px-4" style={glass}>
        <div>
          <h1 className="text-base font-bold text-white leading-tight">Bills</h1>
          <p className="text-[10px] text-slate-500 mt-0.5">Generate &amp; view member bills</p>
        </div>
        <button
          onClick={generateBills}
          disabled={generating}
          className="flex items-center gap-1.5 text-xs font-semibold text-white px-3 py-2 rounded-xl active:scale-95 disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', WebkitTapHighlightColor: 'transparent', transition: 'transform 0.1s' }}
        >
          <RefreshCw size={13} className={generating ? 'animate-spin' : ''} />
          {generating ? 'Generating…' : 'Generate'}
        </button>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Meal Rate',   value: `₹${mealRate.toFixed(2)}`,                   color: '#34d399' },
          { label: 'Total Meals', value: summary?.totalMeals || 0,                    color: '#60a5fa' },
          { label: 'Grand Total', value: `₹${(summary?.grandTotal || 0).toFixed(2)}`, color: '#fbbf24' },
          { label: 'Members',     value: bills.length,                                color: '#a78bfa' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl p-3" style={glass}>
            <p className="text-[10px] text-slate-500 mb-1">{label}</p>
            <p className="text-base font-bold" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Bills Table ── */}
      <div className="rounded-2xl overflow-hidden" style={glass}>
        {bills.length === 0 ? (
          <div className="py-14 flex flex-col items-center gap-3">
            <span className="text-4xl">🧾</span>
            <p className="text-slate-500 text-sm">No bills yet</p>
            <p className="text-slate-600 text-xs">Tap "Generate" to calculate bills</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" style={{ fontSize: '12px', minWidth: '520px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
                  {[
                    { h: 'Member',      cls: 'text-left  pl-4' },
                    { h: 'Meals',       cls: 'text-right' },
                    { h: 'Per Meal',    cls: 'text-right' },
                    { h: 'Meal Cost',   cls: 'text-right' },
                    { h: 'Masi',        cls: 'text-right' },
                    { h: 'Advance',     cls: 'text-right' },
                    { h: 'Due / Refund',cls: 'text-right pr-4' },
                  ].map(({ h, cls }) => (
                    <th key={h} className={`py-2.5 px-2 text-slate-500 font-semibold text-[10px] uppercase tracking-wide ${cls}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bills.map((b, i) => {
                  const due    = b.dueAmount ?? 0;
                  const isDue  = due > 0;
                  const name   = rn(b.memberId?.name);
                  const masi   = b.masiSalary || 0;
                  return (
                    <tr key={b._id} style={{
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      background: i % 2 !== 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                    }}>
                      {/* Member */}
                      <td className="py-2.5 px-2 pl-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                            style={{ background: 'rgba(167,139,250,0.18)', border: '1px solid rgba(167,139,250,0.25)' }}>
                            {name?.[0]?.toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-white font-semibold truncate" style={{ maxWidth: '80px' }}>{name}</p>
                            {b.memberId?.room && <p className="text-[9px] text-slate-600">Rm {b.memberId.room}</p>}
                          </div>
                        </div>
                      </td>
                      {/* Meals */}
                      <td className="py-2.5 px-2 text-right text-white font-semibold">{b.mealCount}</td>
                      {/* Per Meal */}
                      <td className="py-2.5 px-2 text-right text-amber-400">₹{mealRate.toFixed(2)}</td>
                      {/* Meal Cost */}
                      <td className="py-2.5 px-2 text-right text-slate-200">₹{(b.totalBill || 0).toFixed(2)}</td>
                      {/* Masi */}
                      <td className="py-2.5 px-2 text-right text-slate-400">₹{masi.toFixed(2)}</td>
                      {/* Advance */}
                      <td className="py-2.5 px-2 text-right text-green-400">₹{(b.advance || 0).toFixed(2)}</td>
                      {/* Due / Refund */}
                      <td className="py-2.5 px-2 pr-4 text-right">
                        <span className="font-bold px-2 py-0.5 rounded-lg text-[11px]" style={{
                          background: isDue ? 'rgba(248,113,113,0.12)' : 'rgba(52,211,153,0.12)',
                          color: isDue ? '#f87171' : '#34d399',
                          border: isDue ? '1px solid rgba(248,113,113,0.20)' : '1px solid rgba(52,211,153,0.20)',
                        }}>
                          {isDue ? `₹${due.toFixed(2)}` : `-₹${Math.abs(due).toFixed(2)}`}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
