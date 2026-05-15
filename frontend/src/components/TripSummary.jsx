import { Activity, Clock3, ShieldCheck } from 'lucide-react';

const dotClasses = {
  driving: 'dot-driving',
  pickup: 'bg-blue-600',
  dropoff: 'bg-slate-600',
  fuel: 'dot-on-duty',
  break: 'dot-on-duty',
  reset: 'bg-emerald-600',
  duty: 'dot-on-duty',
  off: 'bg-blue-600',
};

function BreakdownRow({ tone, label, value, total }) {
  return (
    <div className={`flex items-center gap-3 py-1 ${total ? 'mt-1 border-t border-slate-200 pt-3' : ''}`}>
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotClasses[tone] || 'bg-slate-400'}`} />
      <span className={`min-w-0 flex-1 text-sm ${total ? 'font-semibold text-slate-800' : 'text-slate-500'}`}>
        {label}
      </span>
      <span className="text-sm font-semibold tabular-nums text-slate-900">{value}</span>
    </div>
  );
}

export default function TripSummary({ data }) {
  const { stops, cycle_info, shifts, time_breakdown } = data;

  const breakStops = stops.filter((s) => s.stop_type === 'break');
  const resetStops = stops.filter((s) => ['off_duty_reset', 'cycle_restart'].includes(s.stop_type));
  const cycleLimit = cycle_info?.cycle_limit || 70;
  const cycleRestarts = cycle_info?.cycle_restarts || 0;
  const priorCycleHours = cycleRestarts > 0 ? 0 : cycle_info?.cycle_start_used || 0;
  const tripCycleHours = cycleRestarts > 0
    ? cycle_info?.cycle_total_used || 0
    : cycle_info?.cycle_added_this_trip || 0;
  const cycleTripLabel = cycleRestarts > 0
    ? `After restart: ${cycle_info.cycle_total_used}h`
    : `Trip: ${cycle_info?.cycle_added_this_trip}h`;

  return (
    <section className="dashboard-card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Trip Summary</h2>
          <p className="mt-1 text-sm text-slate-500">Live route totals and compliance status.</p>
        </div>
        <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
          <ShieldCheck size={20} aria-hidden="true" />
        </div>
      </div>

      {time_breakdown && (
        <div className="mt-6 rounded-2xl bg-slate-50 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Clock3 size={16} aria-hidden="true" />
            On-duty breakdown
          </div>
          <div className="space-y-1">
            <BreakdownRow tone="driving" label="Driving" value={`${time_breakdown.driving} hrs`} />
            <BreakdownRow tone="pickup" label="Pickup loading" value={`${time_breakdown.pickup} hrs`} />
            <BreakdownRow tone="dropoff" label="Drop-off unloading" value={`${time_breakdown.dropoff} hrs`} />
            <BreakdownRow tone="fuel" label="Fueling" value={`${time_breakdown.fueling} hrs`} />
            <BreakdownRow tone="duty" label="Total on-duty" value={`${time_breakdown.total_on_duty} hrs`} total />
          </div>
          <div className="mt-4 space-y-1 border-t border-slate-200 pt-3">
            <BreakdownRow
              tone="break"
              label={`30-min breaks (${breakStops.length})`}
              value={`${time_breakdown.breaks_30min} hrs`}
            />
            <BreakdownRow
              tone="reset"
              label={`Off-duty resets/restarts (${resetStops.length})`}
              value={`${time_breakdown.off_duty_resets} hrs`}
            />
            <BreakdownRow tone="off" label="Total off-duty" value={`${time_breakdown.total_off_duty} hrs`} total />
          </div>
        </div>
      )}

      {cycle_info && (
        <div className="mt-6 rounded-2xl bg-slate-50 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Activity size={16} aria-hidden="true" />
            70-hour cycle
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-200">
            <div className="flex h-full">
              <div
                className="h-full bg-slate-400 transition-all duration-500"
                style={{ width: `${Math.min(100, (priorCycleHours / cycleLimit) * 100)}%` }}
              />
              <div
                className="h-full bg-blue-600 transition-all duration-500"
                style={{ width: `${Math.min(100, (tripCycleHours / cycleLimit) * 100)}%` }}
              />
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-slate-500">
            <span>Prior: {cycle_info.cycle_start_used}h</span>
            <span className="text-center">{cycleTripLabel}</span>
            <span className="text-right">Left: {cycle_info.cycle_remaining}h</span>
          </div>
        </div>
      )}

      {shifts && shifts.length > 0 && (
        <div className="mt-6 rounded-2xl bg-slate-50 p-4">
          <div className="mb-4 text-sm font-semibold text-slate-800">Per-shift HOS compliance</div>
          <div className="space-y-4">
            {shifts.map((shift) => {
              const dPct = Math.min(100, (shift.driving_hours / shift.driving_limit) * 100);
              const wPct = Math.min(100, (shift.window_hours / shift.window_limit) * 100);
              return (
                <div key={shift.shift_number} className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">Shift {shift.shift_number}</span>
                    <span className={shift.driving_ok && shift.window_ok ? 'text-emerald-600' : 'text-[#0d9488]'}>
                      {shift.driving_ok && shift.window_ok ? 'Compliant' : 'Review'}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-20 text-right text-xs text-slate-400">
                        Drive {shift.driving_hours}/{shift.driving_limit}h
                      </span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                        <div className="h-full rounded-full progress-driving" style={{ width: `${dPct}%` }} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-20 text-right text-xs text-slate-400">
                        Window {shift.window_hours}/{shift.window_limit}h
                      </span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                        <div className="h-full rounded-full progress-on-duty" style={{ width: `${wPct}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
