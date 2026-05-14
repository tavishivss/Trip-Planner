import { useRef, useEffect } from 'react';
import { CalendarDays, Clock3, Moon, Timer, Truck } from 'lucide-react';

const STATUS_ROWS = {
  off_duty: 0,
  sleeper_berth: 1,
  driving: 2,
  on_duty_not_driving: 3,
};

const STATUS_LABELS = ['1. Off Duty', '2. Sleeper\n   Berth', '3. Driving', '4. On Duty\n   (Not Driving)'];

const GRID_LEFT = 130;
const GRID_TOP = 55;
const ROW_HEIGHT = 44;
const GRID_ROWS = 4;
const TOTAL_HOURS = 24;
const HOUR_WIDTH = 32;
const GRID_WIDTH = TOTAL_HOURS * HOUR_WIDTH;
const GRID_HEIGHT = GRID_ROWS * ROW_HEIGHT;
const CANVAS_WIDTH = GRID_LEFT + GRID_WIDTH + 80;
const CANVAS_HEIGHT = GRID_TOP + GRID_HEIGHT + 50;
const REMARKS_HEIGHT = 60;
const TOTAL_CANVAS_HEIGHT = CANVAS_HEIGHT + REMARKS_HEIGHT;

const LINE_COLORS = {
  off_duty: '#2563eb',
  sleeper_berth: '#64748b',
  driving: '#dc2626',
  on_duty_not_driving: '#d97706',
};

const ROW_BGS = [
  'rgba(37, 99, 235, 0.06)',
  'rgba(100, 116, 139, 0.06)',
  'rgba(220, 38, 38, 0.07)',
  'rgba(217, 119, 6, 0.07)',
];

