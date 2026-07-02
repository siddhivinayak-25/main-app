const palette = ['bg-violet-100 text-brand-violet', 'bg-fuchsia-100 text-fuchsia-600', 'bg-indigo-100 text-indigo-600'];

export default function Avatar({ name, size = 'md' }) {
  const initials = name.split(' ').map((n) => n[0]).slice(0, 2).join('');
  const color = palette[name.length % palette.length];
  const sizeClass =
    size === 'sm' ? 'w-8 h-8 text-xs'
    : size === 'lg' ? 'w-20 h-20 text-xl'
    : 'w-10 h-10 text-sm';
  return (
    <div className={`${sizeClass} ${color} rounded-full flex items-center justify-center font-semibold shrink-0`}>
      {initials}
    </div>
  );
}