import { useState } from 'react';
import PageHeader from '../components/layout/PageHeader';
import ProfileHeader from '../components/profile/ProfileHeader';
import PersonalInfoForm from '../components/profile/PersonalInfoForm';
import SecurityForm from '../components/profile/SecurityForm';
import Skeleton from '../components/ui/Skeleton';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useUpdateProfile } from '../hooks/useUpdateProfile';

const tabs = ['Personal Info', 'Security'];

export default function Profile() {
  const { data: user, loading } = useCurrentUser();
  const { updateProfile, updating } = useUpdateProfile();
  const [activeTab, setActiveTab] = useState('Personal Info');

  if (loading) {
    return (
      <div className="animate-fade-in space-y-6">
        {/* PageHeader skeleton */}
        <div className="mb-6">
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>

        {/* ProfileHeader skeleton */}
        <div className="bg-surface-card border border-surface-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-5">
            <Skeleton className="w-20 h-20 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </div>

        {/* Tab row skeleton */}
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>

        {/* Form card skeleton */}
        <div className="bg-surface-card border border-surface-border rounded-2xl p-6 shadow-sm space-y-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Profile"
        subtitle="Manage your account information"
      />

      <ProfileHeader user={user} />

      {/* Tab row */}
      <div className="flex items-center gap-2">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
              activeTab === t
                ? 'bg-brand-violet-light text-brand-violet-dark'
                : 'text-muted hover:text-ink'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'Personal Info' ? (
        <PersonalInfoForm user={user} onSave={updateProfile} updating={updating} />
      ) : (
        <SecurityForm />
      )}
    </div>
  );
}

