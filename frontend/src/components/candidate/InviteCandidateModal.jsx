import { useState } from 'react';
import Modal from '../ui/Modal';
import { sendInvitation } from '../../api/invitationService';
import { Copy, CheckCircle2, Loader2, Send } from 'lucide-react';

export default function InviteCandidateModal({ isOpen, onClose, testId }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  // Reset internal state when the modal closes or opens fresh
  const handleClose = () => {
    setEmail('');
    setSuccessData(null);
    setCopied(false);
    setError('');
    onClose();
  };

  const handleInviteAnother = () => {
    setEmail('');
    setSuccessData(null);
    setCopied(false);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError('');
    
    try {
      // Guess name from email (e.g. john.doe@example.com -> John Doe)
      const namePart = email.split('@')[0];
      const guessedName = namePart
        .split(/[._-]/)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');

      const response = await sendInvitation(testId, email, guessedName);
      setSuccessData({ email, ...response });
    } catch (err) {
      setError('Failed to send invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (successData?.publicLink) {
      await navigator.clipboard.writeText(successData.publicLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Invite Candidate">
      {successData ? (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col items-center justify-center text-center space-y-3 py-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-2">
              <CheckCircle2 size={24} />
            </div>
            <h4 className="text-lg font-medium text-white">Invitation Sent!</h4>
            <p className="text-sm text-muted">
              We've emailed the unique test link to <span className="text-white font-medium">{successData.email}</span>.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted uppercase tracking-wider">Unique Test Link</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 font-mono truncate select-all">
                {successData.publicLink}
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center justify-center w-10 h-10 rounded-lg bg-brand-violet hover:bg-brand-violet-light transition-colors text-white shrink-0"
                title="Copy Link"
              >
                {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
              </button>
            </div>
          </div>

          <button
            onClick={handleInviteAnother}
            className="w-full py-2.5 text-sm font-medium text-brand-violet-light hover:text-white transition-colors mt-2"
          >
            Invite Another Candidate
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">
          <p className="text-sm text-muted leading-relaxed">
            Enter the candidate's email below. We'll generate a unique, secure link for them to access the test environment without needing an account.
          </p>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium text-white">Candidate Email</label>
            <input
              type="email"
              id="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@example.com"
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-violet/50 focus:border-brand-violet transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full flex items-center justify-center gap-2 bg-brand-violet hover:bg-brand-violet-light text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                <Send size={18} />
                Send Invitation
              </>
            )}
          </button>
        </form>
      )}
    </Modal>
  );
}
