import { Check } from 'lucide-react';

const steps = ['Basic Info', 'Test Configuration', 'Evaluation Criteria', 'Review & Publish'];

export default function StepIndicator({ currentStep }) {
  return (
    <nav aria-label="Wizard progress" className="flex items-center justify-center gap-0">
      {steps.map((label, i) => {
        const stepNum = i + 1;
        const isCompleted = stepNum < currentStep;
        const isActive = stepNum === currentStep;

        return (
          <div key={label} className="flex items-center">
            {/* Connector line before (skip first step) */}
            {i > 0 && (
              <div
                className={`w-16 h-0.5 transition-colors duration-300 ${
                  stepNum <= currentStep ? 'bg-brand-violet' : 'bg-surface-border'
                }`}
              />
            )}

            {/* Step circle + label */}
            <div className="flex flex-col items-center gap-2 min-w-[100px]">
              <div
                className={`
                  w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold
                  transition-all duration-300 shrink-0
                  ${isCompleted
                    ? 'bg-brand-violet text-white shadow-[0_0_0_4px_rgba(124,58,237,0.15)]'
                    : isActive
                      ? 'bg-brand-violet text-white shadow-[0_0_0_4px_rgba(124,58,237,0.18)] ring-2 ring-brand-violet/30 ring-offset-2 ring-offset-surface'
                      : 'border-2 border-surface-border text-muted bg-surface-card'
                  }
                `}
              >
                {isCompleted ? <Check size={16} strokeWidth={3} /> : stepNum}
              </div>
              <span
                className={`text-xs font-medium whitespace-nowrap transition-colors duration-300 ${
                  isActive ? 'text-brand-violet' : isCompleted ? 'text-ink' : 'text-muted'
                }`}
              >
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </nav>
  );
}
