import { useEffect, useRef } from 'react';
import { CalendarDays, Clock3, Download, Moon, Timer, Truck } from 'lucide-react';

const TEMPLATE_SRC = '/blank-paper-log.png';

const STATUS_ROWS = {
  off_duty: 0,
  sleeper_berth: 1,
  driving: 2,
  on_duty_not_driving: 3,
};

const STATUS_LABELS = ['1. Off Duty', '2. Sleeper\n   Berth', '3. Driving', '4. On Duty\n   (Not Driving)'];
const STATUS_KEYS = ['off_duty', 'sleeper_berth', 'driving', 'on_duty_not_driving'];

const DISPLAY_LOG = {
  gridLeft: 130,
  gridTop: 75,
  rowHeight: 44,
  rows: 4,
  totalHours: 24,
  hourWidth: 32,
  get gridWidth() {
    return this.totalHours * this.hourWidth;
  },
  get gridHeight() {
    return this.rows * this.rowHeight;
  },
  get canvasWidth() {
    return this.gridLeft + this.gridWidth + 150;
  },
  get canvasHeight() {
    return this.gridTop + this.gridHeight + 50;
  },
};

const PAPER_LOG = {
  canvasWidth: 1026,
  canvasHeight: 1036,
  gridLeft: 112,
  gridTop: 370,
  rowHeight: 36,
  totalHours: 24,
  hourWidth: 796 / 24,
};

const LINE_COLORS = {
  off_duty: '#2563eb',
  sleeper_berth: '#64748b',
  driving: '#0d9488',
  on_duty_not_driving: '#9a8748',
};

const ROW_BGS = [
  'rgba(37, 99, 235, 0.06)',
  'rgba(100, 116, 139, 0.06)',
  'rgba(13, 148, 136, 0.08)',
  'rgba(154, 135, 72, 0.1)',
];

function loadTemplateImage() {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = TEMPLATE_SRC;
  });
}

function write(ctx, text, x, y, options = {}) {
  const {
    align = 'left',
    color = '#0f172a',
    maxWidth,
    size = 18,
    weight = '600',
  } = options;

  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Inter", Arial, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(String(text ?? ''), x, y, maxWidth);
  ctx.restore();
}

function wrapLine(ctx, text, x, y, maxWidth, lineHeight, maxY) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  let line = '';

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      if (y > maxY) return y;
      ctx.fillText(line, x, y);
      y += lineHeight;
      line = word;
    } else {
      line = next;
    }
  }

  if (line && y <= maxY) {
    ctx.fillText(line, x, y);
    y += lineHeight;
  }

  return y;
}

