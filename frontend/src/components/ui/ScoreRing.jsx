function scoreMeta(score) {
  if (score >= 90) return { label: 'Excellent', color: '#7C3AED', note: 'Top 10% of all candidates' };
  if (score >= 75) return { label: 'Good', color: '#059669', note: 'Top 30% of all candidates' };
  if (score >= 60) return { label: 'Fair', color: '#D97706', note: 'Middle of the pack' };
  return { label: 'Needs Review', color: '#DC2626', note: 'Below target threshold' };
}

export default function ScoreRing({ score }) {
  const { label, color, note } = scoreMeta(score);
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex items-center gap-5">
      <div className="relative">
        <svg width="112" height="112" viewBox="0 0 112 112" className="-rotate-90">
          <circle cx="56" cy="56" r={radius} stroke="#E7E2F5" strokeWidth="10" fill="none" />
          <circle
            cx="56" cy="56" r={radius} stroke={color} strokeWidth="10" fill="none"
            strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-display font-bold text-ink">{score}</span>
          <span className="text-xs text-muted">/100</span>
        </div>
      </div>
      <div>
        <p className="font-semibold" style={{ color }}>{label}</p>
        <p className="text-sm text-muted">{note}</p>
      </div>
    </div>
  );
}