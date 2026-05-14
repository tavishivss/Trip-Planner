export default function KpiCard({ icon: Icon, label, value, unit, hint, tone = 'blue' }) {
  const toneClasses = {
    blue: 'bg-blue-50 text-blue-600 ring-blue-100',
    slate: 'bg-slate-100 text-slate-600 ring-slate-200',
    amber: 'bg-amber-50 text-amber-700 ring-amber-100',
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  };

  return (
    <section className="dashboard-card group p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_48px_rgba(15,23,42,0.09)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-slate-500">{label}</p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-semibold leading-none tracking-normal text-slate-950">
              {value}
            </span>
            {unit && <span className="text-sm font-semibold text-slate-500">{unit}</span>}
          </div>
        </div>
        {Icon && (
          <div className={`rounded-2xl p-3 ring-1 ${toneClasses[tone] || toneClasses.blue}`}>
            <Icon size={21} strokeWidth={2.1} aria-hidden="true" />
          </div>
        )}
      </div>
      {hint && <p className="mt-4 text-xs font-medium text-slate-400">{hint}</p>}
    </section>
  );
}