function drawLogGrid(ctx, log, dayNumber) {
  const dpr = window.devicePixelRatio || 1;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, CANVAS_WIDTH * dpr, TOTAL_CANVAS_HEIGHT * dpr);

  ctx.save();
  ctx.scale(dpr, dpr);

  // Title bar
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, CANVAS_WIDTH, 32);
  ctx.beginPath();
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.moveTo(0, 32);
  ctx.lineTo(CANVAS_WIDTH, 32);
  ctx.stroke();

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 12px "Inter", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`DRIVER'S DAILY LOG`, 12, 20);

  ctx.font = '11px "Inter", system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillStyle = '#475569';
  ctx.fillText(`Day ${dayNumber}  |  ${log.date_display}  |  ${log.total_miles} miles driven`, CANVAS_WIDTH - 12, 20);

  // Row backgrounds
  for (let row = 0; row < GRID_ROWS; row++) {
    const y = GRID_TOP + row * ROW_HEIGHT;
    ctx.fillStyle = ROW_BGS[row];
    ctx.fillRect(GRID_LEFT, y, GRID_WIDTH, ROW_HEIGHT);
  }

  // Grid lines - horizontal
  for (let row = 0; row <= GRID_ROWS; row++) {
    const y = GRID_TOP + row * ROW_HEIGHT;
    ctx.beginPath();
    ctx.strokeStyle = row === 0 || row === GRID_ROWS ? '#cbd5e1' : '#e2e8f0';
    ctx.lineWidth = row === 0 || row === GRID_ROWS ? 1.5 : 0.8;
    ctx.moveTo(GRID_LEFT, y);
    ctx.lineTo(GRID_LEFT + GRID_WIDTH, y);
    ctx.stroke();
  }

  // Vertical lines - hours
  for (let h = 0; h <= TOTAL_HOURS; h++) {
    const x = GRID_LEFT + h * HOUR_WIDTH;
    const isMajor = h === 0 || h === 12 || h === 24;
    ctx.beginPath();
    ctx.strokeStyle = isMajor ? '#cbd5e1' : '#e5e7eb';
    ctx.lineWidth = isMajor ? 1.5 : 0.8;
    ctx.moveTo(x, GRID_TOP);
    ctx.lineTo(x, GRID_TOP + GRID_HEIGHT);
    ctx.stroke();
  }

  // Quarter-hour tick marks
  for (let h = 0; h < TOTAL_HOURS; h++) {
    for (let q = 1; q <= 3; q++) {
      const x = GRID_LEFT + h * HOUR_WIDTH + (q * HOUR_WIDTH / 4);
      const tickLen = q === 2 ? 6 : 3;
      for (let row = 0; row < GRID_ROWS; row++) {
        const rowMid = GRID_TOP + row * ROW_HEIGHT + ROW_HEIGHT / 2;
        ctx.beginPath();
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 0.5;
        ctx.moveTo(x, rowMid - tickLen);
        ctx.lineTo(x, rowMid + tickLen);
        ctx.stroke();
      }
    }
  }

  // Hour labels at top
  ctx.fillStyle = '#64748b';
  ctx.font = '9px "Inter", system-ui, sans-serif';
  ctx.textAlign = 'center';

  const hourLabels = [
    'Mid-\nnight', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11',
    'Noon', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', 'Mid-\nnight'
  ];

  for (let h = 0; h <= TOTAL_HOURS; h++) {
    const x = GRID_LEFT + h * HOUR_WIDTH;
    const label = hourLabels[h];
    const lines = label.split('\n');
    lines.forEach((line, li) => {
      ctx.fillText(line, x, GRID_TOP - 10 + li * 10);
    });
  }

  // Row labels
  ctx.textAlign = 'right';
  ctx.fillStyle = '#475569';

  STATUS_LABELS.forEach((label, i) => {
    const y = GRID_TOP + i * ROW_HEIGHT + ROW_HEIGHT / 2;
    const lines = label.split('\n');
    const startY = y - ((lines.length - 1) * 6);
    lines.forEach((line, li) => {
      ctx.font = li === 0 ? 'bold 10px "Inter", system-ui, sans-serif' : '9px "Inter", system-ui, sans-serif';
      ctx.fillText(line.trim(), GRID_LEFT - 8, startY + li * 12);
    });
  });

  // Total hours column
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(GRID_LEFT + GRID_WIDTH, GRID_TOP, 65, GRID_HEIGHT);
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(GRID_LEFT + GRID_WIDTH, GRID_TOP, 65, GRID_HEIGHT);

  ctx.textAlign = 'center';
  ctx.font = 'bold 9px "Inter", system-ui, sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText('Total', GRID_LEFT + GRID_WIDTH + 32, GRID_TOP - 14);
  ctx.fillText('Hours', GRID_LEFT + GRID_WIDTH + 32, GRID_TOP - 4);

  const totals = log.total_hours || {};
  const statusKeys = ['off_duty', 'sleeper_berth', 'driving', 'on_duty_not_driving'];
  statusKeys.forEach((key, i) => {
    const y = GRID_TOP + i * ROW_HEIGHT + ROW_HEIGHT / 2 + 5;
    const val = totals[key] || 0;

    if (i > 0) {
      ctx.beginPath();
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 0.5;
      ctx.moveTo(GRID_LEFT + GRID_WIDTH, GRID_TOP + i * ROW_HEIGHT);
      ctx.lineTo(GRID_LEFT + GRID_WIDTH + 65, GRID_TOP + i * ROW_HEIGHT);
      ctx.stroke();
    }

    ctx.font = 'bold 13px "Inter", system-ui, sans-serif';
    ctx.fillStyle = LINE_COLORS[key];
    ctx.fillText(val.toFixed(1), GRID_LEFT + GRID_WIDTH + 32, y);
  });

  // Draw duty status lines
  if (log.entries && log.entries.length > 0) {
    drawDutyLines(ctx, log.entries);
  }

  // Remarks section
  const remarksY = CANVAS_HEIGHT - 10;
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, remarksY, CANVAS_WIDTH, REMARKS_HEIGHT);
  ctx.beginPath();
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.moveTo(0, remarksY);
  ctx.lineTo(CANVAS_WIDTH, remarksY);
  ctx.stroke();

  ctx.fillStyle = '#475569';
  ctx.font = 'bold 10px "Inter", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('REMARKS', 12, remarksY + 16);

  if (log.remarks && log.remarks.length > 0) {
    ctx.font = '9px "Inter", system-ui, sans-serif';
    ctx.fillStyle = '#64748b';
    const maxRemarks = Math.min(log.remarks.length, 3);
    for (let i = 0; i < maxRemarks; i++) {
      const text = log.remarks[i].length > 90 ? log.remarks[i].substring(0, 87) + '...' : log.remarks[i];
      ctx.fillText(text, 12, remarksY + 30 + i * 13);
    }
  }

  ctx.restore();
}

