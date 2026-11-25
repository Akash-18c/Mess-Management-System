import React, { useEffect, useState } from 'react';
import { Clock, LogIn, Search, User, Wifi, WifiOff } from 'lucide-react';
import api from '../../api';

const rn = (name) => { const m = name?.match(/^\w+\s*\((.+)\)$/); return m ? m[1] : (name || ''); };

const ROLE_STYLE = {
  manager: { color: '#fbbf24', bg: 'rgba(251,191,36,0.18)', border: 'rgba(251,191,36,0.30)', glow: 'rgba(251,191,36,0.12)' },
  member:  { color: '#34d399', bg: 'rgba(52,211,153,0.18)',  border: 'rgba(52,211,153,0.30)',  glow: 'rgba(52,211,153,0.12)'  },
  admin:   { color: '#f87171', bg: 'rgba(248,113,113,0.18)', border: 'rgba(248,113,113,0.30)', glow: 'rgba(248,113,113,0.12)' },
};

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtTime(d) {
  return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}
function fmtDuration(secs) {
  if (!secs || secs < 0) return null;
  if (secs < 60) return `${secs}s`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ${secs % 60}s`;
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return `${h}h ${m}m`;
}

// Glass style constants
const glass = {
  card: {
    background: 'rgba(255,255,255,0.07)',
    backdropFilter: 'blur(32px)',
    WebkitBackdropFilter: 'blur(32px)',
    border: '1px solid rgba(255,255,255,0.13)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.12)',
  },
  stat: {
    background: 'rgba(255,255,255,0.08)',
    backdropFilter: 'blur(40px)',
    WebkitBackdropFilter: 'blur(40px)',
    border: '1px solid rgba(255,255,255,0.15)',
    boxShadow: '0 4px 24px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.18)',
  },
  input: {
    background: 'rgba(255,255,255,0.08)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.14)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.10)',
  },
};

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
    return (!search || name.includes(search.toLowerCase())) &&
           (roleFilter === 'all' || l.role === roleFilter);
  });

  const today       = new Date().toDateString();
  const todayCount  = logs.filter(l => new Date(l.loginAt).toDateString() === today).length;
  const activeNow   = logs.filter(l => !l.logoutAt).length;
  const uniqueUsers = new Set(logs.map(l => l.userId?.toString())).size;

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 0 40px' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.3px' }}>Login History</h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginTop: 4 }}>
          Track member sessions, activity time &amp; usage patterns
        </p>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: "Today's Logins", value: todayCount, color: '#34d399', Icon: LogIn },
          { label: 'Active Now',     value: activeNow,  color: '#60a5fa', Icon: Wifi  },
          { label: 'Unique Users',   value: uniqueUsers, color: '#fbbf24', Icon: User  },
        ].map(({ label, value, color, Icon }) => (
          <div key={label} style={{ ...glass.stat, borderRadius: 18, padding: '14px 16px', position: 'relative', overflow: 'hidden' }}>
            {/* top shine */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.30),transparent)' }} />
            <div style={{ width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${color}22`, border: `1px solid ${color}44`, marginBottom: 10 }}>
              <Icon size={15} style={{ color }} />
            </div>
            <p style={{ fontSize: 26, fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1 }}>{value}</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', marginTop: 4 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ ...glass.input, borderRadius: 14, display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px', flex: 1, minWidth: 160, height: 42 }}>
          <Search size={14} style={{ color: 'rgba(255,255,255,0.30)', flexShrink: 0 }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name…"
            style={{ background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 13, width: '100%' }}
          />
        </div>
        {/* Role filter */}
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          style={{ ...glass.input, borderRadius: 14, padding: '0 14px', height: 42, color: 'rgba(255,255,255,0.70)', fontSize: 13, outline: 'none', cursor: 'pointer', minWidth: 120 }}>
          <option value="all"     style={{ background: '#0f172a' }}>All Roles</option>
          <option value="member"  style={{ background: '#0f172a' }}>Member</option>
          <option value="manager" style={{ background: '#0f172a' }}>Manager</option>
          <option value="admin"   style={{ background: '#0f172a' }}>Admin</option>
        </select>
      </div>

      {/* ── Log Cards ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.20)', fontSize: 14 }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.18)', fontSize: 14 }}>No sessions found.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((l) => {
            const rs = ROLE_STYLE[l.role] || ROLE_STYLE.member;
            const isActive = !l.logoutAt;
            const dur = fmtDuration(l.duration);
            return (
              <div key={l._id} style={{
                ...glass.card,
                borderRadius: 18,
                padding: '14px 16px',
                position: 'relative',
                overflow: 'hidden',
                background: isActive
                  ? 'rgba(96,165,250,0.08)'
                  : 'rgba(255,255,255,0.05)',
                borderColor: isActive ? 'rgba(96,165,250,0.22)' : 'rgba(255,255,255,0.10)',
              }}>
                {/* top shine */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)' }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>

                  {/* Avatar */}
                  <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, flexShrink: 0, background: rs.bg, border: `1px solid ${rs.border}`, color: rs.color, boxShadow: `0 0 12px ${rs.glow}` }}>
                    {rn(l.name)?.[0]?.toUpperCase()}
                  </div>

                  {/* Name + role */}
                  <div style={{ flex: 1, minWidth: 100 }}>
                    <p style={{ color: '#fff', fontWeight: 700, fontSize: 14, margin: 0, lineHeight: 1.2 }}>{rn(l.name)}</p>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, background: rs.bg, color: rs.color, border: `1px solid ${rs.border}`, display: 'inline-block', marginTop: 4 }}>
                      {l.role}
                    </span>
                  </div>

                  {/* Time blocks */}
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>

                    {/* Login */}
                    <div style={{ textAlign: 'center', minWidth: 64 }}>
                      <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.30)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Login</p>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: '2px 0 0' }}>{fmtTime(l.loginAt)}</p>
                      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', margin: 0 }}>{fmtDate(l.loginAt)}</p>
                    </div>

                    {/* Logout */}
                    <div style={{ textAlign: 'center', minWidth: 64 }}>
                      <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.30)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Logout</p>
                      {l.logoutAt ? (
                        <>
                          <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: '2px 0 0' }}>{fmtTime(l.logoutAt)}</p>
                          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', margin: 0 }}>{fmtDate(l.logoutAt)}</p>
                        </>
                      ) : (
                        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.18)', margin: '2px 0 0' }}>—</p>
                      )}
                    </div>

                    {/* Duration */}
                    {dur && (
                      <div style={{ textAlign: 'center', minWidth: 52 }}>
                        <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.30)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Duration</p>
                        <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.70)', margin: '2px 0 0' }}>{dur}</p>
                      </div>
                    )}

                    {/* Status badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 20, background: isActive ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.06)', border: `1px solid ${isActive ? 'rgba(96,165,250,0.30)' : 'rgba(255,255,255,0.10)'}` }}>
                      {isActive
                        ? <><Wifi    size={11} style={{ color: '#60a5fa' }} /><span style={{ fontSize: 11, fontWeight: 700, color: '#60a5fa' }}>Active</span></>
                        : <><WifiOff size={11} style={{ color: 'rgba(255,255,255,0.25)' }} /><span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.30)' }}>Ended</span></>
                      }
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filtered.length > 0 && (
        <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.15)', marginTop: 16 }}>
          {filtered.length} of {logs.length} sessions
        </p>
      )}
    </div>
  );
}
