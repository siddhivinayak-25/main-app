import { X } from 'lucide-react';
import ScoreRing from '../ui/ScoreRing';
import StageActionMenu from './StageActionMenu';
import ActivityTimeline from './ActivityTimeline';

const breakdownLabels = {
  promptQuality: ['Prompt Quality', 'Clarity, relevance and completeness of the prompt'],
  errorRecovery: ['Error Recovery', 'Ability to handle errors and self-correct'],
  codeQuality: ['Code Quality', 'Clean, maintainable and efficient code'],
  executionEfficiency: ['Execution Efficiency', 'Optimal use of time and resources'],
};

export default function CandidateDrawer({ candidate, onClose, onStatusUpdated }) {
  const { scoreBreakdown: sb, testDetails: td } = candidate;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-ink/40 animate-fade-in" onClick={onClose} />

      <div className="relative w-full max-w-md bg-surface-raised border-l border-surface-border h-full overflow-y-auto animate-slide-in shadow-2xl">
        <div className="flex items-start justify-between p-6 border-b border-surface-border">
          <div>
            <h2 className="font-display font-semibold text-ink text-lg">{candidate.name}</h2>
            <p className="text-sm text-muted mt-0.5">{candidate.testName}</p>
          </div>
          <div className="flex items-center gap-2">
            <StageActionMenu candidate={candidate} onStatusUpdated={onStatusUpdated} />
            <button onClick={onClose} className="text-muted hover:text-ink transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          <div>
            <p className="text-sm text-muted mb-4">Agentic Score</p>
            <ScoreRing score={candidate.score} />
          </div>

          {/* Score breakdown */}
          <div>
            <p className="text-sm text-muted mb-4">Score Breakdown</p>
            <div className="space-y-4">
              {Object.entries(breakdownLabels).map(([key, [label, desc]]) => (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-ink font-medium">{label}</span>
                    <span className="text-sm font-medium text-brand-violet">{sb[key]}/10</span>
                  </div>
                  <p className="text-xs text-muted mb-1.5">{desc}</p>
                  <div className="h-1.5 rounded-full bg-surface-border overflow-hidden">
                    <div className="h-full bg-brand-violet rounded-full" style={{ width: `${sb[key] * 10}%` }} />
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="text-sm text-ink font-medium block">Output Correctness</span>
                  <span className="text-xs text-muted">Final output matched expected results</span>
                </div>
                <span className={`text-sm font-medium ${sb.outputCorrectness ? 'text-emerald-600' : 'text-red-600'}`}>
                  {sb.outputCorrectness ? 'Pass' : 'Fail'}
                </span>
              </div>
            </div>
          </div>

          {/* Test Details */}
          <div>
            <p className="text-sm text-muted mb-3">Test Details</p>
            <div className="space-y-2 text-sm">
              {Object.entries({
                'Test Taken': td.testTaken,
                'Execution Time': td.executionTime,
                Language: td.language,
                Environment: td.environment,
              }).map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-muted">{k}</span>
                  <span className="text-ink font-medium">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Activity History */}
          <div>
            <p className="text-sm text-muted mb-4">Activity History</p>
            <ActivityTimeline activityLog={candidate.activityLog} />
          </div>

          <button className="w-full bg-brand-violet hover:bg-brand-violet-dark text-white font-medium py-3 rounded-lg transition-colors shadow-sm">
            View Full Replay
          </button>
        </div>
      </div>
    </div>
  );
}