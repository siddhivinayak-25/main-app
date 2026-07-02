import Avatar from '../ui/Avatar';

export default function ProfileHeader({ user }) {
  return (
    <div className="bg-surface-card border border-surface-border rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-5">
        <Avatar name={user.name} size="lg" />

        <div className="min-w-0">
          <h2 className="text-xl font-display font-semibold text-ink truncate">
            {user.name}
          </h2>
          {(user.jobTitle || user.department) && (
            <p className="text-sm text-muted mt-0.5 truncate">
              {[user.jobTitle, user.department].filter(Boolean).join(' · ')}
            </p>
          )}
          {user.joinedOn && (
            <p className="text-xs text-muted mt-1">
              Joined {user.joinedOn}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
