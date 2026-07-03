import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Send, Copy, CheckCircle2, RefreshCw, XCircle,
  ChevronDown, Search, ExternalLink, Loader2,
  Clock, CheckCheck, AlertTriangle, Ban,
} from 'lucide-react';
import { getInvitations, revokeInvitation, resendInvitation } from '../api/invitationService';
import PageHeader from '../components/layout/PageHeader';
import InviteCandidateModal from '../components/candidate/InviteCandidateModal';
import EmptyState from '../components/ui/EmptyState';
import Skeleton from '../components/ui/Skeleton';

/* ── Status chip ─────────────────────────────────────── */
const STATUS_CONFIG = {
  pending:   { label: 'Pending',   icon: Clock,         bg: 'bg-amber-500/10',   text: 'text-amber-400',  border: 'border-amber-500/20' },
  started:   { label: 'Started',   icon: RefreshCw,     bg: 'bg-blue-500/10',    text: 'text-blue-400',   border: 'border-blue-500/20'  },
  submitted: { label: 'Submitted', icon: CheckCheck,    bg: 'bg-emerald-500/10', text: 'text-emerald-400',border: 'border-emerald-500/20'},
  expired:   { label: 'Expired',   icon: AlertTriangle, bg: 'bg-surface-hover',  text: 'text-muted',      border: 'border-surface-border'},
  revoked:   { label: 'Revoked',   icon: Ban,           bg: 'bg-red-500/10',     text: 'text-red-400',    border: 'border-red-500/20'   },
};

function StatusChip({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <Icon size={11} />
      {cfg.label}
    </span>
  );
}

/* ── Copy button ─────────────────────────────────────── */
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button onClick={handleCopy} title="Copy link"
      className="p-1.5 rounded-lg text-muted hover:text-brand-violet hover:bg-brand-violet-light transition-colors">
      {copied ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Copy size={14} />}
    </button>
  );
}

