import html2canvas from 'html2canvas';

function totalMeals(g) { return g.meals.reduce((s, m) => s + (m.lunch ? 1 : 0) + (m.dinner ? 1 : 0), 0); }
function totalCharge(g) { return g.meals.reduce((s, m) => s + (m.charge || 0), 0); }

export async function downloadGuestReport(guest) {
  const sorted = [...guest.meals].sort((a, b) => a.date > b.date ? 1 : -1);
  const tm = totalMeals(guest);
  const tc = totalCharge(guest);

  const div = document.createElement('div');
  div.style.cssText = `
    position:fixed; left:-9999px; top:0;
    width:420px; background:#0f1623; font-family:'Segoe UI',sans-serif;
    padding:28px 24px 24px; border-radius:16px; color:#fff;
  `;

  div.innerHTML = `
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid rgba(255,255,255,0.12)">
      <img src="/messy-logo.png" style="width:52px;height:52px;border-radius:12px;object-fit:cover" crossorigin="anonymous" />
      <div>
        <div style="font-size:18px;font-weight:800;color:#fbbf24;letter-spacing:-0.3px">Messy Kitchen</div>
        <div style="font-size:11px;color:#64748b;margin-top:2px">Guest Meal Report</div>
      </div>
    </div>

    <div style="background:rgba(245,158,11,0.10);border:1px solid rgba(245,158,11,0.25);border-radius:12px;padding:14px 16px;margin-bottom:18px">
      <div style="font-size:20px;font-weight:800;color:#fff">${guest.name}</div>
      ${guest.phone ? `<div style="font-size:12px;color:#94a3b8;margin-top:3px">📞 ${guest.phone}</div>` : ''}
      ${guest.note ? `<div style="font-size:12px;color:#94a3b8;margin-top:3px">📝 ${guest.note}</div>` : ''}
      <div style="display:flex;gap:16px;margin-top:10px">
        <div style="background:rgba(255,255,255,0.06);border-radius:8px;padding:8px 14px;text-align:center">
          <div style="font-size:18px;font-weight:800;color:#fbbf24">${tm}</div>
          <div style="font-size:10px;color:#64748b;margin-top:1px">Total Meals</div>
        </div>
        <div style="background:rgba(255,255,255,0.06);border-radius:8px;padding:8px 14px;text-align:center">
          <div style="font-size:18px;font-weight:800;color:#34d399">₹${tc.toFixed(2)}</div>
          <div style="font-size:10px;color:#64748b;margin-top:1px">Total Charge</div>
        </div>
        ${guest.mealRate > 0 ? `<div style="background:rgba(255,255,255,0.06);border-radius:8px;padding:8px 14px;text-align:center">
          <div style="font-size:18px;font-weight:800;color:#a78bfa">₹${guest.mealRate}</div>
          <div style="font-size:10px;color:#64748b;margin-top:1px">Rate/Meal</div>
        </div>` : ''}
      </div>
    </div>

    <div style="font-size:10px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px">Meal Entries</div>
    <div style="border:1px solid rgba(255,255,255,0.08);border-radius:12px;overflow:hidden">
      ${sorted.length === 0
        ? `<div style="padding:16px;text-align:center;color:#475569;font-size:12px">No meals recorded</div>`
        : sorted.map((m, i) => `
        <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;${i > 0 ? 'border-top:1px solid rgba(255,255,255,0.06)' : ''};background:${i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'}">
          <div style="flex:1">
            <div style="font-size:13px;font-weight:600;color:#e2e8f0">
              ${new Date(m.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
            <div style="display:flex;gap:6px;margin-top:4px;flex-wrap:wrap">
              ${m.lunch ? `<span style="font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px;background:rgba(251,191,36,0.15);color:#fbbf24;border:1px solid rgba(251,191,36,0.25)">☀️ Lunch</span>` : ''}
              ${m.dinner ? `<span style="font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px;background:rgba(99,102,241,0.15);color:#a78bfa;border:1px solid rgba(99,102,241,0.25)">🌙 Dinner</span>` : ''}
              ${m.customRate > 0 ? `<span style="font-size:10px;color:#64748b">₹${m.customRate}/meal</span>` : ''}
              ${m.note ? `<span style="font-size:10px;color:#94a3b8;font-style:italic">📝 ${m.note}</span>` : ''}
            </div>
          </div>
          <div style="font-size:14px;font-weight:800;color:#fbbf24;flex-shrink:0">₹${(m.charge || 0).toFixed(2)}</div>
        </div>`).join('')}
    </div>

    <div style="display:flex;align-items:center;justify-content:space-between;margin-top:14px;padding:12px 16px;background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.20);border-radius:12px">
      <span style="font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px">${tm} Meals · Grand Total</span>
      <span style="font-size:18px;font-weight:800;color:#fbbf24">₹${tc.toFixed(2)}</span>
    </div>

    <div style="display:flex;align-items:center;justify-content:space-between;margin-top:18px;padding-top:14px;border-top:1px solid rgba(255,255,255,0.08)">
      <div style="font-size:10px;color:#334155">Generated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
      <img src="/Stamp.png" style="width:56px;height:56px;object-fit:contain;opacity:0.85" crossorigin="anonymous" />
    </div>
  `;

  document.body.appendChild(div);

  try {
    const canvas = await html2canvas(div, {
      backgroundColor: '#0f1623',
      scale: 2,
      useCORS: true,
      logging: false,
    });
    const link = document.createElement('a');
    link.download = `${guest.name.replace(/\s+/g, '_')}_guest_report.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.92);
    link.click();
  } finally {
    document.body.removeChild(div);
  }
}
