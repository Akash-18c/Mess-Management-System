import { useState, useEffect } from 'react';
import api from '../api';

/**
 * Returns the active mess period for the current user.
 * For managers: checks /member/active-months + /member/my-assignment
 * Returns: { period, loading }
 * period = { month, year, startDate, endDate } | null
 */
export default function useActivePeriod() {
  const [period,  setPeriod]  = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [activeRes, assignRes] = await Promise.all([
          api.get('/member/active-months').catch(() => ({ data: [] })),
          api.get('/member/my-assignment').catch(() => ({ data: null })),
        ]);
        if (cancelled) return;

        const activeMonths = Array.isArray(activeRes.data) ? activeRes.data : [];
        const assignment   = assignRes.data || null;

        // Prefer the open-month record (has startDate/endDate)
        if (activeMonths.length > 0) {
          const p = activeMonths[0];
          setPeriod({ month: p.month, year: p.year, startDate: p.startDate || null, endDate: p.endDate || null });
        } else if (assignment) {
          // Fallback: manager assigned but month not explicitly opened
          setPeriod({ month: assignment.month, year: assignment.year, startDate: null, endDate: null });
        } else {
          setPeriod(null);
        }
      } catch {
        if (!cancelled) setPeriod(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { period, loading };
}
