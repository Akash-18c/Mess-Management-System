import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { Trash2, AlertTriangle, ShieldAlert, CheckCircle2, Flame, UserX, UtensilsCrossed, ChevronDown, X, Search, Zap } from 'lucide-react';
import api from '../../api';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const rn = n => { const m = n?.match(/^\w+\s*\((.+)\)$/); return m ? m[1] : (n || ''); };

// ── Confirm Modal (bottom-sheet on mobile) ────────────────────────────────────
function ConfirmModal({ open, onClose, title, subtitle, phrase, onConfirm, loading }) {
  const [val, setVal] = useState('');
  const inputRef = useRef(null);
  const match = val.trim() === phrase;

  useEffect(() => {
    if (open) { setVal(''); setTimeout(() => inputRef.current?.focus(), 120); }
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(12px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl overflow-hidden"
        style={{ background: 'rgba(10,6,6,0.98)', border: '1px solid rgba(239,68,68,0.20)', boxShadow: '0 -8px 48px rgba(0,0,0,0.7)' }}>
        {/* drag handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
        </div>
        <div className="h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(239,68,68,0.5),transparent)' }} />
        {/* header */}
        <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid rgba(239,68,68,0.10)' }}>
          <div className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.30)' }}>
            <Flame size={16} className="text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white text-sm leading-tight">{title}</p>
            {subtitle && <p className="text-xs text-red-400 mt-0.5 truncate">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#64748b' }}>
            <X size={14} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-400">Type this phrase exactly to confirm:</p>
          <div className="rounded-2xl px-4 py-3 text-center"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px dashed rgba(239,68,68,0.35)' }}>
            <span className="font-mono font-bold text-sm text-red-300 tracking-wide select-all">{phrase}</span>
          </div>
          <input ref={inputRef}
            className="input font-mono text-sm w-full"
            placeholder={phrase}
            value={val}
            onChange={e => setVal(e.target.value)}
            style={{ borderColor: val.length > 0 ? (match ? 'rgba(52,211,153,0.5)' : 'rgba(239,68,68,0.4)') : undefined, borderRadius: '14px' }}
          />
          {val.length > 0 && (
            <p className="text-xs font-semibold flex items-center gap-1.5" style={{ color: match ? '#34d399' : '#f87171' }}>
              {match ? <><CheckCircle2 size={12} /> Ready to delete</> : <><AlertTriangle size={12} /> Phrase doesn't match</>}
            </p>
          )}
          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-3 rounded-2xl text-sm font-semibold text-slate-300"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}>
              Cancel
            </button>
            <button onClick={() => { onConfirm(); setVal(''); }} disabled={loading || !match}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm text-white disabled:opacity-40"
              style={{ background: match ? 'linear-gradient(135deg,#dc2626,#ef4444)' : 'rgba(239,68,68,0.25)', border: '1px solid rgba(239,68,68,0.35)', boxShadow: match ? '0 4px 20px rgba(239,68,68,0.30)' : 'none', transition: 'all 0.2s' }}>
              <Trash2 size={13} /> {loading ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Member Picker (bottom-sheet on mobile) ────────────────────────────────────
function MemberPicker({ members, value, onChange, open, onClose }) {
  const [q, setQ] = useState('');
  const filtered = members.filter(m => rn(m.name).toLowerCase().includes(q.toLowerCase()));

  useEffect(() => { if (!open) setQ(''); }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[9998] flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col"
        style={{ background: 'rgba(8,10,20,0.99)', border: '1px solid rgba(232,121,249,0.18)', boxShadow: '0 -8px 48px rgba(0,0,0,0.7)', maxHeight: '80vh' }}>
        {/* drag handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
        </div>
        {/* header */}
        <div className="flex items-center justify-between px-5 py-3.5 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="font-bold text-white text-sm">Select Member</p>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#64748b' }}>
            <X size={14} />
          </button>
        </div>
        {/* search */}
        <div className="px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}>
            <Search size={14} className="text-slate-500 flex-shrink-0" />
            <input
              autoFocus
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search member…"
              className="flex-1 bg-transparent text-sm text-white placeholder-slate-600 outline-none"
            />
            {q && <button onClick={() => setQ('')}><X size={12} className="text-slate-500" /></button>}
          </div>
        </div>
        {/* list */}
        <div className="overflow-y-auto flex-1" style={{ scrollbarWidth: 'thin' }}>
          {filtered.length === 0
            ? <p className="text-center text-slate-600 text-sm py-8">No members found</p>
            : filtered.map((m, i) => {
              const name = rn(m.name);
              const isSel = m._id === value;
              const initial = name[0]?.toUpperCase();
              return (
                <button key={m._id}
                  onClick={() => { onChange(m._id); onClose(); }}
                  className="w-full flex items-center gap-3 px-5 py-3.5 text-left active:bg-white/5"
                  style={{
                    borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    background: isSel ? 'rgba(232,121,249,0.08)' : 'transparent',
                    borderLeft: isSel ? '3px solid #e879f9' : '3px solid transparent',
                    WebkitTapHighlightColor: 'transparent',
                  }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: isSel ? 'rgba(232,121,249,0.20)' : 'rgba(255,255,255,0.07)', color: isSel ? '#e879f9' : '#94a3b8' }}>
                    {initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: isSel ? '#e879f9' : '#e2e8f0' }}>{name}</p>
                    {m.room && <p className="text-xs text-slate-500 mt-0.5">Room {m.room}</p>}
                  </div>
                  {isSel && <CheckCircle2 size={16} style={{ color: '#e879f9', flexShrink: 0 }} />}
                </button>
              );
            })
          }
        </div>
      </div>
    </div>
  );
}

// ── Result grid ───────────────────────────────────────────────────────────────
function ResultGrid({ data }) {
  const entries = Object.entries(data).filter(([, v]) => typeof v === 'number');
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.18)' }}>
      <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid rgba(16,185,129,0.12)' }}>
        <CheckCircle2 size={14} className="text-emerald-400" />
        <p className="text-xs font-bold text-emerald-400">Done — records deleted</p>
      </div>
      <div className="grid grid-cols-2 gap-px" style={{ background: 'rgba(255,255,255,0.04)' }}>
        {entries.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between px-3 py-2.5"
            style={{ background: 'rgba(8,12,24,0.80)' }}>
            <span className="text-xs text-slate-500 capitalize truncate">{k}</span>
            <span className="text-sm font-bold text-emerald-400 ml-2 flex-shrink-0">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Action Card ───────────────────────────────────────────────────────────────
function ActionCard({ icon: Icon, iconBg, iconColor, accentBorder, title, subtitle, description, children, danger }) {
  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${accentBorder}`, boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
      {/* card header */}
      <div className="flex items-center gap-3 px-4 py-4" style={{ borderBottom: `1px solid ${accentBorder}` }}>
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: iconBg, border: `1px solid ${iconColor}40` }}>
          <Icon size={18} style={{ color: iconColor }} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-white leading-tight">{title}</p>
          <p className="text-xs mt-0.5" style={{ color: iconColor }}>{subtitle}</p>
        </div>
      </div>
      {/* body */}
      <div className="px-4 py-4 space-y-4">
        {description && <p className="text-xs text-slate-500 leading-relaxed">{description}</p>}
        {children}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
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

  const [mealsModal,   setMealsModal]   = useState(false);
  const [mealsLoading, setMealsLoading] = useState(false);
  const [mealsResult,  setMealsResult]  = useState(null);

  const [siteModal,   setSiteModal]   = useState(false);
  const [siteLoading, setSiteLoading] = useState(false);
  const [siteResult,  setSiteResult]  = useState(null);

  const [members,       setMembers]       = useState([]);
  const [selMember,     setSelMember]     = useState('');
  const [pickerOpen,    setPickerOpen]    = useState(false);
  const [memberModal,   setMemberModal]   = useState(false);
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberResult,  setMemberResult]  = useState(null);

  useEffect(() => {
    api.get('/admin/members').then(r => setMembers(r.data.filter(m => m.role !== 'admin'))).catch(() => {});
  }, [memberResult]);

  const selectedMember = members.find(m => m._id === selMember);
  const memberPhrase   = selectedMember ? `DELETE ${rn(selectedMember.name).toUpperCase()}` : '';
  const selectedLabel  = `${MONTHS[month - 1]} ${year}`;
  const confirmPhrase  = `DELETE ${selectedLabel.toUpperCase()}`;

  const handlePurge = async () => {
    setLoading(true);
    try {
      const { data } = await api.delete(`/admin/purge-month/${month}/${year}`);
      setResult(data.deleted); toast.success(data.message); setModal(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Purge failed'); }
    finally { setLoading(false); }
  };

  const handlePurgeSiteData = async () => {
    setSiteLoading(true);
    try {
      const { data } = await api.delete('/admin/purge-site-data');
      setSiteResult(data.deleted); toast.success(data.message); setSiteModal(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Purge failed'); }
    finally { setSiteLoading(false); }
  };

  const handlePurgeAll = async () => {
    setAllLoading(true);
    try {
      const { data } = await api.delete('/admin/purge-all-members');
      setAllResult(data.deleted); toast.success(data.message); setAllModal(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Purge failed'); }
    finally { setAllLoading(false); }
  };

  const handlePurgeAllMeals = async () => {
    setMealsLoading(true);
    try {
      const { data } = await api.delete('/admin/purge-all-meals');
      setMealsResult(data.deleted); toast.success(data.message); setMealsModal(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
    finally { setMealsLoading(false); }
  };

  const handlePurgeMember = async () => {
    setMemberLoading(true);
    try {
      const { data } = await api.delete(`/admin/purge-member/${selMember}`);
      setMemberResult(data.deleted); toast.success(data.message); setMemberModal(false); setSelMember('');
    } catch (err) { toast.error(err.response?.data?.message || 'Purge failed'); }
    finally { setMemberLoading(false); }
  };

  const yearOptions = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

  return (
    <div className="space-y-4 max-w-lg pb-8">

      {/* ── Header ── */}
      <div className="rounded-2xl p-4 flex items-center gap-3"
        style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)' }}>
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.30)' }}>
          <ShieldAlert size={20} className="text-red-400" />
        </div>
        <div>
          <h1 className="text-base font-bold text-white">Purge Data</h1>
          <p className="text-xs text-slate-500 mt-0.5">Permanently wipe records — irreversible</p>
        </div>
      </div>

      {/* ── 1. Purge by Month ── */}
      <ActionCard
        icon={Trash2} iconBg="rgba(239,68,68,0.15)" iconColor="#f87171"
        accentBorder="rgba(239,68,68,0.18)"
        title="Purge Month Data"
        subtitle="Wipes all records for a specific month"
        description="Deletes meals, expenses, payments, bills, and summary for the selected month. Member accounts are never deleted.">

        {/* Month + Year selectors */}
        <div className="grid grid-cols-2 gap-3">
          {/* Month */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Month</p>
            <div className="relative">
              <select
                value={month}
                onChange={e => { setMonth(Number(e.target.value)); setResult(null); }}
                className="w-full appearance-none text-sm font-semibold text-white pr-8 pl-3 py-2.5 rounded-xl outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', WebkitAppearance: 'none' }}>
                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
              <ChevronDown size={13} className="text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
          {/* Year */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Year</p>
            <div className="relative">
              <select
                value={year}
                onChange={e => { setYear(Number(e.target.value)); setResult(null); }}
                className="w-full appearance-none text-sm font-semibold text-white pr-8 pl-3 py-2.5 rounded-xl outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', WebkitAppearance: 'none' }}>
                {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <ChevronDown size={13} className="text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Selected label + button */}
        <div className="flex items-center justify-between gap-3 rounded-xl px-4 py-3"
          style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)' }}>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Selected</p>
            <p className="text-sm font-bold text-red-300 mt-0.5">{selectedLabel}</p>
          </div>
          <button onClick={() => setModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white flex-shrink-0 active:scale-95 transition-transform"
            style={{ background: 'rgba(239,68,68,0.25)', border: '1px solid rgba(239,68,68,0.40)', WebkitTapHighlightColor: 'transparent' }}>
            <Trash2 size={13} /> Purge
          </button>
        </div>

        {result && <ResultGrid data={result} />}
      </ActionCard>

      {/* ── 2. Delete All Meals ── */}
      <ActionCard
        icon={UtensilsCrossed} iconBg="rgba(52,211,153,0.15)" iconColor="#34d399"
        accentBorder="rgba(52,211,153,0.18)"
        title="Delete All Meals"
        subtitle="Wipes every meal record across all months"
        description="Only meal records are deleted. Expenses, payments, bills and member accounts are not affected.">
        <button onClick={() => { setMealsResult(null); setMealsModal(true); }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white active:scale-95 transition-transform"
          style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.30)', WebkitTapHighlightColor: 'transparent' }}>
          <UtensilsCrossed size={14} /> Delete All Meal Records
        </button>
        {mealsResult && <ResultGrid data={mealsResult} />}
      </ActionCard>

      {/* ── 3. Delete Single Member ── */}
      <ActionCard
        icon={UserX} iconBg="rgba(232,121,249,0.15)" iconColor="#e879f9"
        accentBorder="rgba(232,121,249,0.18)"
        title="Delete Single Member"
        subtitle="Removes login + all their records">

        {/* Member selector button */}
        <button onClick={() => setPickerOpen(true)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left active:bg-white/5 transition-colors"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', WebkitTapHighlightColor: 'transparent' }}>
          {selectedMember ? (
            <>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ background: 'rgba(232,121,249,0.20)', color: '#e879f9' }}>
                {rn(selectedMember.name)[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{rn(selectedMember.name)}</p>
                {selectedMember.room && <p className="text-xs text-slate-500">Room {selectedMember.room}</p>}
              </div>
            </>
          ) : (
            <>
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.07)' }}>
                <UserX size={14} className="text-slate-500" />
              </div>
              <p className="text-sm text-slate-500 flex-1">Tap to select member…</p>
            </>
          )}
          <ChevronDown size={14} className="text-slate-500 flex-shrink-0" />
        </button>

        <button
          onClick={() => { if (!selMember) { toast.error('Select a member first'); return; } setMemberResult(null); setMemberModal(true); }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white active:scale-95 transition-transform"
          style={{ background: selMember ? 'rgba(232,121,249,0.18)' : 'rgba(255,255,255,0.05)', border: `1px solid ${selMember ? 'rgba(232,121,249,0.35)' : 'rgba(255,255,255,0.08)'}`, opacity: selMember ? 1 : 0.5, WebkitTapHighlightColor: 'transparent' }}>
          <UserX size={14} /> Delete Member
        </button>

        {memberResult && <ResultGrid data={memberResult} />}
      </ActionCard>

      {/* ── 4. Purge Site Data ── */}
      <ActionCard
        icon={Zap} iconBg="rgba(251,191,36,0.15)" iconColor="#fbbf24"
        accentBorder="rgba(251,191,36,0.22)"
        title="Reset All Data"
        subtitle="Wipes everything except members & market duty"
        description="Deletes all meals, expenses, payments, bills, summaries, assignments, borrows, and resets manager roles. Member accounts, birthdays, and market duty are preserved.">
        <button onClick={() => { setSiteResult(null); setSiteModal(true); }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white active:scale-95 transition-transform"
          style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.35)', WebkitTapHighlightColor: 'transparent' }}>
          <Zap size={14} /> Reset Site Data
        </button>
        {siteResult && <ResultGrid data={siteResult} />}
      </ActionCard>

      {/* ── 5. Purge All Members ── */}
      <ActionCard
        icon={Flame} iconBg="rgba(239,68,68,0.15)" iconColor="#f87171"
        accentBorder="rgba(239,68,68,0.22)"
        title="Purge Everything"
        subtitle="Nuclear option — wipes all members & data"
        description="Deletes all members and every record across all months. Only the admin account is preserved.">
        <button onClick={() => { setAllResult(null); setAllModal(true); }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white active:scale-95 transition-transform"
          style={{ background: 'rgba(239,68,68,0.18)', border: '1px solid rgba(239,68,68,0.35)', WebkitTapHighlightColor: 'transparent' }}>
          <Flame size={14} /> Delete All Members &amp; Data
        </button>
        {allResult && <ResultGrid data={allResult} />}
      </ActionCard>

      {/* ── Member Picker Sheet ── */}
      <MemberPicker
        members={members}
        value={selMember}
        onChange={id => { setSelMember(id); setMemberResult(null); }}
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
      />

      {/* ── Confirm Modals ── */}
      <ConfirmModal open={modal}       onClose={() => setModal(false)}       title="Purge Month Data"          subtitle={`${selectedLabel} · Cannot be undone`}                          phrase={confirmPhrase}  onConfirm={handlePurge}          loading={loading}        />
      <ConfirmModal open={mealsModal}  onClose={() => setMealsModal(false)}  title="Delete All Meal Records"  subtitle="Every meal across all months"                                    phrase="DELETE ALL MEALS" onConfirm={handlePurgeAllMeals}  loading={mealsLoading}   />
      <ConfirmModal open={memberModal} onClose={() => setMemberModal(false)} title="Delete Member"            subtitle={selectedMember ? `${rn(selectedMember.name)} · Cannot be undone` : ''} phrase={memberPhrase}   onConfirm={handlePurgeMember}    loading={memberLoading}  />
      <ConfirmModal open={allModal}    onClose={() => setAllModal(false)}    title="Purge All Members & Data" subtitle="Admin account will be preserved"                                  phrase="DELETE ALL MEMBERS" onConfirm={handlePurgeAll}    loading={allLoading}     />
      <ConfirmModal open={siteModal}   onClose={() => setSiteModal(false)}   title="Reset All Site Data"     subtitle="Members & market duty will be kept"                             phrase="RESET SITE DATA"   onConfirm={handlePurgeSiteData} loading={siteLoading}  />
    </div>
  );
}
