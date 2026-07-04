import { useEffect, useRef } from 'react';
import api from '../api';

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const rn = (name) => { const m = name?.match(/^\w+\s*\((.+)\)$/); return m ? m[1] : (name || ''); };

function buildWaUrl(phone, message) {
  const clean = phone.replace(/\D/g, '');
  const num = clean.startsWith('0') ? '91' + clean.slice(1) : clean.startsWith('91') ? clean : '91' + clean;
  return `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
}

export function buildMessage(duty) {
  const name = rn(duty.memberId?.name || '');
  const day  = DAYS[duty.dayOfWeek];
  const meal = duty.meal === 'lunch' ? '☀️ Lunch' : '🌙 Dinner';
  return `🛒 *Market Duty Reminder*\n\nHey ${name}! 👋\nIt's your turn to buy groceries today.\n\n📅 Day: ${day}\n🍽 Meal: ${meal}\n⏰ Time: ${duty.time}\n${duty.note ? `📝 Note: ${duty.note}\n` : ''}\nPlease make sure to buy everything on time! 🙏\n\n— The Messy Kitchen 🍳`;
}

export function buildWaLink(duty) {
  if (!duty.memberId?.phone) return null;
  return buildWaUrl(duty.memberId.phone, buildMessage(duty));
}

async function requestPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const r = await Notification.requestPermission();
  return r === 'granted';
}

function msUntilNext(dayOfWeek, hh, mm) {
  const now = new Date();
  const fire = new Date(now);
  fire.setHours(hh, mm, 0, 0);
  let daysUntil = (dayOfWeek - now.getDay() + 7) % 7;
  if (daysUntil === 0 && fire <= now) daysUntil = 7;
  fire.setDate(now.getDate() + daysUntil);
  return fire - now;
}

export default function useMarketDutyNotifier() {
  const timersRef = useRef([]);

  useEffect(() => {
    let cancelled = false;

    async function setup() {
      const granted = await requestPermission();
      if (!granted || cancelled) return;

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
      }

      let duties = [];
      try {
        const r = await api.get('/admin/market-duty');
        duties = r.data || [];
      } catch { return; }

      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];

      duties.forEach(duty => {
        if (!duty.isActive || !duty.memberId?.phone) return;
        const [hh, mm] = duty.time.split(':').map(Number);
        const delay = msUntilNext(duty.dayOfWeek, hh, mm);
        if (delay > 2147483647) return;

        const waUrl = buildWaLink(duty);
        const name  = rn(duty.memberId.name);
        const meal  = duty.meal === 'lunch' ? 'Lunch' : 'Dinner';

        const t = setTimeout(() => {
          if (Notification.permission === 'granted') {
            new Notification('🛒 Market Duty Reminder — The Messy Kitchen', {
              body: `${name} needs to buy groceries for ${meal} today! Tap to send WhatsApp.`,
              icon: '/messy-logo.png',
              tag: `duty-${duty._id}`,
            });
          }
          if (waUrl) window.open(waUrl, '_blank');
        }, delay);

        timersRef.current.push(t);
      });
    }

    setup();
    return () => {
      cancelled = true;
      timersRef.current.forEach(clearTimeout);
    };
  }, []);
}
