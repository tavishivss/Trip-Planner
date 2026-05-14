export default function KpiCard({ icon: Icon, label, value, unit, hint }) {
  return (
    <section className="dashboard-card group p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(15,23,42,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-slate-500">{label}</p>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-semibold leading-none tracking-normal text-slate-950">
              {value}
            </span>
            {unit && <span className="text-xs font-semibold text-slate-500">{unit}</span>}
          </div>
        </div>
        {Icon && (
          <div className="kpi-icon-shell">
            <Icon size={18} strokeWidth={2} aria-hidden="true" />
          </div>
        )}
      </div>
      {hint && <p className="mt-3 text-[11px] font-medium leading-4 text-slate-400">{hint}</p>}
    </section>
  );
}
