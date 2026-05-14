import { useEffect, useState } from 'react';
import { Truck } from 'lucide-react';

const FADE_DURATION_MS = 500;

export default function SplashLoader({
  duration = 2400,
  icon: Icon = Truck,
  onExitStart,
  onFinish,
}) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const exitTimer = window.setTimeout(() => {
      setIsExiting(true);
      onExitStart?.();
    }, duration);

    const finishTimer = window.setTimeout(() => {
      onFinish?.();
    }, duration + FADE_DURATION_MS);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(finishTimer);
    };
  }, [duration, onExitStart, onFinish]);

  return (
    <section
      className={`splash-loader fixed inset-0 z-[9999] grid place-items-center overflow-hidden bg-app-bg px-6 transition-opacity duration-500 ${
        isExiting ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ '--splash-duration': `${duration}ms` }}
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading route planner"
    >
      <div
        className={`w-full max-w-md transition duration-500 ${
          isExiting ? 'translate-y-2 scale-[0.98] opacity-90' : 'translate-y-0 scale-100 opacity-100'
        }`}
      >
        <div className="splash-route mx-auto" aria-hidden="true">
          <div className="relative h-12">
            <div className="splash-truck absolute left-0 top-0 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-[0_12px_28px_rgba(37,99,235,0.18)] ring-1 ring-blue-100">
              <Icon size={24} strokeWidth={2.2} />
            </div>
          </div>

          <div className="splash-progress-track relative mt-2 h-2.5 overflow-hidden rounded-full">
            <div className="splash-progress-fill h-full rounded-full" />
            <div className="splash-progress-dot" />
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
            <span>Start</span>
            <span>Dispatch</span>
          </div>
        </div>
      </div>
    </section>
  );
}
