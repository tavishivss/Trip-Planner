import { ClipboardList, Fuel, MapPinned, Moon, Navigation, Route, Timer } from 'lucide-react';
import { demoEvents, demoLogs } from '../../data/demoTrip';

const eventTone = {
  blue: 'bg-blue-600',
  amber: 'bg-amber-500',
  slate: 'bg-slate-500',
  emerald: 'bg-emerald-500',
};

export function EmptyRoutePreview() {
  return (
    <section className="dashboard-card min-h-[540px] overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-950">Route workspace</p>
          <p className="mt-1 text-sm text-slate-500">Plan a trip to render the live Leaflet map and HOS route events.</p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
          <Navigation size={14} aria-hidden="true" />
          Waiting for route
        </div>
      </div>

      <div className="grid min-h-[460px] place-items-center bg-[radial-gradient(circle_at_20%_20%,rgba(37,99,235,0.10),transparent_28%),linear-gradient(135deg,#f8fafc,#eef4ff)] p-6">
        <div className="w-full max-w-3xl rounded-[2rem] border border-white/80 bg-white/80 p-5 shadow-[0_24px_64px_rgba(15,23,42,0.10)]">
          <div className="relative h-72 overflow-hidden rounded-3xl bg-slate-100">
            <div className="absolute inset-x-8 top-16 h-1 rounded-full bg-blue-200" />
            <div className="absolute left-12 top-14 h-5 w-5 rounded-full border-4 border-white bg-blue-600 shadow-lg" />
            <div className="absolute left-1/3 top-14 h-5 w-5 rounded-full border-4 border-white bg-amber-500 shadow-lg" />
            <div className="absolute right-16 top-14 h-5 w-5 rounded-full border-4 border-white bg-emerald-500 shadow-lg" />
            <div className="absolute left-20 top-28 h-32 w-px rotate-45 bg-slate-200" />
            <div className="absolute bottom-10 right-24 h-28 w-px -rotate-45 bg-slate-200" />
            <div className="absolute inset-0 grid grid-cols-5 gap-px opacity-40">
              {Array.from({ length: 25 }).map((_, index) => (
                <div key={index} className="border border-white/80" />
              ))}
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="rounded-2xl bg-white px-5 py-4 text-center shadow-xl">
                <MapPinned className="mx-auto text-blue-600" size={28} aria-hidden="true" />
                <p className="mt-2 text-sm font-semibold text-slate-950">Interactive map placeholder</p>
                <p className="mt-1 text-xs text-slate-500">Live route appears after planning</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function PreviewEvents() {
  return (
    <section className="dashboard-card p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-950">Route Events</h2>
          <p className="mt-1 text-sm text-slate-500">Example timeline for dispatch review</p>
        </div>
        <Route className="text-slate-400" size={20} aria-hidden="true" />
      </div>

      <div className="mt-5 space-y-3">
        {demoEvents.map((event) => (
          <div
            key={`${event.type}-${event.time}`}
            className="group rounded-2xl border border-slate-100 bg-slate-50/80 p-4 transition hover:-translate-y-0.5 hover:border-blue-100 hover:bg-white hover:shadow-sm"
          >
            <div className="flex items-start gap-3">
              <span className={`mt-1 h-2.5 w-2.5 rounded-full ${eventTone[event.tone]}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-950">{event.type}</p>
                  <span className="text-xs text-slate-400">{event.time}</span>
                </div>
                <p className="mt-1 truncate text-sm text-slate-600">{event.location}</p>
                <p className="mt-2 text-xs text-slate-400">{event.detail}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function PreviewLogs() {
  return (
    <section className="dashboard-card p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-950">Daily Logs</h2>
          <p className="mt-1 text-sm text-slate-500">Preview of generated ELD duty summaries</p>
        </div>
        <ClipboardList className="text-slate-400" size={20} aria-hidden="true" />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {demoLogs.map((log) => (
          <article key={log.day} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-slate-950">{log.day}</p>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                {log.status}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Timer size={14} aria-hidden="true" />
                  Drive
                </div>
                <p className="mt-1 font-semibold text-slate-900">{log.drive}</p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Moon size={14} aria-hidden="true" />
                  Duty
                </div>
                <p className="mt-1 font-semibold text-slate-900">{log.duty}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function SidebarPreview() {
  return (
    <section className="soft-card p-5">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
          <Fuel size={20} aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-950">Planning checklist</h2>
          <p className="text-sm text-slate-500">Ready for route generation</p>
        </div>
      </div>
      <div className="mt-5 space-y-3 text-sm text-slate-600">
        <div className="flex items-center justify-between">
          <span>Geocoded stops</span>
          <span className="font-semibold text-slate-950">3 required</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Fuel cadence</span>
          <span className="font-semibold text-slate-950">1,000 mi</span>
        </div>
      </div>
    </section>
  );
}
