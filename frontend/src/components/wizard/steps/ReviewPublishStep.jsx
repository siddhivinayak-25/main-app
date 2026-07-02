import {
  Pencil,
  Clock,
  Tag,
  BarChart3,
  FileText,
  Terminal,
  FolderOpen,
  FlaskConical,
  Loader2,
  AlertCircle,
} from 'lucide-react';

/* ── Helpers ────────────────────────────────────────────── */

const CRITERIA_LABELS = {
  promptQuality: 'Prompt Quality',
  errorRecovery: 'Error Recovery',
  outputCorrectness: 'Output Correctness',
  codeQuality: 'Code Quality',
  executionEfficiency: 'Execution Efficiency',
};

function SectionCard({ title, icon: Icon, stepNumber, onEdit, children }) {
  return (
    <div className="bg-surface-card border border-surface-border rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
        <div className="flex items-center gap-2.5">
          {Icon && <Icon size={16} className="text-brand-violet" />}
          <h3 className="font-display font-semibold text-ink text-sm">{title}</h3>
        </div>
        <button
          onClick={() => onEdit(stepNumber)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-violet hover:text-brand-violet-dark transition-colors"
        >
          <Pencil size={12} />
          Edit
        </button>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

function Field({ label, children, icon: Icon }) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-xs font-medium text-muted mb-1">
        {Icon && <Icon size={12} />}
        {label}
      </dt>
      <dd className="text-sm text-ink">{children || <span className="text-muted italic">Not set</span>}</dd>
    </div>
  );
}

/* ── Component ──────────────────────────────────────────── */

export default function ReviewPublishStep({ formData, onBack, onPublish, onEditStep, publishing, publishError }) {
  const weights = formData.weights || {};
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-5">
      {/* ── Basic Info ─────────────────────────────────── */}
      <SectionCard title="Basic Information" icon={FileText} stepNumber={1} onEdit={onEditStep}>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-4">
          <Field label="Test Title">{formData.testTitle}</Field>
          <Field label="Role">{formData.role}</Field>
          <div className="col-span-2">
            <Field label="Description">{formData.description}</Field>
          </div>
          <Field label="Duration" icon={Clock}>
            {formData.duration
              ? `${formData.duration} ${formData.durationUnit || 'minutes'}`
              : null}
          </Field>
          <Field label="Difficulty" icon={BarChart3}>{formData.difficulty}</Field>
          <div className="col-span-2">
            <dt className="flex items-center gap-1.5 text-xs font-medium text-muted mb-1.5">
              <Tag size={12} />
              Skills
            </dt>
            <dd className="flex flex-wrap gap-1.5">
              {(formData.skills || []).length > 0 ? (
                formData.skills.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center bg-brand-violet-light text-brand-violet-dark text-xs font-medium px-2.5 py-1 rounded-md"
                  >
                    {s}
                  </span>
                ))
              ) : (
                <span className="text-sm text-muted italic">No skills selected</span>
              )}
            </dd>
          </div>
        </dl>
      </SectionCard>

      {/* ── Test Configuration ─────────────────────────── */}
      <SectionCard title="Test Configuration" icon={Terminal} stepNumber={2} onEdit={onEditStep}>
        <dl className="space-y-4">
          <Field label="Instructions" icon={FileText}>
            {formData.instructions ? (
              <p className="whitespace-pre-wrap leading-relaxed">{formData.instructions}</p>
            ) : null}
          </Field>

          {formData.starterCode ? (
            <div>
              <dt className="flex items-center gap-1.5 text-xs font-medium text-muted mb-1.5">
                <Terminal size={12} />
                Starter Code
              </dt>
              <dd>
                <div className="rounded-lg overflow-hidden">
                  <div className="flex items-center gap-1.5 px-4 py-2" style={{ background: '#1E1B2E' }}>
                    <span className="w-2 h-2 rounded-full bg-red-400/80" />
                    <span className="w-2 h-2 rounded-full bg-yellow-400/80" />
                    <span className="w-2 h-2 rounded-full bg-green-400/80" />
                  </div>
                  <pre
                    className="px-4 py-3 text-xs font-mono text-green-300 leading-relaxed overflow-x-auto"
                    style={{ background: '#1E1B2E' }}
                  >
                    {formData.starterCode}
                  </pre>
                </div>
              </dd>
            </div>
          ) : (
            <Field label="Starter Code" icon={Terminal}>{null}</Field>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Resources" icon={FolderOpen}>
              <span className="text-muted italic">None added</span>
            </Field>
            <Field label="Test Cases" icon={FlaskConical}>
              <span className="text-muted italic">None added</span>
            </Field>
          </div>
        </dl>
      </SectionCard>

      {/* ── Evaluation Criteria ────────────────────────── */}
      <SectionCard title="Evaluation Criteria" icon={BarChart3} stepNumber={3} onEdit={onEditStep}>
        <div className="space-y-3">
          {Object.entries(CRITERIA_LABELS).map(([key, label]) => {
            const value = weights[key] ?? 0;
            return (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-ink">{label}</span>
                <div className="flex items-center gap-3 w-48">
                  <div className="flex-1 h-1.5 rounded-full bg-surface-border overflow-hidden">
                    <div
                      className="h-full bg-brand-violet rounded-full transition-all"
                      style={{ width: `${value}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-muted tabular-nums w-8 text-right">
                    {value}%
                  </span>
                </div>
              </div>
            );
          })}
          <div className="flex justify-end pt-2 border-t border-surface-border">
            <span
              className={`text-xs font-bold tabular-nums ${
                totalWeight === 100 ? 'text-ink' : 'text-amber-500'
              }`}
            >
              Total: {totalWeight}%
            </span>
          </div>
        </div>
      </SectionCard>

      {/* ── Error banner ──────────────────────────────── */}
      {publishError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
          <AlertCircle size={16} className="shrink-0" />
          {publishError.message || 'Something went wrong. Please try again.'}
        </div>
      )}

      {/* ── Footer ─────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onBack}
          disabled={publishing}
          className="px-5 py-2.5 rounded-lg border border-surface-border text-sm font-medium text-muted hover:text-ink hover:border-brand-violet/30 transition-colors disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={onPublish}
          disabled={publishing}
          className="inline-flex items-center gap-2 bg-brand-violet hover:bg-brand-violet-dark text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {publishing && <Loader2 size={15} className="animate-spin" />}
          {publishing ? 'Publishing…' : 'Publish Test'}
        </button>
      </div>
    </div>
  );
}
