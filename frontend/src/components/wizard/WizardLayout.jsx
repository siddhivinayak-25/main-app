import StepIndicator from './StepIndicator';

export default function WizardLayout({ title, subtitle, currentStep, children }) {
  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-ink">{title}</h1>
        <p className="text-sm text-muted mt-1">{subtitle}</p>
      </div>

      {/* Step indicator */}
      <div className="bg-surface-card border border-surface-border rounded-2xl px-6 py-5 mb-8 shadow-sm">
        <StepIndicator currentStep={currentStep} />
      </div>

      {/* Step content */}
      <div className="animate-fade-in" key={currentStep}>
        {children}
      </div>
    </div>
  );
}