function drawDutyLines(ctx, entries) {
  ctx.lineCap = 'butt';
  ctx.lineJoin = 'miter';

  let prevRow = null;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const rowIdx = STATUS_ROWS[entry.status];
    if (rowIdx === undefined) continue;

    const startHour = entry.start_hour;
    const endHour = entry.end_hour;

    const x1 = GRID_LEFT + startHour * HOUR_WIDTH;
    const x2 = GRID_LEFT + endHour * HOUR_WIDTH;
    const y = GRID_TOP + rowIdx * ROW_HEIGHT + ROW_HEIGHT / 2;

    if (prevRow !== null && prevRow !== rowIdx) {
      const prevY = GRID_TOP + prevRow * ROW_HEIGHT + ROW_HEIGHT / 2;
      ctx.beginPath();
      ctx.strokeStyle = LINE_COLORS[entry.status];
      ctx.lineWidth = 2.5;
      ctx.moveTo(x1, prevY);
      ctx.lineTo(x1, y);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.strokeStyle = LINE_COLORS[entry.status];
    ctx.lineWidth = 3;
    ctx.moveTo(x1, y);
    ctx.lineTo(x2, y);
    ctx.stroke();

    prevRow = rowIdx;
  }
}

export default function DailyLogSheet({ log, dayNumber }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_WIDTH * dpr;
    canvas.height = TOTAL_CANVAS_HEIGHT * dpr;
    canvas.style.width = `${CANVAS_WIDTH}px`;
    canvas.style.height = `${TOTAL_CANVAS_HEIGHT}px`;

    const ctx = canvas.getContext('2d');
    drawLogGrid(ctx, log, dayNumber);
  }, [log, dayNumber]);

  const hos = log.hos_summary;

  return (
    <article className="dashboard-card overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_52px_rgba(15,23,42,0.09)]">
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-blue-700">
            <CalendarDays size={16} aria-hidden="true" />
            {log.date_display}
          </div>
          <h3 className="mt-2 text-xl font-semibold text-slate-950">
            Day {dayNumber} - {log.total_miles > 0 ? `${log.total_miles} mi` : 'No driving'}
          </h3>
          <p className="mt-1 text-sm text-slate-500">Generated ELD daily duty-status grid</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:justify-end">
          <span className="status-pill bg-blue-50 text-blue-700">OFF {log.total_hours?.off_duty?.toFixed(1)}h</span>
          <span className="status-pill bg-slate-100 text-slate-600">SB {log.total_hours?.sleeper_berth?.toFixed(1)}h</span>
          <span className="status-pill bg-red-50 text-red-700">D {log.total_hours?.driving?.toFixed(1)}h</span>
          <span className="status-pill bg-amber-50 text-amber-700">ON {log.total_hours?.on_duty_not_driving?.toFixed(1)}h</span>
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
                className="h-full rounded-full bg-red-600 transition-all duration-500"
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
                className="h-full rounded-full bg-amber-600 transition-all duration-500"
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

      <div className="overflow-x-auto bg-slate-50 px-5 py-5 sm:px-6">
        <canvas
          ref={canvasRef}
          className="block rounded-2xl bg-white shadow-[0_12px_32px_rgba(15,23,42,0.08)]"
        />
      </div>

      {log.remarks && log.remarks.length > 0 && (
        <div className="p-5 sm:p-6">
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Timer size={16} aria-hidden="true" />
            Remarks
          </h4>
          <ul className="space-y-2">
            {log.remarks.slice(0, 10).map((r, i) => (
              <li key={i} className="flex gap-2 text-sm leading-6 text-slate-600">
                <Moon className="mt-1 shrink-0 text-slate-300" size={14} aria-hidden="true" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
