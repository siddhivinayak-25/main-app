export default function EmptyState({ title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <h3 className="font-display font-semibold text-ink mb-1">{title}</h3>
      <p className="text-sm text-muted max-w-sm">{description}</p>
    </div>
  );
}