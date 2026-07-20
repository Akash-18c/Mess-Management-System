const W     = 860;
const SCALE = 3;          // 3× for crisp images and text
const PAD   = 48;

const BG      = '#0d1117';
const CARD_BG = '#161c28';
const BORDER  = '#1e2d40';
const AMBER   = '#fbbf24';
const GREEN   = '#34d399';
const PURPLE  = '#a78bfa';
const MUTED   = '#4b5869';
const WHITE   = '#f0f4f8';
const GRAY    = '#8899aa';

function rgba(hex, a) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${a})`;
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.lineTo(x+w-r, y); ctx.quadraticCurveTo(x+w, y,   x+w, y+r);
  ctx.lineTo(x+w, y+h-r); ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
  ctx.lineTo(x+r, y+h); ctx.quadraticCurveTo(x,   y+h, x,   y+h-r);
  ctx.lineTo(x, y+r); ctx.quadraticCurveTo(x,   y,   x+r, y);
  ctx.closePath();
}

function fillRect(ctx, x, y, w, h, r, fill, stroke, sw=1) {
  rr(ctx, x, y, w, h, r);
  if (fill)   { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = sw; ctx.stroke(); }
}

function txt(ctx, s, x, y, font, color, align='left', maxW) {
  ctx.font      = font;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  maxW ? ctx.fillText(s, x, y, maxW) : ctx.fillText(s, x, y);
}

function mw(ctx, s, font) {
  ctx.font = font;
  return ctx.measureText(s).width;
}

function loadImg(src) {
  return new Promise(res => {
    const i = new Image();
    i.crossOrigin = 'anonymous';
    i.onload  = () => res(i);
    i.onerror = () => res(null);
    i.src = src;
  });
}

function fmtNow() {
  const d    = new Date();
  const date = d.toLocaleDateString('en-IN',  { day:'numeric', month:'short', year:'numeric' });
  const time = d.toLocaleTimeString('en-IN',  { hour:'2-digit', minute:'2-digit', hour12:true });
  return `${date}  •  ${time}`;
}

// Draw a clipped rounded-rect image (sharp, no blur)
function drawRoundImage(ctx, img, x, y, w, h, r) {
  ctx.save();
  rr(ctx, x, y, w, h, r);
  ctx.clip();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, x, y, w, h);
  ctx.restore();
}

export async function downloadGuestReport(guest, managerName = '') {
  const sorted = [...guest.meals].sort((a,b) => a.date > b.date ? 1 : -1);
  const tm = sorted.reduce((s,m) => s + (m.lunch?1:0) + (m.dinner?1:0), 0);
  const tc = sorted.reduce((s,m) => s + (m.charge||0), 0);

  const [logoImg, stampImg] = await Promise.all([
    loadImg('/messy-logo.png'),
    loadImg('/Stamp.png'),
  ]);

  // ── Fixed row heights ────────────────────────────────────────────────────────
  const HDR_H    = 100;   // logo + title
  const DIV_H    = 24;    // divider gap
  // Guest card: base + optional lines
  const GC_BASE  = 36 + 28 + 8;   // top-pad + name + gap
  const GC_LINE  = 26;             // per extra line (phone, note, rate)
  const gcLines  = (guest.phone?1:0) + (guest.note?1:0) + (guest.mealRate>0?1:0);
  const GC_H     = GC_BASE + gcLines * GC_LINE + 20; // +20 bottom pad
  const STATS_H  = 76;
  const SL_H     = 32;   // section label
  const ENTRY_H  = 76;   // each meal row (enough for 2 lines)
  const TOTAL_H  = 60;
  const FOOT_H   = 88;

  const totalH =
    PAD + HDR_H + DIV_H +
    GC_H + 18 +
    STATS_H + 22 +
    SL_H +
    (sorted.length === 0 ? 56 : sorted.length * ENTRY_H + 8) +
    TOTAL_H + 20 +
    FOOT_H + PAD;

  const canvas  = document.createElement('canvas');
  canvas.width  = W * SCALE;
  canvas.height = totalH * SCALE;
  const ctx = canvas.getContext('2d');
  ctx.scale(SCALE, SCALE);

  // ── Background ───────────────────────────────────────────────────────────────
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, totalH);

  // top amber glow strip
  const grd = ctx.createLinearGradient(0,0,W,0);
  grd.addColorStop(0,   rgba(AMBER, 0.07));
  grd.addColorStop(0.6, rgba(AMBER, 0.02));
  grd.addColorStop(1,   rgba(PURPLE,0.03));
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, W, 160);

  let y = PAD;

  // ── HEADER ───────────────────────────────────────────────────────────────────
  const LOGO = 72;
  if (logoImg) {
    drawRoundImage(ctx, logoImg, PAD, y, LOGO, LOGO, 16);
    // crisp border ring
    rr(ctx, PAD, y, LOGO, LOGO, 16);
    ctx.strokeStyle = rgba(AMBER, 0.35);
    ctx.lineWidth   = 2;
    ctx.stroke();
  }

  const tx = PAD + LOGO + 18;
  txt(ctx, 'Messy Kitchen',   tx, y + 30, 'bold 30px "Segoe UI",sans-serif', AMBER);
  txt(ctx, 'Guest Meal Report', tx, y + 56, '15px "Segoe UI",sans-serif',    GRAY);

  // month badge — right aligned
  const monthLabel = new Date(
    ((sorted[0]?.date || new Date().toISOString().slice(0,10)) + 'T00:00:00')
  ).toLocaleDateString('en-IN', { month:'long', year:'numeric' });
  const mbFont = 'bold 13px "Segoe UI",sans-serif';
  const mbW    = mw(ctx, monthLabel, mbFont) + 28;
  const mbX    = W - PAD - mbW;
  const mbY    = y + 20;
  fillRect(ctx, mbX, mbY, mbW, 30, 8, rgba(AMBER,0.10), rgba(AMBER,0.30), 1.5);
  txt(ctx, monthLabel, mbX + mbW/2, mbY + 20, mbFont, AMBER, 'center');

  // divider
  y += HDR_H;
  ctx.strokeStyle = BORDER; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(W-PAD, y); ctx.stroke();
  y += DIV_H;

  // ── GUEST INFO CARD ──────────────────────────────────────────────────────────
  fillRect(ctx, PAD, y, W-PAD*2, GC_H, 16, CARD_BG, rgba(AMBER,0.22), 1.5);

  // Avatar
  const AVR = 28;
  const avCX = PAD + 20 + AVR;
  const avCY = y + GC_H/2;
  ctx.beginPath(); ctx.arc(avCX, avCY, AVR, 0, Math.PI*2);
  ctx.fillStyle = rgba(AMBER,0.13); ctx.fill();
  ctx.strokeStyle = rgba(AMBER,0.35); ctx.lineWidth = 1.5; ctx.stroke();
  txt(ctx, guest.name[0].toUpperCase(), avCX, avCY + 9,
      'bold 26px "Segoe UI",sans-serif', AMBER, 'center');

  // Text block — starts at top of card + 36px top pad
  const gx  = PAD + 20 + AVR*2 + 18;
  let   gy  = y + 36;

  txt(ctx, guest.name, gx, gy, 'bold 22px "Segoe UI",sans-serif', WHITE);
  gy += GC_LINE + 4;

  if (guest.phone) {
    txt(ctx, `\uD83D\uDCDE  ${guest.phone}`, gx, gy, '14px "Segoe UI",sans-serif', GRAY);
    gy += GC_LINE;
  }
  if (guest.note) {
    txt(ctx, `\uD83D\uDCDD  ${guest.note}`, gx, gy, '14px "Segoe UI",sans-serif', GRAY);
    gy += GC_LINE;
  }
  if (guest.mealRate > 0) {
    txt(ctx, `\u20B9${guest.mealRate} / meal  (default rate)`, gx, gy,
        '13px "Segoe UI",sans-serif', rgba(AMBER,0.75));
  }

  y += GC_H + 18;

  // ── STATS ROW ────────────────────────────────────────────────────────────────
  const stats = [
    { label:'Total Meals',  val: String(tm),          color: AMBER  },
    { label:'Total Charge', val: `\u20B9${tc.toFixed(2)}`, color: GREEN  },
    { label:'Day Entries',  val: String(sorted.length), color: PURPLE },
  ];
  const gap  = 14;
  const sW   = (W - PAD*2 - gap*2) / 3;
  stats.forEach((s, i) => {
    const sx = PAD + i*(sW+gap);
    fillRect(ctx, sx, y, sW, STATS_H, 12, CARD_BG, BORDER, 1);
    txt(ctx, s.val,   sx+sW/2, y+36, 'bold 24px "Segoe UI",sans-serif', s.color,  'center');
    txt(ctx, s.label, sx+sW/2, y+58, '12px "Segoe UI",sans-serif',      MUTED,    'center');
  });

  y += STATS_H + 22;

  // ── SECTION LABEL ────────────────────────────────────────────────────────────
  const slFont = 'bold 10px "Segoe UI",sans-serif';
  const slTxt  = 'MEAL ENTRIES';
  txt(ctx, slTxt, PAD, y+14, slFont, MUTED);
  const slLineX = PAD + mw(ctx, slTxt, slFont) + 10;
  ctx.strokeStyle = BORDER; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(slLineX, y+9); ctx.lineTo(W-PAD, y+9); ctx.stroke();
  y += SL_H;

  // ── MEAL ENTRIES ─────────────────────────────────────────────────────────────
  if (sorted.length === 0) {
    txt(ctx, 'No meals recorded', W/2, y+28, '14px "Segoe UI",sans-serif', MUTED, 'center');
    y += 56;
  } else {
    sorted.forEach((m, i) => {
      const ey  = y + i * ENTRY_H;
      const ROW = ENTRY_H - 8;   // actual drawn height (8px gap between rows)

      // row card
      fillRect(ctx, PAD, ey, W-PAD*2, ROW, 12,
        i%2===0 ? CARD_BG : '#131a26',
        BORDER, 1);

      // ── Date badge ──────────────────────────────────────────────────────────
      const dateD  = new Date(m.date + 'T00:00:00');
      const dayNum = dateD.getDate();
      const dayNm  = dateD.toLocaleDateString('en-IN', { weekday:'short' });
      const monNm  = dateD.toLocaleDateString('en-IN', { month:'short' }).toUpperCase();

      const BDG_W = 54, BDG_H = ROW - 16;
      const bdgX  = PAD + 12;
      const bdgY  = ey + 8;

      fillRect(ctx, bdgX, bdgY, BDG_W, BDG_H, 10,
        rgba(AMBER,0.10), rgba(AMBER,0.25), 1);

      // month text
      txt(ctx, monNm,        bdgX+BDG_W/2, bdgY+14,
          'bold 9px "Segoe UI",sans-serif', rgba(AMBER,0.65), 'center');
      // day number
      txt(ctx, String(dayNum), bdgX+BDG_W/2, bdgY+34,
          'bold 22px "Segoe UI",sans-serif', AMBER, 'center');
      // weekday
      txt(ctx, dayNm,        bdgX+BDG_W/2, bdgY+BDG_H-6,
          '9px "Segoe UI",sans-serif', MUTED, 'center');

      // ── Meal pills ──────────────────────────────────────────────────────────
      const PILL_H  = 26;
      const PILL_Y  = ey + (ROW/2) - PILL_H - 4;   // upper half of row
      let   px      = PAD + 12 + BDG_W + 16;

      const LUNCH_LABEL  = '\u2600 Lunch';
      const DINNER_LABEL = '\uD83C\uDF19 Dinner';
      const pillFont     = 'bold 12px "Segoe UI",sans-serif';

      if (m.lunch) {
        const pw = mw(ctx, LUNCH_LABEL, pillFont) + 22;
        fillRect(ctx, px, PILL_Y, pw, PILL_H, 13,
          rgba('#fbbf24',0.13), rgba('#fbbf24',0.32), 1.5);
        txt(ctx, LUNCH_LABEL, px+pw/2, PILL_Y+17, pillFont, AMBER, 'center');
        px += pw + 10;
      }
      if (m.dinner) {
        const pw = mw(ctx, DINNER_LABEL, pillFont) + 22;
        fillRect(ctx, px, PILL_Y, pw, PILL_H, 13,
          rgba('#a78bfa',0.13), rgba('#a78bfa',0.32), 1.5);
        txt(ctx, DINNER_LABEL, px+pw/2, PILL_Y+17, pillFont, PURPLE, 'center');
      }

      // ── Info line (rate · note) — below pills ────────────────────────────────
      const INFO_Y = PILL_Y + PILL_H + 10;
      let   info   = '';
      if (m.customRate > 0) info += `\u20B9${m.customRate}/meal`;
      if (m.note)           info += (info ? '  \u00B7  ' : '') + m.note;
      if (info) {
        txt(ctx, info, PAD+12+BDG_W+16, INFO_Y+12,
            '12px "Segoe UI",sans-serif', MUTED, 'left',
            W - PAD*2 - BDG_W - 100);
      }

      // ── Charge — right ───────────────────────────────────────────────────────
      txt(ctx, `\u20B9${(m.charge||0).toFixed(2)}`,
          W-PAD-14, ey + ROW/2 + 8,
          'bold 18px "Segoe UI",sans-serif', AMBER, 'right');
    });

    y += sorted.length * ENTRY_H + 8;
  }

  // ── GRAND TOTAL ───────────────────────────────────────────────────────────────
  const tg = ctx.createLinearGradient(PAD, y, W-PAD, y);
  tg.addColorStop(0, rgba(AMBER,0.15));
  tg.addColorStop(1, rgba(AMBER,0.05));
  fillRect(ctx, PAD, y, W-PAD*2, TOTAL_H, 14, null, rgba(AMBER,0.30), 1.5);
  ctx.fillStyle = tg; rr(ctx, PAD, y, W-PAD*2, TOTAL_H, 14); ctx.fill();
  // re-stroke after fill
  rr(ctx, PAD, y, W-PAD*2, TOTAL_H, 14);
  ctx.strokeStyle = rgba(AMBER,0.30); ctx.lineWidth = 1.5; ctx.stroke();

  txt(ctx, `${tm} Meals  \u00B7  Grand Total`,
      PAD+20, y+TOTAL_H/2+6, 'bold 14px "Segoe UI",sans-serif', GRAY);
  txt(ctx, `\u20B9${tc.toFixed(2)}`,
      W-PAD-20, y+TOTAL_H/2+8, 'bold 26px "Segoe UI",sans-serif', AMBER, 'right');

  y += TOTAL_H + 20;

  // ── FOOTER ───────────────────────────────────────────────────────────────────
  ctx.strokeStyle = BORDER; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(W-PAD, y); ctx.stroke();
  y += 20;

  txt(ctx, `Generated: ${fmtNow()}`,
      PAD, y+16, '12px "Segoe UI",sans-serif', MUTED);
  if (managerName) {
    txt(ctx, `By: ${managerName}`,
        PAD, y+38, '12px "Segoe UI",sans-serif', MUTED);
  }

  // Stamp — drawn large and sharp
  if (stampImg) {
    const SS = 80;
    ctx.globalAlpha = 0.88;
    ctx.imageSmoothingEnabled  = true;
    ctx.imageSmoothingQuality  = 'high';
    ctx.drawImage(stampImg, W-PAD-SS, y-6, SS, SS);
    ctx.globalAlpha = 1;
  }

  // ── Save ─────────────────────────────────────────────────────────────────────
  const link = document.createElement('a');
  link.download = `${guest.name.replace(/\s+/g,'_')}_guest_report.jpg`;
  link.href     = canvas.toDataURL('image/jpeg', 0.96);
  link.click();
}
