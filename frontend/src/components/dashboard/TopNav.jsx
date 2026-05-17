import { useEffect, useState } from 'react';
import { Moon, Sun, Truck } from 'lucide-react';

function getInitialTheme() {
  return 'light';
}

export default function TopNav() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <header>
      <div className="mx-auto flex max-w-[1760px] items-center justify-between gap-6 px-5 py-3.5 sm:px-8 lg:px-10">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-600/20 ring-1 ring-blue-400/20">
            <Truck size={24} strokeWidth={2.25} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold leading-tight text-slate-950 sm:text-xl">
              ELD Trip Planner
            </h1>
            <p className="hidden text-xs font-medium leading-5 text-slate-400 sm:block">
              HOS-compliant routing for long-haul dispatch teams
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 rounded-2xl border border-slate-200/70 bg-white/60 p-1 shadow-sm">
          <button
            className={`nav-button ${theme === 'light' ? 'nav-button-active' : ''}`}
            type="button"
            aria-label="Use light mode"
            aria-pressed={theme === 'light'}
            onClick={() => setTheme('light')}
          >
            <Sun size={18} strokeWidth={2.1} aria-hidden="true" />
          </button>
          <button
            className={`nav-button ${theme === 'dark' ? 'nav-button-active' : ''}`}
            type="button"
            aria-label="Use dark mode"
            aria-pressed={theme === 'dark'}
            onClick={() => setTheme('dark')}
          >
            <Moon size={18} strokeWidth={2.1} aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}