function drawDutyLines(ctx, entries, metrics, options = {}) {
  const {
    horizontalWidth = 3,
    verticalWidth = 2.5,
  } = options;

  ctx.lineCap = 'butt';
  ctx.lineJoin = 'miter';

  let prevRow = null;

  for (const entry of entries || []) {
    const rowIdx = STATUS_ROWS[entry.status];
    if (rowIdx === undefined) continue;

    const startHour = Math.max(0, Math.min(metrics.totalHours, Number(entry.start_hour) || 0));
    const endHour = Math.max(0, Math.min(metrics.totalHours, Number(entry.end_hour) || 0));
    const x1 = metrics.gridLeft + startHour * metrics.hourWidth;
    const x2 = metrics.gridLeft + endHour * metrics.hourWidth;
    const y = metrics.gridTop + rowIdx * metrics.rowHeight + metrics.rowHeight / 2;

    if (prevRow !== null && prevRow !== rowIdx) {
      const prevY = metrics.gridTop + prevRow * metrics.rowHeight + metrics.rowHeight / 2;
      ctx.beginPath();
      ctx.strokeStyle = LINE_COLORS[entry.status];
      ctx.lineWidth = verticalWidth;
      ctx.moveTo(x1, prevY);
      ctx.lineTo(x1, y);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.strokeStyle = LINE_COLORS[entry.status];
    ctx.lineWidth = horizontalWidth;
    ctx.moveTo(x1, y);
    ctx.lineTo(x2, y);
    ctx.stroke();

    prevRow = rowIdx;
  }
}

function drawDisplayLogGrid(ctx, log, dayNumber) {
  const m = DISPLAY_LOG;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, m.canvasWidth, m.canvasHeight);

  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, m.canvasWidth, 32);
  ctx.beginPath();
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.moveTo(0, 32);
  ctx.lineTo(m.canvasWidth, 32);
  ctx.stroke();

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 12px "Inter", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText("DRIVER'S DAILY LOG", 12, 20);

  ctx.font = '11px "Inter", system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillStyle = '#475569';
  ctx.fillText(`Day ${dayNumber}  |  ${log.date_display}  |  ${log.total_miles} miles driven`, m.canvasWidth - 12, 20);

  for (let row = 0; row < m.rows; row += 1) {
    const y = m.gridTop + row * m.rowHeight;
    ctx.fillStyle = ROW_BGS[row];
    ctx.fillRect(m.gridLeft, y, m.gridWidth, m.rowHeight);
  }

  for (let row = 0; row <= m.rows; row += 1) {
    const y = m.gridTop + row * m.rowHeight;
    ctx.beginPath();
    ctx.strokeStyle = row === 0 || row === m.rows ? '#cbd5e1' : '#e2e8f0';
    ctx.lineWidth = row === 0 || row === m.rows ? 1.5 : 0.8;
    ctx.moveTo(m.gridLeft, y);
    ctx.lineTo(m.gridLeft + m.gridWidth, y);
    ctx.stroke();
  }

  for (let h = 0; h <= m.totalHours; h += 1) {
    const x = m.gridLeft + h * m.hourWidth;
    const isMajor = h === 0 || h === 12 || h === 24;
    ctx.beginPath();
    ctx.strokeStyle = isMajor ? '#cbd5e1' : '#e5e7eb';
    ctx.lineWidth = isMajor ? 1.5 : 0.8;
    ctx.moveTo(x, m.gridTop);
    ctx.lineTo(x, m.gridTop + m.gridHeight);
    ctx.stroke();
  }

  for (let h = 0; h < m.totalHours; h += 1) {
    for (let q = 1; q <= 3; q += 1) {
      const x = m.gridLeft + h * m.hourWidth + (q * m.hourWidth) / 4;
      const tickLen = q === 2 ? 6 : 3;
      for (let row = 0; row < m.rows; row += 1) {
        const rowMid = m.gridTop + row * m.rowHeight + m.rowHeight / 2;
        ctx.beginPath();
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 0.5;
        ctx.moveTo(x, rowMid - tickLen);
        ctx.lineTo(x, rowMid + tickLen);
        ctx.stroke();
      }
    }
  }

  ctx.fillStyle = '#64748b';
  ctx.font = '9px "Inter", system-ui, sans-serif';
  ctx.textAlign = 'center';

  const hourLabels = [
    'Mid-\nnight', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11',
    'Noon', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', 'Mid-\nnight',
  ];

  for (let h = 0; h <= m.totalHours; h += 1) {
    const x = m.gridLeft + h * m.hourWidth;
    const lines = hourLabels[h].split('\n');
    lines.forEach((line, lineIndex) => {
      ctx.fillText(line, x, m.gridTop - 10 + lineIndex * 10);
    });
  }

  ctx.textAlign = 'right';
  ctx.fillStyle = '#475569';

  STATUS_LABELS.forEach((label, index) => {
    const y = m.gridTop + index * m.rowHeight + m.rowHeight / 2;
    const lines = label.split('\n');
    const startY = y - (lines.length - 1) * 6;
    lines.forEach((line, lineIndex) => {
      ctx.font = lineIndex === 0 ? 'bold 10px "Inter", system-ui, sans-serif' : '9px "Inter", system-ui, sans-serif';
      ctx.fillText(line.trim(), m.gridLeft - 8, startY + lineIndex * 12);
    });
  });

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(m.gridLeft + m.gridWidth, m.gridTop, 65, m.gridHeight);
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(m.gridLeft + m.gridWidth, m.gridTop, 65, m.gridHeight);

  ctx.textAlign = 'center';
  ctx.font = 'bold 9px "Inter", system-ui, sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText('Total', m.gridLeft + m.gridWidth + 32, m.gridTop - 14);
  ctx.fillText('Hours', m.gridLeft + m.gridWidth + 32, m.gridTop - 4);

  const totals = log.total_hours || {};
  STATUS_KEYS.forEach((key, index) => {
    const y = m.gridTop + index * m.rowHeight + m.rowHeight / 2 + 5;

    if (index > 0) {
      ctx.beginPath();
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 0.5;
      ctx.moveTo(m.gridLeft + m.gridWidth, m.gridTop + index * m.rowHeight);
      ctx.lineTo(m.gridLeft + m.gridWidth + 65, m.gridTop + index * m.rowHeight);
      ctx.stroke();
    }

    ctx.font = 'bold 13px "Inter", system-ui, sans-serif';
    ctx.fillStyle = LINE_COLORS[key];
    ctx.fillText((totals[key] || 0).toFixed(1), m.gridLeft + m.gridWidth + 32, y);
  });

  drawDutyLines(ctx, log.entries || [], m);
}

function drawPaperTotals(ctx, log) {
  const totals = log.total_hours || {};

  STATUS_KEYS.forEach((key, index) => {
    const y = PAPER_LOG.gridTop + index * PAPER_LOG.rowHeight + PAPER_LOG.rowHeight / 2 + 7;
    write(ctx, (totals[key] || 0).toFixed(1), 960, y, {
      align: 'center',
      color: LINE_COLORS[key],
      size: 18,
      weight: '700',
    });
  });
}

