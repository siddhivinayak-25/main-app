import { useState, useEffect } from 'react';
import { Pencil, X, Check, AlertCircle } from 'lucide-react';

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Kolkata',
  'Australia/Sydney',
  'Pacific/Auckland',
];

const fieldLabel = 'block text-sm text-muted mb-1';
const fieldValue = 'text-ink font-medium text-sm';
const inputBase =
  'w-full bg-surface border border-surface-border rounded-lg px-3.5 py-2 text-sm placeholder:text-muted focus:outline-none focus:border-brand-violet focus:ring-1 focus:ring-brand-violet transition-all';

export default function PersonalInfoForm({ user, onSave, updating }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({});
  const [successMsg, setSuccessMsg] = useState(null);
  const [error, setError] = useState(null);

  // Auto-dismiss success banner
  useEffect(() => {
    if (!successMsg) return;
    const id = setTimeout(() => setSuccessMsg(null), 3000);
    return () => clearTimeout(id);
  }, [successMsg]);

  function startEditing() {
    setDraft({
      name: user.name || '',
      phone: user.phone || '',
      jobTitle: user.jobTitle || '',
      department: user.department || '',
      timezone: user.timezone || '',
      bio: user.bio || '',
    });
    setError(null);
    setSuccessMsg(null);
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setDraft({});
    setError(null);
  }

  function handleChange(field, value) {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    setError(null);
    try {
      await onSave(draft);
      setEditing(false);
      setSuccessMsg('Profile updated');
    } catch (err) {
      setError(err.message || 'Failed to save changes');
    }
  }

  /* ─── Read-only grid ─── */
  function renderReadOnly() {
    const fields = [
      { label: 'Full Name', value: user.name },
      { label: 'Email', value: user.email },
      { label: 'Phone', value: user.phone || '—' },
      { label: 'Job Title', value: user.jobTitle || '—' },
      { label: 'Department', value: user.department || '—' },
      { label: 'Timezone', value: user.timezone || '—' },
    ];

    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
          {fields.map((f) => (
            <div key={f.label}>
              <span className={fieldLabel}>{f.label}</span>
              <p className={fieldValue}>{f.value}</p>
            </div>
          ))}
        </div>

        {/* Bio — full width */}
        <div className="mt-5">
          <span className={fieldLabel}>Bio</span>
          <p className={`${fieldValue} whitespace-pre-line`}>{user.bio || '—'}</p>
        </div>
      </>
    );
  }

  /* ─── Edit-mode form ─── */
  function renderEditForm() {
    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
          {/* Full Name */}
          <div>
            <label className={fieldLabel}>Full Name</label>
            <input
              type="text"
              value={draft.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={inputBase}
            />
          </div>

          {/* Email — read-only even in edit mode */}
          <div>
            <label className={fieldLabel}>Email</label>
            <input
              type="email"
              value={user.email}
              disabled
              className={`${inputBase} opacity-60 cursor-not-allowed`}
            />
          </div>

          {/* Phone */}
          <div>
            <label className={fieldLabel}>Phone</label>
            <input
              type="text"
              value={draft.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+1 (555) 000-0000"
              className={inputBase}
            />
          </div>

          {/* Job Title */}
          <div>
            <label className={fieldLabel}>Job Title</label>
            <input
              type="text"
              value={draft.jobTitle}
              onChange={(e) => handleChange('jobTitle', e.target.value)}
              className={inputBase}
            />
          </div>

          {/* Department */}
          <div>
            <label className={fieldLabel}>Department</label>
            <input
              type="text"
              value={draft.department}
              onChange={(e) => handleChange('department', e.target.value)}
              className={inputBase}
            />
          </div>

          {/* Timezone */}
          <div>
            <label className={fieldLabel}>Timezone</label>
            <select
              value={draft.timezone}
              onChange={(e) => handleChange('timezone', e.target.value)}
              className={`${inputBase} cursor-pointer`}
            >
              <option value="">Select timezone</option>
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Bio — full width */}
        <div className="mt-5">
          <label className={fieldLabel}>Bio</label>
          <textarea
            rows={3}
            value={draft.bio}
            onChange={(e) => handleChange('bio', e.target.value)}
            className={`${inputBase} resize-none`}
          />
        </div>
      </>
    );
  }

  return (
    <div className="bg-surface-card border border-surface-border rounded-2xl p-6 shadow-sm">
      {/* Header row */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-ink uppercase tracking-wider">
          Personal Information
        </h3>
        {!editing && (
          <button
            onClick={startEditing}
            className="flex items-center gap-1.5 text-sm font-medium text-brand-violet hover:text-brand-violet-dark transition-colors cursor-pointer"
          >
            <Pencil size={14} />
            Edit
          </button>
        )}
      </div>

      {/* Success banner */}
      {successMsg && (
        <div className="mb-5 flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg p-3 text-sm animate-fade-in">
          <Check size={16} className="shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Error banner (near Save in edit mode) shown at top */}
      {error && editing && (
        <div className="mb-5 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm animate-fade-in">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {editing ? renderEditForm() : renderReadOnly()}

      {/* Action buttons in edit mode */}
      {editing && (
        <div className="flex items-center gap-3 mt-6 pt-5 border-t border-surface-border">
          <button
            onClick={handleSave}
            disabled={updating}
            className="flex items-center gap-2 bg-brand-violet hover:bg-brand-violet-dark disabled:bg-brand-violet/60 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-all shadow-sm cursor-pointer"
          >
            {updating ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            onClick={cancelEditing}
            disabled={updating}
            className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink transition-colors cursor-pointer"
          >
            <X size={14} />
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
