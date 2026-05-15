export default function TabButton({ active, icon: Icon, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`dashboard-tab inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition sm:flex-none ${
        active
          ? 'dashboard-tab-active bg-white theme-blue-accent shadow-sm ring-1 ring-slate-200'
          : 'dashboard-tab-inactive text-slate-500'
      }`}
    >
      {Icon && <Icon size={17} aria-hidden="true" />}
      {children}
    </button>
  );
}