function drawPaperRemarks(ctx, log) {
  const remarks = log.remarks || [];
  if (remarks.length === 0) return;

  ctx.save();
  ctx.fillStyle = '#0f172a';
  ctx.font = '600 14px "Inter", Arial, sans-serif';

  let y = 578;
  const maxY = 642;
  for (const remark of remarks.slice(0, 8)) {
    if (y > maxY) break;
    y = wrapLine(ctx, remark, 48, y, 890, 17, maxY);
  }

  ctx.restore();
}

function drawFallbackPaperLog(ctx, log, dayNumber) {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, PAPER_LOG.canvasWidth, PAPER_LOG.canvasHeight);
  write(ctx, "Driver's Daily Log", 40, 60, { size: 32, weight: '700' });
  write(ctx, `Day ${dayNumber} - ${log.total_miles || 0} mi`, 40, 98, {
    color: '#475569',
    size: 20,
  });
  drawDutyLines(ctx, log.entries || [], PAPER_LOG, { horizontalWidth: 5, verticalWidth: 4 });
  drawPaperTotals(ctx, log);
  drawPaperRemarks(ctx, log);
}

function drawPaperLog(ctx, templateImage, log, dayNumber) {
  ctx.clearRect(0, 0, PAPER_LOG.canvasWidth, PAPER_LOG.canvasHeight);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, PAPER_LOG.canvasWidth, PAPER_LOG.canvasHeight);
  ctx.drawImage(templateImage, 0, 0, PAPER_LOG.canvasWidth, PAPER_LOG.canvasHeight);
  drawDutyLines(ctx, log.entries || [], PAPER_LOG, { horizontalWidth: 5, verticalWidth: 4 });
  drawPaperTotals(ctx, log);
  drawPaperRemarks(ctx, log);
  write(ctx, `Day ${dayNumber}`, 914, 55, {
    align: 'right',
    color: '#475569',
    size: 14,
    weight: '700',
  });
}

function renderDisplayLogToCanvas(canvas, log, dayNumber, pixelRatio = window.devicePixelRatio || 1) {
  canvas.width = DISPLAY_LOG.canvasWidth * pixelRatio;
  canvas.height = DISPLAY_LOG.canvasHeight * pixelRatio;
  canvas.style.width = '100%';
  canvas.style.height = 'auto';

  const ctx = canvas.getContext('2d');
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  drawDisplayLogGrid(ctx, log, dayNumber);
}

async function renderPaperLogToCanvas(canvas, log, dayNumber, pixelRatio = 2) {
  canvas.width = PAPER_LOG.canvasWidth * pixelRatio;
  canvas.height = PAPER_LOG.canvasHeight * pixelRatio;

  const ctx = canvas.getContext('2d');
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

  try {
    const templateImage = await loadTemplateImage();
    drawPaperLog(ctx, templateImage, log, dayNumber);
  } catch {
    drawFallbackPaperLog(ctx, log, dayNumber);
  }
}

function dataUrlToBytes(dataUrl) {
  const base64 = dataUrl.split(',')[1];
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

function createPdfBlobFromCanvas(canvas) {
  const imageBytes = dataUrlToBytes(canvas.toDataURL('image/jpeg', 0.94));
  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 32;
  const imageRatio = canvas.width / canvas.height;
  let drawWidth = pageWidth - margin * 2;
  let drawHeight = drawWidth / imageRatio;

  if (drawHeight > pageHeight - margin * 2) {
    drawHeight = pageHeight - margin * 2;
    drawWidth = drawHeight * imageRatio;
  }

  const x = (pageWidth - drawWidth) / 2;
  const y = (pageHeight - drawHeight) / 2;
  const content = `q\n${drawWidth.toFixed(2)} 0 0 ${drawHeight.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm\n/Im0 Do\nQ`;
  const encoder = new TextEncoder();
  const chunks = [];
  const offsets = [];
  let length = 0;

  const addString = (value) => {
    chunks.push(value);
    length += encoder.encode(value).length;
  };
  const addBytes = (value) => {
    chunks.push(value);
    length += value.length;
  };
  const addObject = (id, bodyParts) => {
    offsets[id] = length;
    addString(`${id} 0 obj\n`);
    for (const part of bodyParts) {
      if (typeof part === 'string') addString(part);
      else addBytes(part);
    }
    addString('\nendobj\n');
  };

  addString('%PDF-1.4\n%\n');
  addObject(1, ['<< /Type /Catalog /Pages 2 0 R >>']);
  addObject(2, ['<< /Type /Pages /Kids [3 0 R] /Count 1 >>']);
  addObject(3, [
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] `,
    '/Resources << /XObject << /Im0 5 0 R >> >> /Contents 4 0 R >>',
  ]);
  addObject(4, [`<< /Length ${content.length} >>\nstream\n${content}\nendstream`]);
  addObject(5, [
    `<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} `,
    `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageBytes.length} >>\nstream\n`,
    imageBytes,
    '\nendstream',
  ]);

  const xrefOffset = length;
  addString('xref\n0 6\n0000000000 65535 f \n');
  for (let i = 1; i <= 5; i += 1) {
    addString(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`);
  }
  addString(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

  return new Blob(chunks, { type: 'application/pdf' });
}

