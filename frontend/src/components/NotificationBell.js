import React, { useEffect, useState, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { Bell, UtensilsCrossed, ShoppingCart, CreditCard, FileText, MessageSquare, Zap, CheckCheck, X } from 'lucide-react';
import api from '../api';

// Bell ring keyframe — injected once
if (!document.getElementById('bell-ring-style')) {
  const s = document.createElement('style');
  s.id = 'bell-ring-style';
  s.textContent = `
    @keyframes bellRing {
      0%,100%{transform:rotate(0deg)}
      10%{transform:rotate(18deg)}
      20%{transform:rotate(-16deg)}
      30%{transform:rotate(14deg)}
      40%{transform:rotate(-12deg)}
      50%{transform:rotate(8deg)}
      60%{transform:rotate(-6deg)}
      70%{transform:rotate(4deg)}
      80%{transform:rotate(-2deg)}
    }
    @keyframes bellGlow {
      0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0)}
      50%{box-shadow:0 0 0 5px rgba(239,68,68,0.18)}
    }
    .bell-ringing { animation: bellRing 0.9s ease-in-out infinite; transform-origin: top center; }
    .bell-btn-glow { animation: bellGlow 1.8s ease-in-out infinite; }
  `;
  document.head.appendChild(s);
}

const ICONS = {
  meal:    { icon: UtensilsCrossed, color: '#34d399', bg: 'rgba(52,211,153,0.15)',  border: 'rgba(52,211,153,0.25)'  },
  expense: { icon: ShoppingCart,    color: '#fbbf24', bg: 'rgba(251,191,36,0.15)',  border: 'rgba(251,191,36,0.25)'  },
  payment: { icon: CreditCard,      color: '#60a5fa', bg: 'rgba(96,165,250,0.15)',  border: 'rgba(96,165,250,0.25)'  },
  bill:    { icon: FileText,        color: '#c084fc', bg: 'rgba(192,132,252,0.15)', border: 'rgba(192,132,252,0.25)' },
  notice:  { icon: MessageSquare,   color: '#fb923c', bg: 'rgba(251,146,60,0.15)',  border: 'rgba(251,146,60,0.25)'  },
  general: { icon: Zap,             color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.20)' },
};

const ROLE_COLORS = {
  manager: { text: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.25)' },
  member:  { text: '#34d399', bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.25)'  },
};

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)   return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const PANEL_W = 340;
const PANEL_MAX_H = 480;

