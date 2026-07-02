import { useState, useEffect } from 'react';
import { AlertCircle, Check, Eye, EyeOff, Trash2 } from 'lucide-react';
import { useUpdatePassword } from '../../hooks/useUpdatePassword';

const fieldLabel = 'block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wider';
const inputBase =
  'w-full bg-surface border border-surface-border rounded-lg px-3.5 py-2 text-sm placeholder:text-muted focus:outline-none focus:border-brand-violet focus:ring-1 focus:ring-brand-violet transition-all';

export default function SecurityForm() {
  const { changePassword, updating, error: hookError, success } = useUpdatePassword();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState(null);

  // On hook success, clear fields + show banner
  useEffect(() => {
    if (!success) return;
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setFieldErrors({});
    setSuccessMsg('Password updated successfully');
  }, [success]);

  // Auto-dismiss success banner
  useEffect(() => {
    if (!successMsg) return;
    const id = setTimeout(() => setSuccessMsg(null), 3000);
    return () => clearTimeout(id);
  }, [successMsg]);

  async function handleSubmit(e) {
    e.preventDefault();
    setFieldErrors({});
    setSuccessMsg(null);

    const errs = {};
    if (!currentPassword) errs.currentPassword = 'Current password is required';
    if (newPassword.length < 8) errs.newPassword = 'Password must be at least 8 characters';
    if (!confirmPassword) {
      errs.confirmPassword = 'Please confirm your new password';
    } else if (newPassword !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    try {
      await changePassword({ currentPassword, newPassword });
    } catch {
      // hookError will surface via the hook state
    }
  }

  return (
    <div className="space-y-0">
      {/* Password card */}
      <div className="bg-surface-card border border-surface-border rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-ink uppercase tracking-wider mb-5">
          Change Password
        </h3>

        {/* Success banner */}
        {successMsg && (
          <div className="mb-5 flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg p-3 text-sm animate-fade-in">
            <Check size={16} className="shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Hook-level error banner (e.g. wrong current password) */}
        {hookError && (
          <div className="mb-5 flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm animate-fade-in">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{hookError.message || 'Something went wrong'}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
          {/* Current Password */}
          <div>
            <label className={fieldLabel}>Current Password</label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                disabled={updating}
                className={`${inputBase} pr-10 ${
                  fieldErrors.currentPassword
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : ''
                }`}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition-colors"
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {fieldErrors.currentPassword && (
              <span className="text-red-600 text-xs mt-1 block">{fieldErrors.currentPassword}</span>
            )}
          </div>

          {/* New Password */}
          <div>
            <label className={fieldLabel}>New Password</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                disabled={updating}
                className={`${inputBase} pr-10 ${
                  fieldErrors.newPassword
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : ''
                }`}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition-colors"
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {fieldErrors.newPassword && (
              <span className="text-red-600 text-xs mt-1 block">{fieldErrors.newPassword}</span>
            )}
          </div>

          {/* Confirm New Password */}
          <div>
            <label className={fieldLabel}>Confirm New Password</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                disabled={updating}
                className={`${inputBase} pr-10 ${
                  fieldErrors.confirmPassword
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : ''
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition-colors"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <span className="text-red-600 text-xs mt-1 block">{fieldErrors.confirmPassword}</span>
            )}
          </div>

          <button
            type="submit"
            disabled={updating}
            className="bg-brand-violet hover:bg-brand-violet-dark disabled:bg-brand-violet/60 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-all shadow-sm cursor-pointer"
          >
            {updating ? 'Updating...' : 'Update Password'}
          </button>
        </form>

        {/* Danger Zone */}
        <div className="border-t border-surface-border pt-6 mt-6">
          <h4 className="text-sm font-semibold text-red-600 mb-1">Danger Zone</h4>
          <p className="text-xs text-muted mb-4">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <button
            type="button"
            className="flex items-center gap-2 border border-red-300 text-red-600 hover:bg-red-50 text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 size={14} />
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
