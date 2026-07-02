export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-xl font-display font-semibold text-ink">{title}</h1>
        <p className="text-sm text-muted mt-1">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}