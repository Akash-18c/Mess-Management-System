import React, { useEffect, useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { RefreshCw, ChevronDown, Calendar, Check, Download } from 'lucide-react';
import api from '../../api';
import useActivePeriod from '../../hooks/useActivePeriod';
import { downloadBillsPdf } from '../../utils/downloadBillsPdf';

const now = new Date();
const CUR_MONTH = now.getMonth() + 1;
const CUR_YEAR  = now.getFullYear();
const MONTHS_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const rn = (name) => { const m = name?.match(/^\w+\s*\((.+)\)$/); return m ? m[1] : (name || '—'); };

const glass = {
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(40px)',
  WebkitBackdropFilter: 'blur(40px)',
  border: '1px solid rgba(255,255,255,0.10)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)',
};

// build last 12 months + current
function buildMonthOptions() {
  const opts = [];
  for (let i = 12; i >= 0; i--) {
    let m = CUR_MONTH - i, y = CUR_YEAR;
    while (m <= 0) { m += 12; y--; }
    opts.push({ month: m, year: y });
  }
  return opts;
}

export default function ManagerBills() {
  const { period } = useActivePeriod();
  const activePeriodMonth = period?.month || CUR_MONTH;
  const activePeriodYear  = period?.year  || CUR_YEAR;
  const rangeStart = period?.startDate || null;
  const rangeEnd   = period?.endDate   || null;

  const [month,      setMonth]      = useState(CUR_MONTH);
  const [year,       setYear]       = useState(CUR_YEAR);
  const [bills,      setBills]      = useState([]);
  const [summary,    setSummary]    = useState(null);
  const [managerName, setManagerName] = useState('');
  const [generating, setGenerating] = useState(false);
  const [pdfBusy,    setPdfBusy]    = useState(false);
  const [dropOpen,   setDropOpen]   = useState(false);
  const dropRef = useRef(null);

  // Sync to active period when it loads
  useEffect(() => {
    if (period) { setMonth(period.month); setYear(period.year); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period?.month, period?.year]);

  // Month options: active period month + past 12 (for history)
  const monthOpts = buildMonthOptions();
  const selectedLabel = `${MONTHS_FULL[month - 1]} ${year}`;
  const isCurrent = month === activePeriodMonth && year === activePeriodYear;
  const isActivePeriod = month === activePeriodMonth && year === activePeriodYear;

  // close on outside click/touch
  useEffect(() => {
    const h = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false); };
    document.addEventListener('mousedown', h);
    document.addEventListener('touchstart', h);
    return () => { document.removeEventListener('mousedown', h); document.removeEventListener('touchstart', h); };
  }, []);

  const load = useCallback(() => {
    api.get(`/bills/${month}/${year}`).then(r => setBills(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    api.get(`/summary/${month}/${year}`).then(r => setSummary(r.data)).catch(() => {});
    // fetch manager name for this month
    api.get('/admin/assignments').then(r => {
      const a = r.data.find(a => a.month === month && a.year === year);
      setManagerName(a?.managerId?.name ? a.managerId.name.replace(/^\w+\s*\((.+)\)$/, '$1') : '');
    }).catch(() => {});
  }, [month, year]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!isCurrent) return;
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load, isCurrent]);

  const generateBills = async () => {
    setGenerating(true);
    try {
      await api.post(`/bills/generate/${month}/${year}`);
      toast.success('Bills generated');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error generating bills');
    } finally {
      setGenerating(false);
    }
  };

  const handlePdf = async () => {
    if (pdfBusy || !bills.length) return;
    setPdfBusy(true);
    try {
      await downloadBillsPdf({ bills, summary, month, year, managerName, rangeStart, rangeEnd });
    } catch { toast.error('PDF failed'); }
    finally { setPdfBusy(false); }
  };

  const mealRate = summary?.mealRate || 0;

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-2 rounded-2xl p-3 px-4" style={glass}>
        <div>
          <h1 className="text-base font-bold text-white leading-tight">Bills</h1>
          <p className="text-[10px] text-slate-500 mt-0.5">Generate &amp; view member bills</p>
          {(rangeStart || rangeEnd) && (
            <p className="text-[10px] text-teal-400 font-semibold mt-0.5">
              {rangeStart ? new Date(rangeStart+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short'}) : '?'}
              {' → '}
              {rangeEnd ? new Date(rangeEnd+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short'}) : '?'}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={handlePdf} disabled={pdfBusy || !bills.length}
            className="flex items-center gap-1.5 text-xs font-semibold text-white px-3 py-2 rounded-xl active:scale-95 disabled:opacity-40"
            style={{ background:'rgba(52,211,153,0.15)', border:'1px solid rgba(52,211,153,0.30)', WebkitTapHighlightColor:'transparent' }}>
            <Download size={13} className={pdfBusy?'animate-spin':''} />
            PDF
          </button>
          <button onClick={generateBills} disabled={generating}
            className="flex items-center gap-1.5 text-xs font-semibold text-white px-3 py-2 rounded-xl active:scale-95 disabled:opacity-60 flex-shrink-0"
            style={{ background:'linear-gradient(135deg,#8b5cf6,#7c3aed)', WebkitTapHighlightColor:'transparent', transition:'transform 0.1s', boxShadow:'0 4px 14px rgba(139,92,246,0.30)' }}>
            <RefreshCw size={13} className={generating?'animate-spin':''} />
            {generating?'Generating…':'Generate'}
          </button>
        </div>
      </div>

      {/* ── Month Dropdown ── */}
      <div className="relative" ref={dropRef}>
        <button
          onClick={() => setDropOpen(o => !o)}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl"
          style={{
            ...glass,
            border: dropOpen ? '1px solid rgba(139,92,246,0.40)' : '1px solid rgba(255,255,255,0.10)',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)' }}>
              <Calendar size={14} className="text-violet-400" />
            </div>
            <div className="text-left">
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Viewing Month</p>
              <p className="text-white font-bold text-sm leading-tight">{selectedLabel}</p>
            </div>
          </div>
            <div className="flex items-center gap-2 flex-shrink-0">
            {isActivePeriod && (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }}>
                ACTIVE
              </span>
            )}
            {isCurrent && !isActivePeriod && (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }}>
                LIVE
              </span>
            )}
            <ChevronDown size={16} className="text-slate-400 transition-transform duration-200"
              style={{ transform: dropOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
          </div>
        </button>

        {/* Dropdown panel */}
        {dropOpen && (
          <div className="absolute left-0 right-0 top-full mt-2 z-[200] rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(8,12,24,0.97)',
              backdropFilter: 'blur(48px)', WebkitBackdropFilter: 'blur(48px)',
              border: '1px solid rgba(139,92,246,0.25)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
            }}>

            {/* Dropdown header */}
            <div className="flex items-center gap-2 px-4 py-3"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(139,92,246,0.08)' }}>
              <Calendar size={12} className="text-violet-400" />
              <p className="text-[10px] font-bold text-violet-300 uppercase tracking-widest">Select Month</p>
            </div>

            {/* Month list */}
            <div className="max-h-64 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(139,92,246,0.3) transparent' }}>
              {monthOpts.map(({ month: m, year: y }) => {
                const isSel = m === month && y === year;
                const isCur = m === CUR_MONTH && y === CUR_YEAR;
                return (
                  <button
                    key={`${m}-${y}`}
                    onClick={() => { setMonth(m); setYear(y); setDropOpen(false); }}
                    className="w-full flex items-center justify-between px-4 py-3"
                    style={{
                      background: isSel ? 'rgba(139,92,246,0.15)' : 'transparent',
                      borderLeft: isSel ? '2px solid #8b5cf6' : '2px solid transparent',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      WebkitTapHighlightColor: 'transparent',
                      transition: 'background 0.1s',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: isSel ? '#8b5cf6' : isCur ? '#34d399' : '#1e293b' }} />
                      <span className="text-sm font-semibold"
                        style={{ color: isSel ? '#c4b5fd' : '#94a3b8' }}>
                        {MONTHS_FULL[m - 1]}
                      </span>
                      <span className="text-xs text-slate-600">{y}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {m === activePeriodMonth && y === activePeriodYear && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.20)' }}>
                          ACTIVE
                        </span>
                      )}
                      {m === CUR_MONTH && y === CUR_YEAR && !(m === activePeriodMonth && y === activePeriodYear) && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.20)' }}>
                          LIVE
                        </span>
                      )}
                      {isSel && <Check size={13} className="text-violet-400" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Meal Rate',   value: `₹${mealRate.toFixed(2)}`,                   color: '#34d399', bg: 'rgba(52,211,153,0.08)',  border: 'rgba(52,211,153,0.15)'  },
          { label: 'Total Meals', value: summary?.totalMeals || 0,                    color: '#60a5fa', bg: 'rgba(96,165,250,0.08)',  border: 'rgba(96,165,250,0.15)'  },
          { label: 'Grand Total', value: `₹${(summary?.grandTotal || 0).toFixed(2)}`, color: '#fbbf24', bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.15)'  },
          { label: 'Members',     value: bills.length,                                color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.15)' },
        ].map(({ label, value, color, bg, border }) => (
          <div key={label} className="rounded-2xl p-3"
            style={{ background: bg, backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', border: `1px solid ${border}` }}>
            <p className="text-[10px] text-slate-500 mb-1 font-medium uppercase tracking-wide">{label}</p>
            <p className="text-base font-bold" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Bills ── */}
      <div className="space-y-2">
        {bills.length === 0 ? (
          <div className="rounded-2xl py-14 flex flex-col items-center gap-3" style={glass}>
            <span className="text-4xl">🧾</span>
            <p className="text-slate-500 text-sm">No bills for {selectedLabel}</p>
            <p className="text-slate-600 text-xs">Tap "Generate" to calculate bills</p>
          </div>
        ) : bills.map((b, i) => {
          const due    = b.dueAmount ?? 0;
          const isDue  = due > 0;
          const name   = rn(b.memberId?.name);
          return (
            <div key={b._id} className="rounded-2xl px-4 py-3" style={glass}>
              {/* Row 1: avatar + name + due/refund badge */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                  style={{ background:'rgba(167,139,250,0.18)', border:'1px solid rgba(167,139,250,0.25)' }}>
                  {name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-sm truncate">{name}</p>
                  {b.memberId?.room && <p className="text-[10px] text-slate-500">Room {b.memberId.room}</p>}
                </div>
                <div className="flex-shrink-0 text-right">
                  <span className="font-bold text-sm px-3 py-1 rounded-xl block" style={{
                    background: isDue ? 'rgba(248,113,113,0.12)' : 'rgba(52,211,153,0.12)',
                    color: isDue ? '#f87171' : '#34d399',
                    border: isDue ? '1px solid rgba(248,113,113,0.25)' : '1px solid rgba(52,211,153,0.25)',
                  }}>
                    {isDue ? `Due ₹${due.toFixed(2)}` : `Refund ₹${Math.abs(due).toFixed(2)}`}
                  </span>
                </div>
              </div>
              {/* Row 2: stat pills */}
              <div className="grid grid-cols-3 gap-1.5 mb-2">
                {[
                  { label:'Meals',      val: b.mealCount,                                  color:'#e2e8f0' },
                  { label:'Total Bill', val:`₹${(b.totalBill??0).toFixed(2)}`,             color:'#fbbf24' },
                  { label:'Advance',   val:`₹${(b.advance||0).toFixed(2)}`,               color:'#4ade80' },
                ].map(({label,val,color})=>(
                  <div key={label} className="rounded-xl py-2 px-2 text-center"
                    style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)' }}>
                    <p className="text-[10px] text-slate-500 mb-0.5">{label}</p>
                    <p className="text-xs font-bold tabular-nums" style={{color}}>{val}</p>
                  </div>
                ))}
              </div>
              {/* Row 3: breakdown details */}
              <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                {[
                  { label:'Per Meal', val:`₹${mealRate.toFixed(2)}`,                      color:'#fbbf24' },
                  { label:'Meal Cost',val:`₹${(b.mealCost??(b.mealCount*mealRate)).toFixed(2)}`, color:'#e2e8f0' },
                  (b.guestMeals||0)>0 && { label:'Guest',  val:b.guestMeals,              color:'#c084fc' },
                  (b.gasCharge||0)>0  && { label:'Gas',    val:`₹${b.gasCharge.toFixed(2)}`, color:'#fb923c' },
                  (b.otherSharedCharge||0)>0 && { label:'Other Exp', val:`₹${b.otherSharedCharge.toFixed(2)}`, color:'#fb923c' },
                  (b.otherCharges||0)>0 && { label:'Other Chg', val:`₹${b.otherCharges.toFixed(2)}`, color:'#f472b6' },
                  (b.masiSalary||0)>0 && { label:'Masi',  val:`₹${b.masiSalary.toFixed(2)}`, color:'#94a3b8' },
                ].filter(Boolean).map(({label,val,color})=>(
                  <span key={label} className="text-[10px] tabular-nums">
                    <span className="text-slate-500">{label}: </span>
                    <span className="font-semibold" style={{color}}>{val}</span>
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
