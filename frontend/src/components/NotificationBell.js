import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Bell, UtensilsCrossed, ShoppingCart, CreditCard, FileText, MessageSquare, Zap, CheckCheck, X } from 'lucide-react';
import api from '../api';

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
  if (diff < 60)  return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationBell({ accentColor = '#fbbf24' }) {
  const [notes,   setNotes]   = useState([]);
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);
  const btnRef   = useRef(null);

  const unread = notes.filter(n => !n.isRead).length;

  const load = useCallback(async () => {
    try {
      const r = await api.get('/notifications');
      setNotes(r.data);
    } catch { }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Poll every 30s
  useEffect(() => {
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  // Close on outside click
  useEffect(() => {
    const h = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target) &&
          btnRef.current   && !btnRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', h);
    document.addEventListener('touchstart', h, { passive: true });
    return () => { document.removeEventListener('mousedown', h); document.removeEventListener('touchstart', h); };
  }, []);

  const markAllRead = async () => {
    setLoading(true);
    try {
      await api.patch('/notifications/read-all');
      setNotes(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch { }
    finally { setLoading(false); }
  };

  const markOne = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotes(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch { }
  };

  return (
    <div className="relative" style={{ zIndex: 300 }}>
      {/* Bell button */}
      <button
        ref={btnRef}
        onClick={() => setOpen(o => !o)}
        className="relative flex items-center justify-center rounded-xl transition-all active:scale-95"
        style={{
          width: 38, height: 38,
          background: open ? `rgba(${accentColor === '#fbbf24' ? '251,191,36' : accentColor === '#34d399' ? '52,211,153' : '45,212,191'},0.15)` : 'rgba(255,255,255,0.06)',
          border: `1px solid ${open ? accentColor + '55' : 'rgba(255,255,255,0.10)'}`,
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <Bell size={17} style={{ color: open ? accentColor : '#94a3b8' }} />
        {unread > 0 && (
          <span className="absolute flex items-center justify-center font-bold"
            style={{
              top: -4, right: -4,
              minWidth: 17, height: 17,
              fontSize: 9,
              background: '#ef4444',
              color: '#fff',
              borderRadius: 999,
              border: '2px solid #070c1a',
              padding: '0 3px',
              lineHeight: 1,
            }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-full mt-2 flex flex-col"
          style={{
            width: 'min(360px, calc(100vw - 24px))',
            maxHeight: '80vh',
            background: 'rgba(6,10,22,0.98)',
            backdropFilter: 'blur(48px)',
            WebkitBackdropFilter: 'blur(48px)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 20,
            boxShadow: '0 24px 64px rgba(0,0,0,0.80), 0 0 0 1px rgba(255,255,255,0.04)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `rgba(${accentColor === '#fbbf24' ? '251,191,36' : '52,211,153'},0.15)`, border: `1px solid ${accentColor}44` }}>
                <Bell size={13} style={{ color: accentColor }} />
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-tight">Activity Feed</p>
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {unread > 0 ? `${unread} unread` : 'All caught up'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {unread > 0 && (
                <button onClick={markAllRead} disabled={loading}
                  className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg transition-all"
                  style={{ background: 'rgba(52,211,153,0.10)', border: '1px solid rgba(52,211,153,0.22)', color: '#34d399', WebkitTapHighlightColor: 'transparent', opacity: loading ? 0.6 : 1 }}>
                  <CheckCheck size={11} /> Read all
                </button>
              )}
              <button onClick={() => setOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', WebkitTapHighlightColor: 'transparent' }}>
                <X size={13} style={{ color: '#64748b' }} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}>
            {notes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <Bell size={20} style={{ color: '#334155' }} />
                </div>
                <p className="text-slate-600 text-sm font-medium">No activity yet</p>
                <p className="text-slate-700 text-xs">Actions by manager &amp; members appear here</p>
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
                    className="flex items-start gap-3 px-4 py-3 cursor-pointer transition-all"
                    style={{
                      borderBottom: i < notes.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                      background: n.isRead ? 'transparent' : 'rgba(255,255,255,0.025)',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    {/* Category icon */}
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: cat.bg, border: `1px solid ${cat.border}` }}>
                      <Icon size={14} style={{ color: cat.color }} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                          style={{ background: rc.bg, color: rc.text, border: `1px solid ${rc.border}` }}>
                          {n.actorName || n.actorRole}
                        </span>
                        {n.month && (
                          <span className="text-[9px] text-slate-600 font-medium">
                            {new Date(0, n.month - 1).toLocaleString('en', { month: 'short' })} {n.year}
                          </span>
                        )}
                      </div>
                      <p className="text-[12.5px] leading-snug" style={{ color: n.isRead ? 'rgba(255,255,255,0.50)' : 'rgba(255,255,255,0.85)' }}>
                        {n.message}
                      </p>
                      <p className="text-[10px] mt-1" style={{ color: '#334155' }}>{timeAgo(n.createdAt)}</p>
                    </div>

                    {/* Unread dot */}
                    {!n.isRead && (
                      <div className="w-2 h-2 rounded-full flex-shrink-0 mt-2"
                        style={{ background: accentColor, boxShadow: `0 0 6px ${accentColor}` }} />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notes.length > 0 && (
            <div className="px-4 py-2.5 flex-shrink-0 text-center"
              style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.20)' }}>
              <p className="text-[10px]" style={{ color: '#1e293b' }}>Showing last {notes.length} activities</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
