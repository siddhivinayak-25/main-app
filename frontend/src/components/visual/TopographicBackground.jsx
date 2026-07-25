import { useId } from 'react';

/**
 * Topographic background inspired by contour-line cartography.
 * Renders a faint, animated field of contour rings and a dotted grid
 * over a light canvas. Respects `prefers-reduced-motion`.
 */
export default function TopographicBackground({
  className = '',
  density = 'default',
  animate = true,
}) {
  const rings = density === 'dense' ? 18 : 12;
  const gridStep = density === 'dense' ? 60 : 80;
  const dotOpacity = density === 'dense' ? 0.14 : 0.18;

  // Stable, unique IDs so multiple instances on the same page don't collide.
  const uid = useId();
  const fadeId = `topo-fade-${uid}`;
  const lineId = `line-gradient-${uid}`;
  const gridId = `dot-grid-${uid}`;

  const contourPaths = Array.from({ length: rings }).map((_, i) => {
    const seed = i * 137.5;
    const cx = 20 + (seed % 60);
    const cy = 15 + ((seed * 0.7) % 70);
    const r = 8 + i * 6 + (i % 3) * 3;
    const eccentricity = 0.7 + (i % 5) * 0.08;
    const rotation = (seed * 0.5) % 360;
    return { cx, cy, r, eccentricity, rotation, id: i };
  });

  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      aria-hidden="true"
    >
      <svg
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={fadeId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(247, 245, 252, 0)" />
            <stop offset="50%" stopColor="rgba(247, 245, 252, 0.4)" />
            <stop offset="100%" stopColor="rgba(247, 245, 252, 0.95)" />
          </linearGradient>

          <linearGradient id={lineId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(124, 58, 237, 0.22)" />
            <stop offset="50%" stopColor="rgba(31, 27, 46, 0.12)" />
            <stop offset="100%" stopColor="rgba(124, 58, 237, 0.18)" />
          </linearGradient>

          <pattern
            id={gridId}
            width={gridStep}
            height={gridStep}
            patternUnits="userSpaceOnUse"
          >
            <circle
              cx={gridStep / 2}
              cy={gridStep / 2}
              r="1.5"
              fill={`rgba(31, 27, 46, ${dotOpacity})`}
            />
          </pattern>
        </defs>

        {/* Base canvas tint */}
        <rect width="100%" height="100%" fill="rgba(247, 245, 252, 0.6)" />

        {/* Dotted grid */}
        <rect width="100%" height="100%" fill={`url(#${gridId})`} />

        {/* Contour rings */}
        <g
          fill="none"
          stroke={`url(#${lineId})`}
          strokeWidth="1"
          strokeLinecap="round"
        >
          {contourPaths.map(({ cx, cy, r, eccentricity, rotation, id }) => (
            <ellipse
              key={id}
              cx={`${cx}%`}
              cy={`${cy}%`}
              rx={`${r * eccentricity}%`}
              ry={`${r}%`}
              transform={`rotate(${rotation} ${cx} ${cy})`}
              opacity={0.35 + (id % 4) * 0.05}
              className={animate ? 'animate-topo-drift' : ''}
              style={{
                '--topo-delay': `${id * -0.8}s`,
                '--topo-duration': `${18 + (id % 7) * 2}s`,
              }}
            />
          ))}
        </g>

        {/* Bottom fade so content sits cleanly */}
        <rect width="100%" height="100%" fill={`url(#${fadeId})`} />
      </svg>
    </div>
  );
}
