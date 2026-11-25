import React, { useEffect, useState } from 'react';
import { Clock, LogIn, LogOut, Search, User } from 'lucide-react';
import api from '../../api';

const rn = (name) => { const m = name?.match(/^\w+\s*\((.+)\)$/); return m ? m[1] : (name || ''); };

const ROLE_STYLE = {
  manager: { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.25)' },
  member:  { color: '#34d399', bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.25)' },
  admin:   { color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.25)' },
};

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtTime(d) {
  return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}
function fmtDuration(secs) {
  if (!secs || secs < 0) return '—';
  if (secs < 60) return `${secs}s`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ${secs % 60}s`;
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return `${h}h ${m}m`;
}

export default function AdminLoginHistory() {
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    api.get('/admin/login-logs')
      .then(r => setLogs(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter(l => {
    const name = rn(l.name).toLowerCase();
    const matchSearch = !search || name.includes(search.toLowerCase());
    const matchRole   = roleFilter === 'all' || l.role === roleFilter;
    return matchSearch && matchRole;
  });

  // Stats
  const today = new Date().toDateString();
  const todayCount  = logs.filter(l => new Date(l.loginAt).toDateString() === today).length;
  const activeNow   = logs.filter(l => !l.logoutAt).length;
  const uniqueUsers = new Set(logs.map(l => l.userId)).size;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Login History</h1>
        <p style={{ color: '#475569', fontSize: 13 }}>Track member login sessions, activity time, and usage patterns.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Today\'s Logins', value: todayCount, color: '#34d399', icon: LogIn },
          { label: 'Currently Active', value: activeNow, color: '#60a5fa', icon: Clock },
          { label: 'Unique Users', value: uniqueUsers, color: '#fbbf24', icon: User },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="rounded-2xl p-4 flex items-center gap-3"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${color}18`, border: `1px solid ${color}33` }}>
              <Icon size={16} style={{ color }} />
            </div>
            <div>
              <p className="text-xl font-bold text-white leading-none">{value}</p>
              <p className="text-xs mt-0.5" style={{ color: '#475569' }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-2 flex-1 min-w-[180px] rounded-xl px-3 py-2"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}>
          <Search size={14} style={{ color: '#475569', flexShrink: 0 }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name…"
            className="bg-transparent outline-none text-sm text-white placeholder:text-slate-600 w-full" />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="rounded-xl px-3 py-2 text-sm outline-none"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: '#94a3b8' }}>
          <option value="all">All Roles</option>
          <option value="member">Member</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
        {/* Table header */}
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 px-4 py-2.5 text-xs font-bold uppercase tracking-wider"
          style={{ background: 'rgba(255,255,255,0.04)', color: '#334155', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span>Member</span>
          <span className="text-right">Login</span>
          <span className="text-right">Logout</span>
          <span className="text-right">Duration</span>
          <span className="text-right">Status</span>
        </div>

        {loading ? (
          <div className="py-16 text-center" style={{ color: '#334155' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center" style={{ color: '#334155' }}>No login records found.</div>
        ) : (
          filtered.map((l, i) => {
            const rs = ROLE_STYLE[l.role] || ROLE_STYLE.member;
            const isActive = !l.logoutAt;
            return (
              <div key={l._id}
                className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 items-center px-4 py-3"
                style={{
                  borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  background: isActive ? 'rgba(96,165,250,0.04)' : 'transparent',
                }}>
                {/* Name + role */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: rs.bg, color: rs.color, border: `1px solid ${rs.border}` }}>
                    {rn(l.name)?.[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{rn(l.name)}</p>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                      style={{ background: rs.bg, color: rs.color, border: `1px solid ${rs.border}` }}>
                      {l.role}
                    </span>
                  </div>
                </div>

                {/* Login time */}
                <div className="text-right">
                  <p className="text-xs font-medium text-white">{fmtTime(l.loginAt)}</p>
                  <p className="text-[10px]" style={{ color: '#475569' }}>{fmtDate(l.loginAt)}</p>
                </div>

                {/* Logout time */}
                <div className="text-right">
                  {l.logoutAt ? (
                    <>
                      <p className="text-xs font-medium text-white">{fmtTime(l.logoutAt)}</p>
                      <p className="text-[10px]" style={{ color: '#475569' }}>{fmtDate(l.logoutAt)}</p>
                    </>
                  ) : (
                    <p className="text-xs" style={{ color: '#334155' }}>—</p>
                  )}
                </div>

                {/* Duration */}
                <div className="text-right">
                  <p className="text-xs font-semibold" style={{ color: l.duration ? '#94a3b8' : '#334155' }}>
                    {fmtDuration(l.duration)}
                  </p>
                </div>

                {/* Status */}
                <div className="text-right">
                  {isActive ? (
                    <span className="text-[10px] font-bold px-2 py-1 rounded-lg"
                      style={{ background: 'rgba(96,165,250,0.12)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.25)' }}>
                      Active
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-1 rounded-lg"
                      style={{ background: 'rgba(100,116,139,0.10)', color: '#475569', border: '1px solid rgba(100,116,139,0.18)' }}>
                      Ended
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {filtered.length > 0 && (
        <p className="text-center text-xs mt-3" style={{ color: '#1e293b' }}>
          Showing {filtered.length} of {logs.length} sessions
        </p>
      )}
    </div>
  );
}
