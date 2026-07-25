export default function PageHeader({ title, subtitle, action, badge }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <div className="flex items-center gap-2 mb-1">
          {badge && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-brand-violet-light text-brand-violet text-[10px] font-bold uppercase tracking-wider">
              {badge}
            </span>
          )}
        </div>
        <h1 className="text-2xl font-display font-bold text-ink tracking-tight">{title}</h1>
        <p className="text-sm text-muted mt-1">{subtitle}</p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
