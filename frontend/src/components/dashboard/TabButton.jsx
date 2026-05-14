export default function TabButton({ active, icon: Icon, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition sm:flex-none ${
        active
          ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200'
          : 'text-slate-500 hover:bg-white/70 hover:text-slate-900'
      }`}
    >
      {Icon && <Icon size={17} aria-hidden="true" />}
      {children}
    </button>
  );
}
