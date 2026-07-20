// Draws the guest report directly on Canvas 2D — fast, high quality, no html2canvas lag

const W = 900;          // canvas width (px at 1x — we'll scale ×2 for retina)
const SCALE = 2;
const PAD = 52;
const BG = '#0d1117';
const CARD_BG = '#161b27';
const BORDER = '#1e2a3a';
const AMBER = '#fbbf24';
const GREEN = '#34d399';
const PURPLE = '#a78bfa';
const MUTED = '#4b5563';
const SUBTLE = '#1e293b';
const WHITE = '#f1f5f9';
const GRAY = '#94a3b8';

function hex(color, alpha) {
  // convert hex + alpha to rgba string
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function pill(ctx, x, y, w, h, r, fill, stroke) {
  roundRect(ctx, x, y, w, h, r);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke(); }
}

function text(ctx, str, x, y, font, color, align = 'left', maxW) {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  if (maxW) ctx.fillText(str, x, y, maxW);
  else ctx.fillText(str, x, y);
}

function measureW(ctx, str, font) {
  ctx.font = font;
  return ctx.measureText(str).width;
}

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function fmtDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtNow() {
  const d = new Date();
  const date = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  return `${date}, ${time}`;
}

export async function downloadGuestReport(guest, managerName = '') {
  const sorted = [...guest.meals].sort((a, b) => (a.date > b.date ? 1 : -1));
  const tm = sorted.reduce((s, m) => s + (m.lunch ? 1 : 0) + (m.dinner ? 1 : 0), 0);
  const tc = sorted.reduce((s, m) => s + (m.charge || 0), 0);

  // ── Pre-load images ──────────────────────────────────────────────────────────
  const [logoImg, stampImg] = await Promise.all([
    loadImage('/messy-logo.png'),
    loadImage('/Stamp.png'),
  ]);

  // ── Calculate total height ───────────────────────────────────────────────────
  const HEADER_H    = 110;
  const GUEST_H     = 130 + (guest.phone || guest.note ? 28 : 0);
  const STATS_H     = 80;
  const SEC_LABEL_H = 36;
  const ENTRY_H     = 72;   // per meal entry row
  const FOOTER_H    = 80;
  const DIVIDER_H   = 1;

  const totalH =
    PAD +
    HEADER_H +
    16 +
    GUEST_H +
    16 +
    STATS_H +
    20 +
    SEC_LABEL_H +
    (sorted.length === 0 ? 60 : sorted.length * ENTRY_H + (sorted.length - 1) * DIVIDER_H) +
    20 +
    60 +   // grand total bar
    20 +
    FOOTER_H +
    PAD;

  // ── Create canvas ────────────────────────────────────────────────────────────
  const canvas = document.createElement('canvas');
  canvas.width  = W * SCALE;
  canvas.height = totalH * SCALE;
  const ctx = canvas.getContext('2d');
  ctx.scale(SCALE, SCALE);

  // ── Background ───────────────────────────────────────────────────────────────
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, totalH);

  // subtle top gradient strip
  const grad = ctx.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0, 'rgba(251,191,36,0.06)');
  grad.addColorStop(0.5, 'rgba(251,191,36,0.02)');
  grad.addColorStop(1, 'rgba(99,102,241,0.04)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, 180);

  let y = PAD;

  // ── HEADER ───────────────────────────────────────────────────────────────────
  // Logo
  if (logoImg) {
    roundRect(ctx, PAD, y, 72, 72, 16);
    ctx.save();
    ctx.clip();
    ctx.drawImage(logoImg, PAD, y, 72, 72);
    ctx.restore();
    // border
    roundRect(ctx, PAD, y, 72, 72, 16);
    ctx.strokeStyle = hex(AMBER, 0.25);
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Title block
  const tx = PAD + 72 + 20;
  text(ctx, 'Messy Kitchen', tx, y + 26, 'bold 28px "Segoe UI", sans-serif', AMBER);
  text(ctx, 'Guest Meal Report', tx, y + 52, '16px "Segoe UI", sans-serif', GRAY);

  // Right side: month/year badge
  const monthLabel = new Date(
    (sorted[0]?.date || new Date().toISOString()) + 'T00:00:00'
  ).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const badgeW = measureW(ctx, monthLabel, 'bold 13px "Segoe UI", sans-serif') + 28;
  pill(ctx, W - PAD - badgeW, y + 16, badgeW, 32, 8, hex(AMBER, 0.10), hex(AMBER, 0.30));
  text(ctx, monthLabel, W - PAD - badgeW / 2, y + 37, 'bold 13px "Segoe UI", sans-serif', AMBER, 'center');

  // Divider
  y += HEADER_H - 10;
  ctx.strokeStyle = BORDER;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(W - PAD, y); ctx.stroke();
  y += 20;

  // ── GUEST INFO CARD ──────────────────────────────────────────────────────────
  const gCardH = 100 + (guest.phone ? 26 : 0) + (guest.note ? 26 : 0);
  roundRect(ctx, PAD, y, W - PAD * 2, gCardH, 16);
  ctx.fillStyle = CARD_BG;
  ctx.fill();
  ctx.strokeStyle = hex(AMBER, 0.20);
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Avatar circle
  const cx = PAD + 36, cy = y + gCardH / 2;
  ctx.beginPath(); ctx.arc(cx, cy, 28, 0, Math.PI * 2);
  ctx.fillStyle = hex(AMBER, 0.12); ctx.fill();
  ctx.strokeStyle = hex(AMBER, 0.30); ctx.lineWidth = 1.5; ctx.stroke();
  text(ctx, guest.name[0].toUpperCase(), cx, cy + 10, 'bold 24px "Segoe UI", sans-serif', AMBER, 'center');

  // Name + details
  const gx = PAD + 80;
  let gy = y + 28;
  text(ctx, guest.name, gx, gy, 'bold 22px "Segoe UI", sans-serif', WHITE);
  gy += 26;
  if (guest.phone) {
    text(ctx, `📞  ${guest.phone}`, gx, gy, '14px "Segoe UI", sans-serif', GRAY);
    gy += 24;
  }
  if (guest.note) {
    text(ctx, `📝  ${guest.note}`, gx, gy, '14px "Segoe UI", sans-serif', GRAY);
    gy += 24;
  }
  if (guest.mealRate > 0) {
    text(ctx, `₹${guest.mealRate} / meal (default rate)`, gx, gy, '13px "Segoe UI", sans-serif', hex(AMBER, 0.70));
  }

  y += gCardH + 16;

  // ── STATS ROW ────────────────────────────────────────────────────────────────
  const stats = [
    { label: 'Total Meals', value: String(tm), color: AMBER },
    { label: 'Total Charge', value: `₹${tc.toFixed(2)}`, color: GREEN },
    { label: 'Entries', value: String(sorted.length), color: PURPLE },
  ];
  const statW = (W - PAD * 2 - 16 * 2) / 3;
  stats.forEach((s, i) => {
    const sx = PAD + i * (statW + 16);
    roundRect(ctx, sx, y, statW, 68, 12);
    ctx.fillStyle = CARD_BG; ctx.fill();
    ctx.strokeStyle = BORDER; ctx.lineWidth = 1; ctx.stroke();
    text(ctx, s.value, sx + statW / 2, y + 34, `bold 22px "Segoe UI", sans-serif`, s.color, 'center');
    text(ctx, s.label, sx + statW / 2, y + 56, `12px "Segoe UI", sans-serif`, MUTED, 'center');
  });

  y += 68 + 24;

  // ── SECTION LABEL ────────────────────────────────────────────────────────────
  text(ctx, 'MEAL ENTRIES', PAD, y + 14, 'bold 11px "Segoe UI", sans-serif', MUTED);
  // line
  ctx.strokeStyle = BORDER; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD + measureW(ctx, 'MEAL ENTRIES', 'bold 11px "Segoe UI", sans-serif') + 12, y + 9);
  ctx.lineTo(W - PAD, y + 9);
  ctx.stroke();
  y += SEC_LABEL_H;

  // ── MEAL ENTRIES ─────────────────────────────────────────────────────────────
  if (sorted.length === 0) {
    text(ctx, 'No meals recorded', W / 2, y + 30, '14px "Segoe UI", sans-serif', MUTED, 'center');
    y += 60;
  } else {
    sorted.forEach((m, i) => {
      const ey = y + i * ENTRY_H;

      // Row background (alternating)
      roundRect(ctx, PAD, ey, W - PAD * 2, ENTRY_H - 6, 12);
      ctx.fillStyle = i % 2 === 0 ? CARD_BG : hex('#1a2235', 1);
      ctx.fill();
      ctx.strokeStyle = BORDER; ctx.lineWidth = 1; ctx.stroke();

      // ── Date badge (left) ──
      const dateD = new Date(m.date + 'T00:00:00');
      const dayNum  = dateD.getDate();
      const dayName = dateD.toLocaleDateString('en-IN', { weekday: 'short' });
      const monName = dateD.toLocaleDateString('en-IN', { month: 'short' });

      const badgeX = PAD + 12, badgeY = ey + 8, badgeH = ENTRY_H - 22;
      roundRect(ctx, badgeX, badgeY, 52, badgeH, 10);
      ctx.fillStyle = hex(AMBER, 0.10); ctx.fill();
      ctx.strokeStyle = hex(AMBER, 0.22); ctx.lineWidth = 1; ctx.stroke();

      text(ctx, monName.toUpperCase(), badgeX + 26, badgeY + 16, 'bold 9px "Segoe UI", sans-serif', hex(AMBER, 0.70), 'center');
      text(ctx, String(dayNum), badgeX + 26, badgeY + 34, 'bold 20px "Segoe UI", sans-serif', AMBER, 'center');
      text(ctx, dayName, badgeX + 26, badgeY + 48, '9px "Segoe UI", sans-serif', MUTED, 'center');

      // ── Meal pills (middle) ──
      let px = PAD + 12 + 52 + 16;
      const pillY = ey + 14;

      if (m.lunch) {
        const lw = measureW(ctx, '☀ Lunch', 'bold 12px "Segoe UI", sans-serif') + 20;
        pill(ctx, px, pillY, lw, 26, 13, hex('#fbbf24', 0.12), hex('#fbbf24', 0.30));
        text(ctx, '☀ Lunch', px + lw / 2, pillY + 17, 'bold 12px "Segoe UI", sans-serif', AMBER, 'center');
        px += lw + 8;
      }
      if (m.dinner) {
        const dw = measureW(ctx, '🌙 Dinner', 'bold 12px "Segoe UI", sans-serif') + 20;
        pill(ctx, px, pillY, dw, 26, 13, hex('#a78bfa', 0.12), hex('#a78bfa', 0.30));
        text(ctx, '🌙 Dinner', px + dw / 2, pillY + 17, 'bold 12px "Segoe UI", sans-serif', PURPLE, 'center');
        px += dw + 8;
      }

      // Rate + note on second line
      let infoLine = '';
      if (m.customRate > 0) infoLine += `₹${m.customRate}/meal`;
      if (m.note) infoLine += (infoLine ? '  ·  ' : '') + m.note;
      if (infoLine) {
        text(ctx, infoLine, PAD + 12 + 52 + 16, ey + 50, '12px "Segoe UI", sans-serif', MUTED, 'left', W - PAD * 2 - 52 - 120);
      }

      // ── Charge (right) ──
      const chargeStr = `₹${(m.charge || 0).toFixed(2)}`;
      text(ctx, chargeStr, W - PAD - 12, ey + 36, 'bold 18px "Segoe UI", sans-serif', AMBER, 'right');
    });

    y += sorted.length * ENTRY_H + 8;
  }

  // ── GRAND TOTAL BAR ──────────────────────────────────────────────────────────
  roundRect(ctx, PAD, y, W - PAD * 2, 56, 14);
  const totalGrad = ctx.createLinearGradient(PAD, y, W - PAD, y);
  totalGrad.addColorStop(0, hex(AMBER, 0.14));
  totalGrad.addColorStop(1, hex(AMBER, 0.06));
  ctx.fillStyle = totalGrad; ctx.fill();
  ctx.strokeStyle = hex(AMBER, 0.30); ctx.lineWidth = 1.5; ctx.stroke();

  text(ctx, `${tm} Meals  ·  Grand Total`, PAD + 20, y + 34, 'bold 14px "Segoe UI", sans-serif', GRAY);
  text(ctx, `₹${tc.toFixed(2)}`, W - PAD - 20, y + 36, 'bold 24px "Segoe UI", sans-serif', AMBER, 'right');

  y += 56 + 24;

  // ── FOOTER ───────────────────────────────────────────────────────────────────
  ctx.strokeStyle = BORDER; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(W - PAD, y); ctx.stroke();
  y += 18;

  const genLine1 = `Generated: ${fmtNow()}`;
  const genLine2 = managerName ? `By: ${managerName}` : '';

  text(ctx, genLine1, PAD, y + 14, '12px "Segoe UI", sans-serif', MUTED);
  if (genLine2) text(ctx, genLine2, PAD, y + 34, '12px "Segoe UI", sans-serif', MUTED);

  // Stamp (bottom right)
  if (stampImg) {
    const sSize = 72;
    ctx.globalAlpha = 0.80;
    ctx.drawImage(stampImg, W - PAD - sSize, y - 4, sSize, sSize);
    ctx.globalAlpha = 1;
  }

  // ── Download ─────────────────────────────────────────────────────────────────
  const link = document.createElement('a');
  link.download = `${guest.name.replace(/\s+/g, '_')}_guest_report.jpg`;
  link.href = canvas.toDataURL('image/jpeg', 0.95);
  link.click();
}
