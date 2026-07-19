import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DancingScriptBold } from '../DancingScript-Bold-b64';

const MONTHS_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function rn(name) {
  const m = name?.match(/^\w+\s*\((.+)\)$/);
  return m ? m[1] : (name || '—');
}

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext('2d').drawImage(img, 0, 0);
      resolve({ dataUrl: canvas.toDataURL('image/png'), w: img.naturalWidth, h: img.naturalHeight });
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function generate({ bills, summary, month, year, managerName, rangeStart, rangeEnd }) {
  const mealRate = summary?.mealRate || 0;
  const monthLabel = `${MONTHS_FULL[month - 1]} ${year}`;
  const periodLabel = (rangeStart || rangeEnd)
    ? `${rangeStart ? new Date(rangeStart+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : '?'} – ${rangeEnd ? new Date(rangeEnd+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : '?'}`
    : monthLabel;

  return Promise.all([loadImage('/messy-logo.png'), loadImage('/Stamp.png')]).then(([logoData, stampData]) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const PW = doc.internal.pageSize.getWidth();
    const PH = doc.internal.pageSize.getHeight();

    // Register Dancing Script font
    doc.addFileToVFS('DancingScript-Bold.ttf', DancingScriptBold);
    doc.addFont('DancingScript-Bold.ttf', 'DancingScript', 'bold');

    doc.setFillColor(8, 14, 28);
    doc.rect(0, 0, PW, PH, 'F');

    doc.setFillColor(18, 28, 52);
    doc.rect(0, 0, PW, 38, 'F');

    if (logoData) {
      const lh = 22;
      const lw = (logoData.w / logoData.h) * lh;
      doc.addImage(logoData.dataUrl, 'PNG', 9, 4, lw, lh);
    }

    doc.setFont('DancingScript', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(251, 191, 36);
    doc.text('The Messy Kitchen', PW / 2, 13, { align: 'center' });

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(110, 231, 183);
    doc.setCharSpace(2.8);
    doc.text('MESS MEAL MANAGEMENT SYSTEM', PW / 2, 20, { align: 'center' });
    doc.setCharSpace(0);

    doc.setFontSize(12);
    doc.setFont('DancingScript', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(`Bills — ${monthLabel}`, PW / 2, 29, { align: 'center' });

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    if (periodLabel !== monthLabel) {
      doc.text(`Period: ${periodLabel}`, PW / 2, 34, { align: 'center' });
      if (managerName) doc.text(`Manager: ${managerName}`, PW / 2, 38.5, { align: 'center' });
      doc.text(`Generated: ${new Date().toLocaleString()}`, PW / 2, managerName ? 43 : 38.5, { align: 'center' });
    } else {
      if (managerName) doc.text(`Manager: ${managerName}`, PW / 2, 34, { align: 'center' });
      doc.text(`Generated: ${new Date().toLocaleString()}`, PW / 2, managerName ? 38.5 : 34, { align: 'center' });
    }

    const cardY = (rangeStart || rangeEnd || managerName) ? 52 : 44;
    const cards = [
      { label: 'Meal Rate',   value: `Rs ${mealRate.toFixed(2)}`,                   color: [52, 211, 153] },
      { label: 'Total Meals', value: String(summary?.totalMeals || 0),              color: [96, 165, 250] },
      { label: 'Grand Total', value: `Rs ${(summary?.grandTotal || 0).toFixed(2)}`, color: [251, 191, 36] },
      { label: 'Members',     value: String(bills.length),                          color: [167, 139, 250] },
    ];
    const cw = (PW - 20) / 4;
    cards.forEach((c, i) => {
      const cx = 10 + i * cw;
      doc.setFillColor(22, 35, 65);
      doc.roundedRect(cx, cardY, cw - 2, 18, 3, 3, 'F');
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(c.label, cx + (cw - 2) / 2, cardY + 6, { align: 'center' });
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...c.color);
      doc.text(c.value, cx + (cw - 2) / 2, cardY + 13.5, { align: 'center' });
    });

    const tableRows = bills.map((b) => {
      const due = b.dueAmount ?? 0;
      const mealCost = (b.mealCost ?? (b.mealCount || 0) * mealRate).toFixed(2);
      return [
        rn(b.memberId?.name),
        String(b.mealCount || 0),
        `Rs ${mealRate.toFixed(2)}`,
        `Rs ${mealCost}`,
        `Rs ${(b.gasCharge || 0).toFixed(2)}`,
        `Rs ${(b.otherSharedCharge || 0).toFixed(2)}`,
        `Rs ${(b.otherCharges || 0).toFixed(2)}`,
        `Rs ${(b.masiSalary || 0).toFixed(2)}`,
        `Rs ${(b.advance || 0).toFixed(2)}`,
        due > 0 ? `Rs ${due.toFixed(2)}` : `+Rs ${Math.abs(due).toFixed(2)}`,
      ];
    });

    autoTable(doc, {
      startY: cardY + 24,
      head: [['Member', 'Meals', 'Per Meal', 'Meal Cost', 'Gas', 'Other Exp', 'Other Chg', 'Masi', 'Advance', 'Due / Refund']],
      body: tableRows,
      theme: 'plain',
      styles: { font: 'helvetica', fontSize: 8.5, textColor: [226, 232, 240], cellPadding: { top: 3.5, bottom: 3.5, left: 3, right: 3 }, lineColor: [30, 45, 80], lineWidth: 0.25 },
      headStyles: { fillColor: [28, 42, 78], textColor: [148, 163, 184], fontStyle: 'bold', fontSize: 7.5, halign: 'center' },
      columnStyles: {
        0: { halign: 'left', fontStyle: 'bold', textColor: [255, 255, 255] },
        1: { halign: 'center' },
        2: { halign: 'right', textColor: [251, 191, 36] },
        3: { halign: 'right' },
        4: { halign: 'right', textColor: [251, 146, 60] },
        5: { halign: 'right', textColor: [251, 146, 60] },
        6: { halign: 'right', textColor: [244, 114, 182] },
        7: { halign: 'right', textColor: [148, 163, 184] },
        8: { halign: 'right', textColor: [74, 222, 128] },
        9: { halign: 'right' },
      },
      alternateRowStyles: { fillColor: [14, 22, 44] },
      bodyStyles: { fillColor: [10, 16, 34] },
      didParseCell(data) {
        if (data.section === 'body' && data.column.index === 9) {
          const v = String(data.cell.raw);
          data.cell.styles.textColor = v.startsWith('-') ? [52, 211, 153] : [248, 113, 113];
          data.cell.styles.fontStyle = 'bold';
        }
      },
      margin: { left: 10, right: 10 },
      tableLineColor: [30, 45, 80],
      tableLineWidth: 0.25,
    });

    const finalY = doc.lastAutoTable.finalY || (PH - 45);

    if (stampData) {
      const sh = 30;
      const sw = (stampData.w / stampData.h) * sh;
      doc.addImage(stampData.dataUrl, 'PNG', PW - sw - 12, Math.min(finalY + 10, PH - sh - 12), sw, sh);
    }

    doc.setDrawColor(30, 45, 80);
    doc.setLineWidth(0.3);
    doc.line(10, PH - 12, PW - 10, PH - 12);
    doc.setFontSize(9);
    doc.setFont('DancingScript', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('The Messy Kitchen', PW / 2, PH - 7, { align: 'center' });

    doc.save(`MessKit-Bills-${monthLabel.replace(' ', '-')}.pdf`);
  });
}

// Wraps in setTimeout so the UI loading state renders on mobile before the heavy work starts
export function downloadBillsPdf(args) {
  return new Promise((resolve, reject) => {
    setTimeout(() => generate(args).then(resolve).catch(reject), 80);
  });
}
