import { useEffect, useRef } from 'react';
import api from '../api';

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const rn = (name) => { const m = name?.match(/^\w+\s*\((.+)\)$/); return m ? m[1] : (name || ''); };

function buildWaUrl(phone, message) {
  const clean = phone.replace(/\D/g, '');
  const num = clean.startsWith('0') ? '91' + clean.slice(1) : clean.startsWith('91') ? clean : '91' + clean;
  return `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
}

function formatTime12h(time24) {
  const [hh, mm] = time24.split(':').map(Number);
  const period = hh >= 12 ? 'PM' : 'AM';
  const h = hh % 12 || 12;
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')} ${period}`;
}

function senderFooter(sender) {
  if (!sender) return '';
  const senderName = rn(sender.name || '');
  if (sender.role === 'admin') return `${senderName} *(Admin)*`;
  if (sender.role === 'manager') return `${senderName} *(Manager)*`;
  return senderName;
}

export function buildMessage(duty, isNightBefore = false, sender = null) {
  const name = rn(duty.memberId?.name || '');
  const day  = DAYS[duty.dayOfWeek];
  const meal = duty.meal === 'lunch' ? '☀️ Lunch' : '🌙 Dinner';
  const time = formatTime12h(duty.time);
  const footer = senderFooter(sender);
  const signOff = `— *The Messy Kitchen*${footer ? `\n${footer}` : ''}`;

  if (isNightBefore) {
    return `*🛒 MARKET DUTY ALERT*\n\n👋 Hello, *${name}*\nJust a heads-up — you have market duty *tomorrow morning*.\n\n📅 Day      : ${day}\n🍽 Meal     : ${meal}\n⏰ Time     : ${time}\n${duty.note ? `📝 Note     : ${duty.note}\n` : ''}\n*📋 Please ensure all required grocery items are purchased before the scheduled meal time.*\n\n*Your contribution helps keep our mess running smoothly. ❤️*\n\n${signOff}`;
  }
  return `*🛒 MARKET DUTY ALERT*\n\n👋 Hello, *${name}*\nIt's your scheduled turn to purchase today's groceries.\n\n📅 Day      : ${day}\n🍽 Meal     : ${meal}\n⏰ Time     : ${time}\n${duty.note ? `📝 Note     : ${duty.note}\n` : ''}\n*📋 Please ensure all required grocery items are purchased before the scheduled meal time.*\n\n*Your contribution helps keep our mess running smoothly. ❤️*\n\n${signOff}`;
}

export function buildWaLink(duty, isNightBefore = false, sender = null) {
  if (!duty.memberId?.phone) return null;
  return buildWaUrl(duty.memberId.phone, buildMessage(duty, isNightBefore, sender));
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
        const r = await api.get('/member/market-duty');
        duties = r.data || [];
      } catch { return; }

      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];

      duties.forEach(duty => {
        if (!duty.isActive || !duty.memberId?.phone) return;
        const [hh, mm] = duty.time.split(':').map(Number);
        const waUrl = buildWaLink(duty);
        const name  = rn(duty.memberId.name);
        const meal  = duty.meal === 'lunch' ? 'Lunch' : 'Dinner';

        // Day-of notification
        const delay = msUntilNext(duty.dayOfWeek, hh, mm);
        if (delay <= 2147483647) {
          const t = setTimeout(() => {
            if (Notification.permission === 'granted') {
              new Notification('🛒 Market Duty Reminder — The Messy Kitchen', {
                body: `${name} needs to buy groceries for ${meal} today!`,
                icon: '/messy-logo.png',
                tag: `duty-${duty._id}`,
              });
            }
            if (waUrl) window.open(waUrl, '_blank');
          }, delay);
          timersRef.current.push(t);
        }

        // Night-before notification at 21:00 for lunch duties
        if (duty.meal === 'lunch') {
          const prevDay = (duty.dayOfWeek - 1 + 7) % 7;
          const nightDelay = msUntilNext(prevDay, 21, 0);
          if (nightDelay <= 2147483647) {
            const waUrlNight = buildWaLink(duty, true);
            const tn = setTimeout(() => {
              if (Notification.permission === 'granted') {
                new Notification('🌙 Market Duty Tomorrow — The Messy Kitchen', {
                  body: `Reminder: ${name} has market duty tomorrow for Lunch!`,
                  icon: '/messy-logo.png',
                  tag: `duty-night-${duty._id}`,
                });
              }
              if (waUrlNight) window.open(waUrlNight, '_blank');
            }, nightDelay);
            timersRef.current.push(tn);
          }
        }
      });
    }

    setup();
    return () => {
      cancelled = true;
      timersRef.current.forEach(clearTimeout);
    };
  }, []);
}
