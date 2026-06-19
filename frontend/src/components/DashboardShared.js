import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Banknote, IndianRupee, Scale, UtensilsCrossed, TrendingUp, Download, ChefHat, RefreshCw } from 'lucide-react';
import api from '../api';
import useAuthStore from '../store/authStore';

const MONTHS_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const glass = {
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(32px)',
  WebkitBackdropFilter: 'blur(32px)',
  border: '1px solid rgba(255,255,255,0.10)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.07)',
};

// Helper: extract display name — strips role prefix like "Admin (...)" → shows full name
// and builds role label from role field
function formatDisplayName(name, role) {
  // If name already has format "Role (Real Name)", extract real name for avatar initial
  const match = name?.match(/^\w+\s*\((.+)\)$/);
  return match ? match[1] : name;
}

function getRoleLabel(role) {
  if (role === 'admin')   return 'Admin';
  if (role === 'manager') return 'Manager';
  return 'Member';
}

// ─── PDF ──────────────────────────────────────────────────────────────────────
function toBase64(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      c.getContext('2d').drawImage(img, 0, 0);
      resolve(c.toDataURL('image/png'));
    };
    img.onerror = () => resolve('');
    img.src = url + '?v=' + Date.now();
  });
}

async function downloadPDF(summary, individualCosts, totalCollected, month, year) {
  const mealRate   = summary?.mealRate   || 0;
  const grandTotal = summary?.grandTotal || 0;
  const totalMeals = summary?.totalMeals || 0;
  const monthName  = MONTHS_FULL[month - 1];
  const genDate    = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const [logoB64, stampB64] = await Promise.all([
    toBase64('/messy-logo.png'),
    toBase64('/Stamp.png'),
  ]);

  const rn = (name) => { const m = name?.match(/^\w+\s*\((.+)\)$/); return m ? m[1] : (name || ''); };

  const rows = individualCosts.map((m, i) => {
    const name = rn(m.name);
    const roleTag = m.role === 'admin' ? ' <span class="role-admin">Admin</span>' : m.role === 'manager' ? ' <span class="role-mgr">Mgr</span>' : '';
    const due = m.due;
    const masiSalary = m.masiSalary || 0;
    return `<tr class="${i % 2 === 0 ? 'even' : ''}">
      <td><span class="avatar">${name[0].toUpperCase()}</span>${name}${roleTag}</td>
      <td class="center">${m.totalMeals}</td>
      <td class="right">&#8377;${mealRate.toFixed(2)}</td>
      <td class="right">&#8377;${m.totalMealCost.toFixed(2)}</td>
      <td class="right">&#8377;${masiSalary.toFixed(2)}</td>
      <td class="right">&#8377;${m.moneyGiven.toFixed(2)}</td>
      <td class="right ${due >= 0 ? 'pos' : 'neg'}">${due >= 0 ? '+' : ''}&#8377;${Math.abs(due).toFixed(2)}</td>
    </tr>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>The Messy Kitchen — ${monthName} ${year}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Inter',Arial,sans-serif;background:#f8fafc;color:#0f172a;font-size:13px;print-color-adjust:exact;-webkit-print-color-adjust:exact}
  .page{background:#fff;max-width:860px;margin:0 auto;padding:40px 44px 50px}

  /* ── HEADER ── */
  .header{display:flex;align-items:center;justify-content:space-between;padding-bottom:20px;border-bottom:3px solid #22c55e;margin-bottom:28px}
  .header-left{display:flex;align-items:center;gap:14px}
  .logo-img{width:64px;height:64px;object-fit:contain}
  .brand-name{font-family:'Dancing Script',cursive;font-size:28px;font-weight:700;color:#0f172a;line-height:1.1}
  .brand-sub{font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:1.5px;margin-top:2px}
  .header-right{text-align:right}
  .statement-title{font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px;font-weight:600}
  .statement-period{font-size:18px;font-weight:800;color:#0f172a;margin-top:3px}
  .statement-badge{display:inline-block;margin-top:5px;background:#dcfce7;color:#16a34a;border:1px solid #bbf7d0;border-radius:999px;font-size:10px;font-weight:700;padding:3px 10px;letter-spacing:.5px}

  /* ── STAT CARDS ── */
  .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:28px}
  .stat{background:#f8fafc;border-radius:12px;padding:14px 12px;border:1px solid #e2e8f0;text-align:center}
  .stat-icon{font-size:20px;margin-bottom:6px}
  .stat-label{font-size:9.5px;color:#64748b;text-transform:uppercase;letter-spacing:.8px;font-weight:600;margin-bottom:4px}
  .stat-val{font-size:20px;font-weight:800;color:#0f172a}

  /* ── SECTION TITLE ── */
  .section-title{font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;display:flex;align-items:center;gap:8px}
  .section-title::after{content:'';flex:1;height:1px;background:#e2e8f0}

  /* ── TABLE ── */
  table{width:100%;border-collapse:collapse}
  thead tr{background:#0f172a}
  th{padding:11px 14px;text-align:left;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.6px}
  th.right{text-align:right}
  th.center{text-align:center}
  td{padding:10px 14px;border-bottom:1px solid #f1f5f9;vertical-align:middle}
  td.right{text-align:right}
  td.center{text-align:center}
  tr.even td{background:#f8fafc}
  .avatar{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;background:#e2e8f0;color:#0f172a;font-weight:700;font-size:11px;margin-right:8px;vertical-align:middle}
  .role-admin{font-size:9px;background:#fee2e2;color:#dc2626;border-radius:4px;padding:1px 5px;margin-left:4px;font-weight:600;vertical-align:middle}
  .role-mgr{font-size:9px;background:#fef3c7;color:#d97706;border-radius:4px;padding:1px 5px;margin-left:4px;font-weight:600;vertical-align:middle}
  .pos{color:#16a34a;font-weight:700}
  .neg{color:#dc2626;font-weight:700}

  /* ── STAMP SECTION ── */
  .bottom-section{display:flex;align-items:flex-end;justify-content:space-between;margin-top:40px;padding-top:24px;border-top:1px solid #e2e8f0}
  .footer-left{font-size:10px;color:#94a3b8;line-height:1.7}
  .footer-left strong{color:#64748b;display:block;margin-bottom:2px;font-size:11px}
  .stamp-wrap{text-align:center}
  .stamp-img{width:110px;height:110px;object-fit:contain;opacity:0.88}
  .stamp-label{font-size:9px;color:#94a3b8;margin-top:4px;text-transform:uppercase;letter-spacing:.8px}

  @media print{
    body{background:#fff}
    .page{padding:28px 32px 36px}
    @page{margin:12mm 10mm}
  }
</style>
</head>
<body>
<div class="page">

  <!-- HEADER -->
  <div class="header">
    <div class="header-left">
      ${logoB64 ? `<img src="${logoB64}" class="logo-img" alt="logo">` : '<span style="font-size:36px">🍽</span>'}
      <div>
        <div class="brand-name">The Messy Kitchen</div>
        <div class="brand-sub">Mess Meal Management System</div>
      </div>
    </div>
    <div class="header-right">
      <div class="statement-title">Monthly Statement</div>
      <div class="statement-period">${monthName} ${year}</div>
      <span class="statement-badge">OFFICIAL RECORD</span>
    </div>
  </div>

  <!-- STATS -->
  <div class="stats">
    <div class="stat"><div class="stat-icon">💸</div><div class="stat-label">Total Spent</div><div class="stat-val">&#8377;${grandTotal.toFixed(2)}</div></div>
    <div class="stat"><div class="stat-icon">🍽</div><div class="stat-label">Total Meals</div><div class="stat-val">${totalMeals}</div></div>
    <div class="stat"><div class="stat-icon">⚖️</div><div class="stat-label">Per Meal Rate</div><div class="stat-val" style="color:#d97706">&#8377;${mealRate.toFixed(2)}</div></div>
    <div class="stat"><div class="stat-icon">💰</div><div class="stat-label">Collected</div><div class="stat-val" style="color:#2563eb">&#8377;${totalCollected.toFixed(2)}</div></div>
  </div>

  <!-- TABLE -->
  <div class="section-title">Individual Meal Cost Breakdown</div>
  <table>
    <thead>
      <tr>
        <th>Member</th>
        <th class="center">Meals</th>
        <th class="right">Per Meal</th>
        <th class="right">Meal Cost</th>
        <th class="right">Masi Salary</th>
        <th class="right">Amount Paid</th>
        <th class="right">Balance</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <!-- BOTTOM: footer + stamp -->
  <div class="bottom-section">
    <div class="footer-left">
      <strong>The Messy Kitchen</strong>
      Generated on ${genDate}<br>
      This is a computer-generated statement.<br>
      For queries, contact the mess manager.
    </div>
    <div class="stamp-wrap">
      ${stampB64 ? `<img src="${stampB64}" class="stamp-img" alt="stamp">` : ''}
      <div class="stamp-label">Authorised Stamp</div>
    </div>
  </div>

</div>
<script>window.onload=()=>window.print()<\/script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const win  = window.open(url, '_blank');
  if (!win) {
    toast.error('Pop-up blocked — please allow pop-ups and try again');
    URL.revokeObjectURL(url);
    return;
  }
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

// ─── Expense Type Card ────────────────────────────────────────────────────────
function ExpenseTypeCard({ month, year, canEdit, categoryName, emoji, onStatusChange }) {
  const [entries, setEntries] = useState([]);

  const load = useCallback(() => {
    api.get(`/expenses/other/${month}/${year}`)
      .then(r => setEntries(r.data.filter(e => e.categoryName === categoryName)))
      .catch(() => {});
  }, [month, year, categoryName]);

  useEffect(() => { load(); }, [load]);

  const toggleStatus = async (entry) => {
    try {
      await api.put(`/expenses/other/${entry._id}`, { status: entry.status === 'Paid' ? 'Due' : 'Paid' });
      toast.success(`Marked as ${entry.status === 'Paid' ? 'Due' : 'Paid'}`);
      load();
      if (onStatusChange) onStatusChange(); // refresh parent summary
    } catch { toast.error('Failed to update'); }
  };

  const total = entries.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="rounded-xl p-4" style={glass}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{emoji}</span>
          <div>
            <h3 className="font-semibold text-white text-sm">{categoryName}</h3>
            <p className="text-slate-500 text-xs">{MONTHS_FULL[month - 1]} {year}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-white">₹{total.toFixed(2)}</p>
          <p className="text-slate-500 text-xs">{entries.length} {entries.length === 1 ? 'entry' : 'entries'}</p>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="py-3 text-center text-slate-600 text-xs border border-dashed border-slate-700/60 rounded-lg">
          No {categoryName.toLowerCase()} entries this month
        </div>
      ) : (
        <div className="space-y-1.5">
          {entries.map(e => (
            <div key={e._id} className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="min-w-0 flex-1 mr-3">
                <p className="text-white text-sm font-medium truncate">{e.description || categoryName}</p>
                <p className="text-slate-500 text-xs">{new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-sm font-bold text-slate-200">₹{e.amount.toFixed(2)}</span>
                {canEdit ? (
                  <button onClick={() => toggleStatus(e)}
                    className={`text-xs px-2.5 py-1 rounded-full font-semibold border transition-all ${
                      e.status === 'Paid'
                        ? 'bg-green-500/15 text-green-400 border-green-500/25 hover:bg-green-500/25'
                        : 'bg-red-500/15 text-red-400 border-red-500/25 hover:bg-red-500/25'
                    }`}>
                    {e.status === 'Paid' ? '✓ Paid' : '⏳ Due'}
                  </button>
                ) : (
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                    e.status === 'Paid' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}>
                    {e.status === 'Paid' ? '✓ Paid' : '⏳ Due'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Individual Cost Table ────────────────────────────────────────────────────
function IndividualCostTable({ individualCosts, mealRate, summary, totalCollected: tcProp, month, year, onRefresh }) {
  if (!individualCosts?.length) return null;

  const grandTotal     = summary?.grandTotal || 0;
  const totalMeals     = summary?.totalMeals || 0;
  const totalCollected = tcProp ?? summary?.totalCollected ?? 0;

  return (
    <div className="rounded-xl overflow-hidden" style={glass}>
      {/* Statement header */}
      <div className="p-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}>
              <ChefHat size={16} className="text-green-400" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-white text-xs">THE MESSY KITCHEN</p>
              <p className="text-slate-500 text-[10px] truncate">Mess Statement — {MONTHS_FULL[month - 1]} {year}</p>
            </div>
          </div>
          <button
            onClick={() => summary ? downloadPDF(summary, individualCosts, totalCollected, month, year) : toast.error('No data yet')}
            className="flex items-center gap-1.5 text-xs font-semibold bg-green-600 hover:bg-green-500 text-white px-3 py-2 rounded-xl transition-all active:scale-95 flex-shrink-0">
            <Download size={13} /> PDF
          </button>
          {onRefresh && (
            <button onClick={onRefresh}
              className="flex items-center gap-1.5 text-xs font-semibold text-white px-3 py-2 rounded-xl active:scale-95 flex-shrink-0"
              style={{ background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.25)', WebkitTapHighlightColor: 'transparent' }}>
              <RefreshCw size={13} /> Refresh
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { label: 'Total Spent',     value: `₹${grandTotal.toFixed(2)}` },
            { label: 'Total Meals',     value: totalMeals },
            { label: 'Per Meal Cost',   value: `₹${(mealRate||0).toFixed(2)}` },
            { label: 'Total Collected', value: `₹${totalCollected.toFixed(2)}` },
          ].map(s => (
            <div key={s.label} className="rounded-lg p-2 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-slate-500 text-[10px] mb-0.5">{s.label}</p>
              <p className="font-bold text-xs text-white">{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="p-3">
        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: '320px', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                {[
                  { h: 'Name',     cls: 'text-left'  },
                  { h: 'Meals',    cls: 'text-right' },
                  { h: 'Per Meal', cls: 'text-right hidden sm:table-cell' },
                  { h: 'Cost',     cls: 'text-right' },
                  { h: 'Masi',     cls: 'text-right hidden sm:table-cell' },
                  { h: 'Paid',     cls: 'text-right hidden sm:table-cell' },
                  { h: 'Balance',  cls: 'text-right' },
                ].map(({ h, cls }) => (
                  <th key={h} className={`py-2 px-1.5 text-slate-500 font-semibold text-[10px] uppercase tracking-wide ${cls}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {individualCosts.map((m, i) => (
                <tr key={m._id}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 !== 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}
                >
                  <td className="py-2 px-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                        style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.12)' }}>
                        {formatDisplayName(m.name, m.role)?.[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <span className="text-white font-medium block truncate" style={{ maxWidth: '70px' }}>{formatDisplayName(m.name, m.role)}</span>
                        {m.role === 'manager' && <span className="badge-manager text-[9px] px-1 py-0">Mgr</span>}
                        {m.role === 'admin'   && <span className="badge-admin   text-[9px] px-1 py-0">Admin</span>}
                      </div>
                    </div>
                  </td>
                  <td className="py-2 px-1.5 text-right text-white font-semibold">{m.totalMeals}</td>
                  <td className="py-2 px-1.5 text-right text-slate-400 hidden sm:table-cell">₹{(mealRate||0).toFixed(2)}</td>
                  <td className="py-2 px-1.5 text-right text-slate-200">₹{m.totalMealCost.toFixed(2)}</td>
                  <td className="py-2 px-1.5 text-right text-slate-400 hidden sm:table-cell">₹{(m.masiSalary||0).toFixed(2)}</td>
                  <td className="py-2 px-1.5 text-right text-slate-200 hidden sm:table-cell">₹{m.moneyGiven.toFixed(2)}</td>
                  <td className="py-2 px-1.5 text-right">
                    <span className={`font-bold px-1.5 py-0.5 rounded-lg ${m.due >= 0 ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'}`}>
                      {m.due >= 0 ? '+' : ''}₹{Math.abs(m.due).toFixed(2)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function DashboardShared({ summary, totalCollected, mealRate, totalAllMeals, individualCosts, canEditGas, role, selectedMonth, selectedYear, onRefresh }) {
  const { user } = useAuthStore();
  const now   = new Date();
  const month = selectedMonth || now.getMonth() + 1;
  const year  = selectedYear  || now.getFullYear();

  const [liveSummary, setLiveSummary] = useState(summary);

  useEffect(() => { setLiveSummary(summary); }, [summary]);

  const refreshSummary = useCallback(async () => {
    try {
      const r = await api.get(`/summary/${month}/${year}`);
      setLiveSummary(r.data);
    } catch {}
    if (onRefresh) onRefresh();
  }, [month, year, onRefresh]);

  const grandTotal  = liveSummary?.grandTotal || 0;
  const messBalance = liveSummary?.messBalance ?? (totalCollected - grandTotal);

  const roleAccent = { admin: '#f87171', manager: '#fbbf24', member: '#4ade80' }[role] || '#94a3b8';

  const displayName    = user?.name || '';
  const realName       = formatDisplayName(displayName, role);
  const roleBadgeLabel = getRoleLabel(role);

  const summaryCards = [
    { label: 'Total Collected', value: `₹${(totalCollected||0).toFixed(2)}`, icon: Banknote,       iconColor: '#60a5fa', sub: "Advance payments" },
    { label: 'Total Spent',     value: `₹${grandTotal.toFixed(2)}`,          icon: IndianRupee,    iconColor: '#fbbf24', sub: "Paid expenses only" },
    { label: messBalance >= 0 ? 'Available Balance' : 'Deficit',
      value: `${messBalance >= 0 ? '+' : ''}₹${Math.abs(messBalance).toFixed(2)}`,
      icon: Scale,
      iconColor: messBalance >= 0 ? '#4ade80' : '#f87171',
      sub: "Collected − Paid expenses",
      valueColor: messBalance >= 0 ? '#4ade80' : '#f87171' },
    { label: 'Total Meals',     value: totalAllMeals || liveSummary?.totalMeals || 0, icon: UtensilsCrossed, iconColor: '#34d399', sub: "Lunch + Dinner" },
    { label: 'Per Meal Cost',   value: `₹${(liveSummary?.mealRate || mealRate || 0).toFixed(2)}`, icon: TrendingUp, iconColor: '#a78bfa', sub: "Total ÷ Meals" },
  ];

  return (
    <div className="space-y-5">

      {/* ── Welcome Banner ── */}
      <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(48px)', WebkitBackdropFilter: 'blur(48px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.10)' }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold text-white"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
              {realName?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wider">Welcome back</p>
              <h2 style={{
                fontFamily: "'Dancing Script', cursive",
                fontSize: '1.75rem', fontWeight: 700, lineHeight: 1.2,
                background: 'linear-gradient(135deg,#ffffff 0%,#d1fae5 50%,#6ee7b7 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>{realName}</h2>
              <span className="text-xs font-semibold" style={{ color: roleAccent }}>{roleBadgeLabel}</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl px-4 py-2.5"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}>
            <ChefHat size={18} className="text-green-400" />
            <div>
              <p style={{
                fontFamily: "'Dancing Script', cursive",
                fontSize: '1.1rem', fontWeight: 700, lineHeight: 1.2,
                background: 'linear-gradient(135deg,#ffffff 0%,#d1fae5 50%,#6ee7b7 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>The Messy Kitchen</p>
              <p className="text-slate-500 text-xs">{MONTHS_FULL[month - 1]} {year}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Financial + Meal Summary Cards — uniform glass ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {summaryCards.map(({ label, value, icon: Icon, iconColor, sub, valueColor }) => (
          <div key={label} className="rounded-xl p-4" style={glass}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.09)' }}>
              <Icon size={15} style={{ color: iconColor }} />
            </div>
            <p className="text-xl font-bold text-white" style={valueColor ? { color: valueColor } : {}}>{value}</p>
            <p className="text-slate-400 text-xs mt-0.5 font-medium">{label}</p>
            <p className="text-slate-600 text-xs mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Gas + Rice Bag ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ExpenseTypeCard month={month} year={year} canEdit={canEditGas} categoryName="Gas Cylinder" emoji="🔥" onStatusChange={refreshSummary} />
        <ExpenseTypeCard month={month} year={year} canEdit={canEditGas} categoryName="Rice Bag"     emoji="🌾" onStatusChange={refreshSummary} />
      </div>

      {/* ── Individual Cost Table ── */}
      <IndividualCostTable
        individualCosts={individualCosts}
        mealRate={liveSummary?.mealRate || mealRate}
        summary={liveSummary}
        totalCollected={totalCollected}
        month={month}
        year={year}
        onRefresh={refreshSummary}
      />
    </div>
  );
}
