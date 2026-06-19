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
          { label: 'Meal Rate',    value: `₹${mealRate.toFixed(2)}`,                    color: '#34d399' },
          { label: 'Total Meals',  value: summary?.totalMeals || 0,                     color: '#60a5fa' },
          { label: 'Grand Total',  value: `₹${(summary?.grandTotal || 0).toFixed(2)}`,  color: '#fbbf24' },
          { label: 'Bills',        value: bills.length,                                 color: '#a78bfa' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl p-3" style={glass}>
            <p className="text-[10px] text-slate-500 mb-1">{label}</p>
            <p className="text-base font-bold" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Bill Cards ── */}
      {bills.length === 0 ? (
        <div className="rounded-2xl py-14 flex flex-col items-center gap-3" style={glass}>
          <span className="text-4xl">🧾</span>
          <p className="text-slate-500 text-sm">No bills yet</p>
          <p className="text-slate-600 text-xs">Tap "Generate" to calculate bills</p>
        </div>
      ) : (
        <div className="space-y-2">
          {bills.map(b => {
            const due = b.dueAmount ?? 0;
            const isDue = due > 0;
            const masiSalary = b.masiSalary || 0;
            const name = rn(b.memberId?.name);
            return (
              <div key={b._id} className="rounded-2xl overflow-hidden" style={glass}>
                {/* Member header row */}
                <div className="flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.25)' }}>
                      {name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm leading-tight">{name}</p>
                      {b.memberId?.room && <p className="text-[10px] text-slate-500">Room {b.memberId.room}</p>}
                    </div>
                  </div>
                  {/* Due / Refund badge */}
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                    style={{
                      background: isDue ? 'rgba(248,113,113,0.12)' : 'rgba(52,211,153,0.12)',
                      color: isDue ? '#f87171' : '#34d399',
                      border: isDue ? '1px solid rgba(248,113,113,0.25)' : '1px solid rgba(52,211,153,0.25)',
                    }}>
                    {isDue ? `Due ₹${due.toFixed(2)}` : `Refund ₹${Math.abs(due).toFixed(2)}`}
                  </span>
                </div>

                {/* Bill breakdown */}
                <div className="px-4 py-3 grid grid-cols-2 gap-x-4 gap-y-2">
                  <Row label="Total Meals"   value={b.mealCount}                      color="#e2e8f0" />
                  <Row label="Per Meal Rate" value={`₹${mealRate.toFixed(2)}`}        color="#fbbf24" />
                  <Row label="Meal Cost"     value={`₹${(b.totalBill || 0).toFixed(2)}`}  color="#e2e8f0" />
                  <Row label="Masi Salary"   value={`₹${masiSalary.toFixed(2)}`}      color="#e2e8f0" />
                  <Row label="Advance Paid"  value={`₹${(b.advance || 0).toFixed(2)}`} color="#34d399" />
                  <Row label="Total Due"
                    value={isDue ? `₹${due.toFixed(2)}` : `−₹${Math.abs(due).toFixed(2)}`}
                    color={isDue ? '#f87171' : '#34d399'}
                    bold
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, color, bold }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-slate-500">{label}</span>
      <span className="text-xs font-semibold" style={{ color, fontWeight: bold ? 700 : 600 }}>{value}</span>
    </div>
  );
}