export default function NotificationBell({ accentColor = '#fbbf24' }) {
  const [notes,   setNotes]   = useState([]);
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0 });
  const btnRef   = useRef(null);
  const panelRef = useRef(null);

  const unread = notes.filter(n => !n.isRead).length;

  const load = useCallback(async () => {
    try { const r = await api.get('/notifications'); setNotes(r.data); } catch { }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);

  // Compute panel position from bell button rect
  const calcPos = useCallback(() => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const panelH = Math.min(PANEL_MAX_H, vh - rect.bottom - 12);

    // Prefer right-aligned to button; clamp so it never goes off-screen
    let left = rect.right - PANEL_W;
    if (left < 8) left = 8;
    if (left + PANEL_W > vw - 8) left = vw - PANEL_W - 8;

    setPanelPos({ top: rect.bottom + 8, left, maxHeight: panelH });
  }, []);

  const toggle = () => {
    if (!open) calcPos();
    setOpen(o => !o);
  };

  // Reposition on scroll/resize while open
  useEffect(() => {
    if (!open) return;
    const h = () => calcPos();
    window.addEventListener('scroll', h, true);
    window.addEventListener('resize', h);
    return () => { window.removeEventListener('scroll', h, true); window.removeEventListener('resize', h); };
  }, [open, calcPos]);

  // Close on outside click
  useEffect(() => {
    const h = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target) &&
          btnRef.current   && !btnRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    document.addEventListener('touchstart', h, { passive: true });
    return () => { document.removeEventListener('mousedown', h); document.removeEventListener('touchstart', h); };
  }, []);

  const markAllRead = async () => {
    setLoading(true);
    try { await api.patch('/notifications/read-all'); setNotes(prev => prev.map(n => ({ ...n, isRead: true }))); }
    catch { } finally { setLoading(false); }
  };

  const markOne = async (id) => {
    try { await api.patch(`/notifications/${id}/read`); setNotes(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n)); }
    catch { }
  };

  const accentRgb = accentColor === '#fbbf24' ? '251,191,36' : accentColor === '#34d399' ? '52,211,153' : '45,212,191';

  const panel = open && ReactDOM.createPortal(
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        top: panelPos.top,
        left: panelPos.left,
        width: Math.min(PANEL_W, window.innerWidth - 16),
        maxHeight: panelPos.maxHeight || PANEL_MAX_H,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(6,10,22,0.98)',
        backdropFilter: 'blur(48px)',
        WebkitBackdropFilter: 'blur(48px)',
        border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: 16,
        boxShadow: '0 24px 64px rgba(0,0,0,0.80), 0 0 0 1px rgba(255,255,255,0.04)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `rgba(${accentRgb},0.15)`, border: `1px solid ${accentColor}44`, flexShrink: 0 }}>
            <Bell size={13} style={{ color: accentColor }} />
          </div>
          <div>
            <p style={{ color: '#fff', fontWeight: 700, fontSize: 13, lineHeight: 1.2, margin: 0 }}>Activity Feed</p>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, margin: 0 }}>
              {unread > 0 ? `${unread} unread` : 'All caught up'}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {unread > 0 && (
            <button onClick={markAllRead} disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600, padding: '5px 10px', borderRadius: 8, background: 'rgba(52,211,153,0.10)', border: '1px solid rgba(52,211,153,0.22)', color: '#34d399', cursor: 'pointer', opacity: loading ? 0.6 : 1, WebkitTapHighlightColor: 'transparent' }}>
              <CheckCheck size={11} /> Read all
            </button>
          )}
          <button onClick={() => setOpen(false)}
            style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
            <X size={13} style={{ color: '#64748b' }} />
          </button>
        </div>
      </div>

      {/* List */}
      <div style={{ overflowY: 'auto', flex: 1, scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}>
        {notes.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', gap: 10 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Bell size={18} style={{ color: '#334155' }} />
            </div>
            <p style={{ color: '#475569', fontSize: 13, fontWeight: 500, margin: 0 }}>No activity yet</p>
            <p style={{ color: '#334155', fontSize: 11, margin: 0, textAlign: 'center' }}>Actions by manager &amp; members appear here</p>
          </div>
        ) : (
          notes.map((n, i) => {
            const cat  = ICONS[n.category] || ICONS.general;
            const Icon = cat.icon;
            const rc   = ROLE_COLORS[n.actorRole] || ROLE_COLORS.member;
            return (
              <div
                key={n._id}
                onClick={() => !n.isRead && markOne(n._id)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '10px 14px',
                  borderBottom: i < notes.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  background: n.isRead ? 'transparent' : 'rgba(255,255,255,0.025)',
                  cursor: n.isRead ? 'default' : 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {/* Category icon */}
                <div style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2, background: cat.bg, border: `1px solid ${cat.border}` }}>
                  <Icon size={14} style={{ color: cat.color }} />
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 3 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 6, background: rc.bg, color: rc.text, border: `1px solid ${rc.border}` }}>
                      {n.actorName || n.actorRole}
                    </span>
                    {n.month && (
                      <span style={{ fontSize: 9, color: '#475569', fontWeight: 500 }}>
                        {new Date(0, n.month - 1).toLocaleString('en', { month: 'short' })} {n.year}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 12, lineHeight: 1.45, margin: 0, color: n.isRead ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.85)', wordBreak: 'break-word' }}>
                    {n.message}
                  </p>
                  <p style={{ fontSize: 10, marginTop: 4, marginBottom: 0, color: '#334155' }}>{timeAgo(n.createdAt)}</p>
                </div>

                {/* Unread dot */}
                {!n.isRead && (
                  <div style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, marginTop: 6, background: accentColor, boxShadow: `0 0 6px ${accentColor}` }} />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {notes.length > 0 && (
        <div style={{ padding: '8px 14px', flexShrink: 0, textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.20)' }}>
          <p style={{ fontSize: 10, color: '#1e293b', margin: 0 }}>Showing last {notes.length} activities</p>
        </div>
      )}
    </div>,
    document.body
  );

  return (
    <div style={{ position: 'relative', zIndex: 300 }}>
      <button
        ref={btnRef}
        onClick={toggle}
        className={unread > 0 && !open ? 'bell-btn-glow' : ''}
        style={{
          position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 36, height: 36, borderRadius: 10,
          background: open ? `rgba(${accentRgb},0.15)` : 'rgba(255,255,255,0.06)',
          border: `1px solid ${open ? accentColor + '55' : unread > 0 ? 'rgba(239,68,68,0.35)' : 'rgba(255,255,255,0.10)'}`,
          cursor: 'pointer', transition: 'all 0.15s',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <Bell
          size={16}
          className={unread > 0 && !open ? 'bell-ringing' : ''}
          style={{ color: open ? accentColor : unread > 0 ? '#f87171' : '#94a3b8' }}
        />
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            minWidth: 16, height: 16, fontSize: 9, fontWeight: 700,
            background: '#ef4444', color: '#fff', borderRadius: 999,
            border: '2px solid #070c1a', padding: '0 3px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {panel}
    </div>
  );
}