export default function DailyLogSheet({ log, dayNumber }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    renderDisplayLogToCanvas(canvas, log, dayNumber);
  }, [log, dayNumber]);

  const handleDownload = async () => {
    const pdfWindow = window.open('', '_blank');
    if (pdfWindow) {
      pdfWindow.document.title = `ELD Log Day ${dayNumber}`;
      pdfWindow.document.body.textContent = 'Preparing log PDF...';
    }

    const exportCanvas = document.createElement('canvas');
    await renderPaperLogToCanvas(exportCanvas, log, dayNumber);
    const pdfBlob = createPdfBlobFromCanvas(exportCanvas);
    const pdfUrl = URL.createObjectURL(pdfBlob);

    if (pdfWindow) {
      pdfWindow.location.href = pdfUrl;
    } else {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `eld-log-day-${dayNumber}.pdf`;
      link.click();
    }

    window.setTimeout(() => URL.revokeObjectURL(pdfUrl), 60000);
  };

  const hos = log.hos_summary;

  return (
    <article className="dashboard-card overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_52px_rgba(15,23,42,0.09)]">
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold theme-blue-accent">
            <CalendarDays size={16} aria-hidden="true" />
            {log.date_display}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h3 className="text-xl font-semibold text-slate-950">
              Day {dayNumber} - {log.total_miles > 0 ? `${log.total_miles} mi` : 'No driving'}
            </h3>
            <button
              type="button"
              onClick={handleDownload}
              aria-label={`Download day ${dayNumber} log PDF`}
              title="Download log PDF"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700 transition hover:-translate-y-0.5 hover:bg-blue-100"
            >
              <Download size={14} aria-hidden="true" />
            </button>
          </div>
          <p className="mt-1 text-sm text-slate-500">Generated ELD daily duty-status grid</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:justify-end">
          <span className="status-pill duty-pill-off">OFF {log.total_hours?.off_duty?.toFixed(1)}h</span>
          <span className="status-pill duty-pill-sleeper">SB {log.total_hours?.sleeper_berth?.toFixed(1)}h</span>
          <span className="status-pill duty-pill-driving">D {log.total_hours?.driving?.toFixed(1)}h</span>
          <span className="status-pill duty-pill-on-duty">ON {log.total_hours?.on_duty_not_driving?.toFixed(1)}h</span>
        </div>
      </div>

      {hos && (
        <div className="grid gap-4 px-5 pb-5 sm:grid-cols-2 sm:px-6">
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <Truck size={16} aria-hidden="true" />
                Calendar-day driving
              </span>
              <span className="text-sm font-semibold tabular-nums text-slate-900">{hos.driving_hours.toFixed(1)}h</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full progress-driving transition-all duration-500"
                style={{ width: `${Math.min(100, (hos.driving_hours / 24) * 100)}%` }}
              />
            </div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <Clock3 size={16} aria-hidden="true" />
                Calendar-day on-duty
              </span>
              <span className="text-sm font-semibold tabular-nums text-slate-900">{hos.on_duty_hours.toFixed(1)}h</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full progress-on-duty transition-all duration-500"
                style={{ width: `${Math.min(100, (hos.on_duty_hours / 24) * 100)}%` }}
              />
            </div>
          </div>
          {hos.driving_hours > 11.01 && (
            <div className="rounded-2xl bg-blue-50 px-4 py-3 text-center text-sm font-medium text-blue-700 sm:col-span-2">
              Spans multiple shifts - per-shift limits verified in sidebar
            </div>
          )}
        </div>
      )}

      <div className="overflow-hidden bg-slate-50 px-5 py-5 sm:px-6">
        <canvas
          ref={canvasRef}
          className="block h-auto w-full rounded-2xl bg-white shadow-[0_12px_32px_rgba(15,23,42,0.08)]"
        />
      </div>

      {log.remarks && log.remarks.length > 0 && (
        <div className="p-5 sm:p-6">
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Timer size={16} aria-hidden="true" />
            Remarks
          </h4>
          <ul className="space-y-2">
            {log.remarks.slice(0, 10).map((remark, index) => (
              <li key={index} className="flex gap-2 text-sm leading-6 text-slate-600">
                <Moon className="mt-1 shrink-0 text-slate-300" size={14} aria-hidden="true" />
                <span>{remark}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
