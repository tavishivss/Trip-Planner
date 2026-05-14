import { Bell, Settings, Truck } from 'lucide-react';

export default function TopNav() {
  return (
    <header className="border-b border-slate-200/80 bg-white">
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
          <button className="nav-button" type="button" aria-label="Notifications">
            <Bell size={18} aria-hidden="true" />
          </button>
          <button className="nav-button" type="button" aria-label="Settings">
            <Settings size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}
