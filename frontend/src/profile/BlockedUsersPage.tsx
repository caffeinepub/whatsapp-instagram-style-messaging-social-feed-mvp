import { useGetBlockedUsers, useUnblockUser, useGetPublicUserProfile } from '../hooks/useQueries';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import LoadingState from '../components/states/LoadingState';
import ErrorState from '../components/states/ErrorState';
import EmptyState from '../components/states/EmptyState';
import { toast } from 'sonner';

function BlockedUserCard({ userId }: { userId: string }) {
  const { data: profile } = useGetPublicUserProfile(userId);
  const unblockMutation = useUnblockUser();

  const handleUnblock = async () => {
    try {
      await unblockMutation.mutateAsync(userId);
      toast.success(`Unblocked @${profile?.username || 'user'}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to unblock user');
    }
  };

  if (!profile) {
    return null;
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Avatar>
              <AvatarFallback>
                {profile.displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="font-semibold truncate">{profile.displayName}</p>
              <p className="text-sm text-muted-foreground truncate">@{profile.username}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleUnblock}
            disabled={unblockMutation.isPending}
          >
            {unblockMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Unblock
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function BlockedUsersPage() {
  const { data: blockedUsers, isLoading, isError, error, refetch } = useGetBlockedUsers();

  if (isLoading) {
    return <LoadingState message="Loading blocked users..." />;
  }

  if (isError) {
    return (
      <div className="p-4 md:p-6">
        <ErrorState
          message={error instanceof Error ? error.message : 'Failed to load blocked users'}
          onRetry={refetch}
        />
      </div>
    );
  }

  if (!blockedUsers || blockedUsers.length === 0) {
    return (
      <div className="p-4 md:p-6">
        <EmptyState
          title="No blocked users"
          message="Users you block will appear here"
          actionLabel="Back to Profile"
          actionPath="/profile"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 pb-24 md:p-6 md:pb-6">
      <h1 className="text-2xl font-bold">Blocked Users</h1>
      <div className="space-y-3">
        {blockedUsers.map((userId) => (
          <BlockedUserCard key={userId.toString()} userId={userId.toString()} />
        ))}
      </div>
    </div>
  );
}