/* ── Row actions ─────────────────────────────────────── */
function RowActions({ invitation, onRevoke, onResend }) {
  const [loading, setLoading] = useState(null);
  const canResend  = ['pending', 'expired', 'revoked'].includes(invitation.status);
  const canRevoke  = ['pending', 'started'].includes(invitation.status);
  const testLink   = `/test/${invitation.testId}?token=${invitation.invitationToken}`;
  const fullLink   = `${window.location.origin}${testLink}`;

  async function handleRevoke() {
    if (!confirm(`Revoke invitation for ${invitation.candidateEmail}?`)) return;
    setLoading('revoke');
    try { await onRevoke(invitation.id); } finally { setLoading(null); }
  }

  async function handleResend() {
    setLoading('resend');
    try { await onResend(invitation.id); } finally { setLoading(null); }
  }

  return (
    <div className="flex items-center gap-1">
      <CopyButton text={fullLink} />
      <a href={testLink} target="_blank" rel="noreferrer"
        className="p-1.5 rounded-lg text-muted hover:text-brand-violet hover:bg-brand-violet-light transition-colors"
        title="Open test link">
        <ExternalLink size={14} />
      </a>
      {canResend && (
        <button onClick={handleResend} disabled={!!loading} title="Resend / extend expiry"
          className="p-1.5 rounded-lg text-muted hover:text-blue-400 hover:bg-blue-500/10 transition-colors disabled:opacity-50">
          {loading === 'resend' ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
        </button>
      )}
      {canRevoke && (
        <button onClick={handleRevoke} disabled={!!loading} title="Revoke invitation"
          className="p-1.5 rounded-lg text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50">
          {loading === 'revoke' ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
        </button>
      )}
    </div>
  );
}

/* ── Main page ───────────────────────────────────────── */
export default function InvitationsDashboard() {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [inviteModalTestId, setInviteModalTestId] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getInvitations();
      setInvitations(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleRevoke(id) {
    await revokeInvitation(id);
    setInvitations((prev) => prev.map((inv) => inv.id === id ? { ...inv, status: 'revoked' } : inv));
  }

  async function handleResend(id) {
    await resendInvitation(id);
    await load();
  }

  // Filter
  const filtered = invitations.filter((inv) => {
    const matchSearch = !search ||
      inv.candidateEmail.toLowerCase().includes(search.toLowerCase()) ||
      inv.candidateName?.toLowerCase().includes(search.toLowerCase()) ||
      inv.testName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Stats
  const stats = {
    total:     invitations.length,
    pending:   invitations.filter((i) => i.status === 'pending').length,
    started:   invitations.filter((i) => i.status === 'started').length,
    submitted: invitations.filter((i) => i.status === 'submitted').length,
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Invitations"
        subtitle="Track all candidate invitations across your tests"
        action={
          <button
            onClick={() => setInviteModalTestId('pick')}
            className="flex items-center gap-2 px-4 py-2 bg-brand-violet hover:bg-brand-violet-light text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            <Send size={15} /> Send Invitation
          </button>
        }
      />

      {/* Stats strip */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Sent',  value: stats.total,     color: 'text-ink' },
          { label: 'Pending',     value: stats.pending,   color: 'text-amber-400' },
          { label: 'In Progress', value: stats.started,   color: 'text-blue-400' },
          { label: 'Submitted',   value: stats.submitted, color: 'text-emerald-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-surface-card border border-surface-border rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-muted mb-2">{label}</p>
            <span className={`text-2xl font-display font-semibold ${color}`}>{value}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or test…"
            className="w-full bg-surface border border-surface-border rounded-lg pl-9 pr-4 py-2 text-sm text-ink placeholder:text-muted/60 focus:outline-none focus:border-brand-violet/50 transition-colors"
          />
        </div>

        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none bg-surface border border-surface-border rounded-lg pl-3 pr-8 py-2 text-sm text-ink focus:outline-none focus:border-brand-violet/50 transition-colors cursor-pointer"
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="started">Started</option>
            <option value="submitted">Submitted</option>
            <option value="expired">Expired</option>
            <option value="revoked">Revoked</option>
          </select>
          <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-card border border-surface-border rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12" />)}
          </div>
        ) : error ? (
          <div className="p-10 text-center text-red-400 text-sm">{error}</div>
        ) : !filtered.length ? (
          <EmptyState
            title={search || statusFilter !== 'all' ? 'No matching invitations' : 'No invitations yet'}
            description={search || statusFilter !== 'all' ? 'Try adjusting your filters.' : 'Send your first invitation from a test page.'}
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border">
                {['Candidate', 'Test', 'Status', 'Sent', 'Expires', 'Score', ''].map((h) => (
                  <th key={h} className="text-left text-xs font-medium text-muted px-5 py-3 first:pl-6 last:pr-6">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
                <tr key={inv.id} className="border-b border-surface-border last:border-0 hover:bg-surface-hover/30 transition-colors">
                  {/* Candidate */}
                  <td className="px-5 py-3 pl-6">
                    <p className="font-medium text-ink">{inv.candidateName || '—'}</p>
                    <p className="text-xs text-muted">{inv.candidateEmail}</p>
                  </td>
                  {/* Test */}
                  <td className="px-5 py-3">
                    <Link
                      to={`/dashboard/tests/${inv.testId}`}
                      className="text-brand-violet hover:underline font-medium"
                    >
                      {inv.testName}
                    </Link>
                    {inv.testRole && <p className="text-xs text-muted">{inv.testRole}</p>}
                  </td>
                  {/* Status */}
                  <td className="px-5 py-3">
                    <StatusChip status={inv.status} />
                  </td>
                  {/* Sent */}
                  <td className="px-5 py-3 text-xs text-muted">
                    {inv.invitedAt ? new Date(inv.invitedAt).toLocaleDateString() : '—'}
                  </td>
                  {/* Expires */}
                  <td className="px-5 py-3 text-xs text-muted">
                    {inv.expiresAt ? new Date(inv.expiresAt).toLocaleDateString() : '—'}
                  </td>
                  {/* Score */}
                  <td className="px-5 py-3">
                    {inv.candidateScore != null ? (
                      <span className="font-semibold text-ink">{Math.round(inv.candidateScore)}</span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  {/* Actions */}
                  <td className="px-5 py-3 pr-6">
                    <RowActions
                      invitation={inv}
                      onRevoke={handleRevoke}
                      onResend={handleResend}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Invite modal — only shows when a specific testId is known */}
      {inviteModalTestId && inviteModalTestId !== 'pick' && (
        <InviteCandidateModal
          isOpen
          onClose={() => { setInviteModalTestId(null); load(); }}
          testId={Number(inviteModalTestId)}
        />
      )}
    </div>
  );
}
