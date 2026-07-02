import { useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { AlertTriangle } from 'lucide-react';

/* ── Criteria definitions ───────────────────────────────── */

const CRITERIA = [
  {
    key: 'promptQuality',
    label: 'Prompt Quality',
    description: 'Clarity, relevance and completeness of the prompt',
  },
  {
    key: 'errorRecovery',
    label: 'Error Recovery',
    description: 'Ability to handle errors and self-correct',
  },
  {
    key: 'outputCorrectness',
    label: 'Output Correctness',
    description: 'Final output matched expected results',
  },
  {
    key: 'codeQuality',
    label: 'Code Quality',
    description: 'Clean, maintainable and efficient code',
  },
  {
    key: 'executionEfficiency',
    label: 'Execution Efficiency',
    description: 'Optimal use of time and resources',
  },
];

const SLICE_COLORS = ['#7C3AED', '#6D28D9', '#8B5CF6', '#A78BFA', '#5B21B6'];

const DEFAULT_WEIGHTS = {
  promptQuality: 20,
  errorRecovery: 20,
  outputCorrectness: 20,
  codeQuality: 20,
  executionEfficiency: 20,
};

/* ── Component ──────────────────────────────────────────── */

export default function EvaluationCriteriaStep({ formData, updateFormData, onNext, onBack }) {
  const weights = formData.weights || DEFAULT_WEIGHTS;

  // Seed default weights on first mount if not yet set
  useEffect(() => {
    if (!formData.weights) {
      updateFormData({ weights: DEFAULT_WEIGHTS });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const totalWeight = CRITERIA.reduce((sum, c) => sum + (weights[c.key] || 0), 0);
  const isBalanced = totalWeight === 100;

  function handleSliderChange(key, value) {
    updateFormData({
      weights: { ...weights, [key]: Number(value) },
    });
  }

  /* Data for the donut chart */
  const chartData = CRITERIA.map((c) => ({
    name: c.label,
    value: weights[c.key] || 0,
  }));

  return (
    <div className="bg-surface-card border border-surface-border rounded-2xl shadow-sm overflow-hidden">
      {/* Section header */}
      <div className="px-6 pt-6">
        <h2 className="font-display font-semibold text-ink text-lg">Evaluation Criteria</h2>
        <p className="text-sm text-muted mt-1 mb-5">
          Define how each criterion contributes to the overall score
        </p>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-6 px-6 pb-6">
        {/* Left — sliders */}
        <div className="flex-1 space-y-4 min-w-0">
          {CRITERIA.map((c, i) => {
            const value = weights[c.key] ?? 20;
            return (
              <div
                key={c.key}
                className="bg-surface rounded-xl border border-surface-border px-5 py-4 transition-shadow hover:shadow-sm"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: SLICE_COLORS[i] }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink leading-snug">{c.label}</p>
                      <p className="text-xs text-muted mt-0.5 leading-snug">{c.description}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-brand-violet tabular-nums shrink-0 ml-4">
                    {value}%
                  </span>
                </div>

                <input
                  type="range"
                  min={0}
                  max={100}
                  value={value}
                  onChange={(e) => handleSliderChange(c.key, e.target.value)}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer
                    [&::-webkit-slider-runnable-track]:rounded-full
                    [&::-webkit-slider-runnable-track]:h-1.5
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-4
                    [&::-webkit-slider-thumb]:h-4
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-brand-violet
                    [&::-webkit-slider-thumb]:shadow-md
                    [&::-webkit-slider-thumb]:-mt-[5px]
                    [&::-webkit-slider-thumb]:border-2
                    [&::-webkit-slider-thumb]:border-white
                    [&::-webkit-slider-thumb]:transition-transform
                    [&::-webkit-slider-thumb]:hover:scale-110
                    [&::-moz-range-thumb]:w-4
                    [&::-moz-range-thumb]:h-4
                    [&::-moz-range-thumb]:rounded-full
                    [&::-moz-range-thumb]:bg-brand-violet
                    [&::-moz-range-thumb]:border-2
                    [&::-moz-range-thumb]:border-white
                    [&::-moz-range-thumb]:shadow-md"
                  style={{
                    background: `linear-gradient(to right, #7C3AED ${value}%, #E7E2F5 ${value}%)`,
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Right — donut chart card */}
        <div className="w-[300px] shrink-0">
          <div className="bg-surface rounded-xl border border-surface-border p-5 sticky top-6">
            {/* Total badge */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted">Weight Distribution</span>
              <span
                className={`inline-flex items-center gap-1 text-sm font-bold tabular-nums ${
                  isBalanced ? 'text-ink' : 'text-amber-500'
                }`}
              >
                {!isBalanced && <AlertTriangle size={14} className="text-amber-500" />}
                Total {totalWeight}%
              </span>
            </div>

            {!isBalanced && (
              <p className="text-xs text-amber-500 mb-3 -mt-2">
                Weights should add up to 100%
              </p>
            )}

            {/* Donut */}
            <div className="flex justify-center">
              <ResponsiveContainer width={200} height={200}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                    animationBegin={0}
                    animationDuration={600}
                  >
                    {chartData.map((_, idx) => (
                      <Cell key={idx} fill={SLICE_COLORS[idx]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#1E1B2E',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#fff',
                      padding: '6px 10px',
                    }}
                    formatter={(value) => [`${value}%`, 'Weight']}
                  />
                  {/* Center label */}
                  <text
                    x="50%"
                    y="48%"
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="fill-ink text-2xl font-bold"
                    style={{ fontFamily: 'Sora, sans-serif' }}
                  >
                    {totalWeight}%
                  </text>
                  <text
                    x="50%"
                    y="60%"
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="fill-muted text-[10px]"
                  >
                    total
                  </text>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="mt-4 space-y-2.5">
              {CRITERIA.map((c, i) => (
                <div key={c.key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: SLICE_COLORS[i] }}
                    />
                    <span className="text-xs text-ink truncate">{c.label}</span>
                  </div>
                  <span className="text-xs font-semibold text-muted tabular-nums ml-2">
                    {weights[c.key] ?? 20}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-surface-border">
        <button
          onClick={onBack}
          className="px-5 py-2.5 rounded-lg border border-surface-border text-sm font-medium text-muted hover:text-ink hover:border-brand-violet/30 transition-colors"
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="bg-brand-violet hover:bg-brand-violet-dark text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors shadow-sm"
        >
          Next
        </button>
      </div>
    </div>
  );
}
