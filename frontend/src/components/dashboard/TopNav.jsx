import { Bell, CircleUserRound, Settings, ShieldCheck, Truck } from 'lucide-react';

export default function TopNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1760px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
            <Truck size={22} strokeWidth={2.2} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold leading-tight text-slate-950 sm:text-xl">
              ELD Trip Planner
            </h1>
            <p className="hidden text-sm text-slate-500 sm:block">
              HOS-compliant routing for long-haul dispatch teams
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 md:flex">
            <ShieldCheck size={15} aria-hidden="true" />
            System compliant
          </div>
          <button className="nav-button" type="button" aria-label="Notifications">
            <Bell size={18} aria-hidden="true" />
          </button>
          <button className="nav-button" type="button" aria-label="Settings">
            <Settings size={18} aria-hidden="true" />
          </button>
          <button className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700 hover:shadow-sm sm:flex">
            <CircleUserRound size={18} aria-hidden="true" />
            Dispatcher
          </button>
        </div>
      </div>
    </header>
  );
}
