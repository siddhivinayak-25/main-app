export default function ComingSoon({ title }) {
  return (
    <div className="flex flex-col items-center justify-center h-[70vh] text-center">
      <h2 className="text-xl font-display font-semibold text-ink mb-2">{title}</h2>
      <p className="text-muted text-sm">This screen isn't built yet — wire it up when you're ready.</p>
    </div>
  );
}