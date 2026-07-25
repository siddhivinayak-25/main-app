import { Link } from 'react-router-dom';

const sizes = {
  sm: { mark: 'h-7', text: 'text-lg' },
  md: { mark: 'h-8', text: 'text-xl' },
  lg: { mark: 'h-9', text: 'text-2xl' },
  xl: { mark: 'h-11', text: 'text-3xl' },
};

export default function BrandLogo({
  size = 'md',
  variant = 'dark',
  showText = true,
  to = '/',
  className = '',
  ariaLabel,
}) {
  const { mark, text } = sizes[size] || sizes.md;
  const isLight = variant === 'light';
  const label = ariaLabel || (to === '/' ? 'hiresprint home' : 'hiresprint');

  const Mark = (
    <img
      src="/assets/hiresprint-logo.png"
      alt=""
      className={`${mark} w-auto shrink-0 object-contain`}
      aria-hidden="true"
      loading="eager"
    />
  );

  const Text = showText ? (
    <img
      src="/assets/hiresprint-name.png"
      alt="hiresprint"
      className={`${text} h-6 w-auto shrink-0 object-contain ${isLight ? 'brightness-0 invert' : ''}`}
      loading="eager"
    />
  ) : null;

  if (to) {
    return (
      <Link
        to={to}
        className={`flex items-center gap-2 group ${className}`}
        aria-label={label}
      >
        <div className="group-hover:scale-105 transition-transform duration-200">
          {Mark}
        </div>
        {Text}
      </Link>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`} aria-label={label}>
      {Mark}
      {Text}
    </div>
  );
}
