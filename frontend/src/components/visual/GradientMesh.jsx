/**
 * Soft, living gradient mesh for hero/dashboard areas.
 * Keeps the light theme but adds depth and a premium finish.
 * Respects `prefers-reduced-motion`.
 */
export default function GradientMesh({ className = '', intensity = 'low' }) {
  const opacity = intensity === 'high' ? 0.7 : intensity === 'medium' ? 0.45 : 0.3;

  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      aria-hidden="true"
    >
      <div
        className="absolute -top-[30%] -left-[10%] w-[70%] h-[70%] rounded-full blur-[120px] animate-mesh-pulse"
        style={{
          background: `radial-gradient(circle, rgba(124, 58, 237, ${opacity}) 0%, transparent 70%)`,
          '--mesh-duration': '12s',
        }}
      />
      <div
        className="absolute top-[40%] -right-[10%] w-[60%] h-[60%] rounded-full blur-[120px] animate-mesh-pulse"
        style={{
          background: `radial-gradient(circle, rgba(167, 139, 250, ${opacity * 0.6}) 0%, transparent 70%)`,
          '--mesh-duration': '14s',
          animationDirection: 'reverse',
        }}
      />
      <div
        className="absolute -bottom-[10%] left-[30%] w-[50%] h-[50%] rounded-full blur-[120px] animate-mesh-pulse"
        style={{
          background: `radial-gradient(circle, rgba(124, 58, 237, ${opacity * 0.4}) 0%, transparent 70%)`,
          '--mesh-duration': '16s',
          '--mesh-delay': '2s',
        }}
      />
    </div>
  );
}
