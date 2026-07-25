import { Link } from 'react-router-dom';

const sizes = {
  sm: { mark: 'h-7', text: 'text-lg' },
  md: { mark: 'h-8', text: 'text-xl' },
  lg: { mark: 'h-9', text: 'text-2xl' },
  xl: { mark: 'h-11', text: 'text-3xl' },
};

function LogoMark({ className }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="hiresprint-mark-gradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7C3AED" />
          <stop offset="1" stopColor="#4C1D95" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="7" fill="url(#hiresprint-mark-gradient)" />
      {/* Stylized h + sprint line */}
      <path
        d="M9 24V8h3.5v6h7V8H23v16h-3.5v-6h-7v6H9Z"
        fill="white"
      />
      <path
        d="M18 13l6 6"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

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

  const Text = showText ? (
    <span
      className={`${text} font-sans font-semibold tracking-tight leading-none select-none ${isLight ? 'text-white' : 'text-ink'}`}
      aria-label="hiresprint"
    >
      <span className="text-brand-violet">hire</span>
      <span className={isLight ? 'text-white' : 'text-ink'}>sprint</span>
    </span>
  ) : null;

  if (to) {
    return (
      <Link
        to={to}
        className={`flex items-center gap-2 group ${className}`}
        aria-label={label}
      >
        <div className="group-hover:scale-105 transition-transform duration-200">
          <LogoMark className={`${mark} w-auto shrink-0`} />
        </div>
        {Text}
      </Link>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`} aria-label={label}>
      <LogoMark className={`${mark} w-auto shrink-0`} />
      {Text}
    </div>
  );
}
