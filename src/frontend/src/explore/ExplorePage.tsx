import { useState } from 'react';
import { useSearchUsers, useFollowUser, useUnfollowUser, useStartConversation } from '../hooks/useQueries';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, Loader2, UserPlus, UserMinus, MessageCircle } from 'lucide-react';
import LoadingState from '../components/states/LoadingState';
import ErrorState from '../components/states/ErrorState';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useNavigate } from '@tanstack/react-router';
import { validateSearchTerm } from '../validation/validators';
import { toast } from 'sonner';

export default function ExplorePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchError, setSearchError] = useState('');
  const [actionErrors, setActionErrors] = useState<Record<string, string>>({});
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  
  const { data: searchResults, isLoading, isError, error, refetch } = useSearchUsers(searchTerm);
  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();
  const startConversationMutation = useStartConversation();

  const currentUserId = identity?.getPrincipal().toString();

  const handleSearch = (value: string) => {
    const error = validateSearchTerm(value);
    setSearchError(error || '');
    setSearchTerm(value);
    setActionErrors({});
  };

  const handleFollow = async (userId: string, username: string) => {
    setActionErrors(prev => ({ ...prev, [userId]: '' }));
    try {
      await followMutation.mutateAsync(userId);
      toast.success(`You are now following @${username}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to follow user';
      setActionErrors(prev => ({ ...prev, [userId]: errorMessage }));
      toast.error(errorMessage);
    }
  };

  const handleUnfollow = async (userId: string, username: string) => {
    setActionErrors(prev => ({ ...prev, [userId]: '' }));
    try {
      await unfollowMutation.mutateAsync(userId);
      toast.success(`You unfollowed @${username}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to unfollow user';
      setActionErrors(prev => ({ ...prev, [userId]: errorMessage }));
      toast.error(errorMessage);
    }
  };

  const handleStartChat = async (userId: string, username: string) => {
    setActionErrors(prev => ({ ...prev, [userId]: '' }));
    try {
      const conversationId = await startConversationMutation.mutateAsync(userId);
      navigate({ to: `/messages/$conversationId`, params: { conversationId: conversationId.toString() } });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start conversation';
      setActionErrors(prev => ({ ...prev, [userId]: errorMessage }));
      toast.error(errorMessage);
    }
  };

  const isFollowing = (currentUserId: string, followersList: Array<{ toString: () => string }>): boolean => {
    return followersList.some(id => id.toString() === currentUserId);
  };

  if (isError) {
    return (
      <div className="p-4 md:p-6">
        <ErrorState
          message={error instanceof Error ? error.message : 'Failed to search users'}
          onRetry={refetch}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 pb-24 md:p-6 md:pb-6">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Explore</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
          {searchError && (
            <p className="mt-1 text-sm text-destructive">{searchError}</p>
          )}
        </div>
      </div>

      {isLoading ? (
        <LoadingState message="Searching..." />
      ) : !searchResults || searchResults.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">
            {searchTerm ? 'No users found' : 'Start typing to search for users'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {searchResults.map((result) => {
            const userId = result.principal.toString();
            const user = result.profile;
            const isCurrentUser = userId === currentUserId;
            const following = currentUserId ? isFollowing(currentUserId, user.followers) : false;
            const isFollowLoading = followMutation.isPending && followMutation.variables === userId;
            const isUnfollowLoading = unfollowMutation.isPending && unfollowMutation.variables === userId;
            const isChatLoading = startConversationMutation.isPending && startConversationMutation.variables === userId;
            const actionError = actionErrors[userId];

            return (
              <Card key={userId}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Avatar>
                        <AvatarFallback>
                          {user.displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold truncate">{user.displayName}</p>
                        <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
                        {user.bio && (
                          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{user.bio}</p>
                        )}
                      </div>
                    </div>
                    {!isCurrentUser && (
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleStartChat(userId, user.username)}
                          disabled={isChatLoading}
                          title="Start chat"
                        >
                          {isChatLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MessageCircle className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant={following ? 'outline' : 'default'}
                          size="sm"
                          onClick={() => following ? handleUnfollow(userId, user.username) : handleFollow(userId, user.username)}
                          disabled={isFollowLoading || isUnfollowLoading}
                        >
                          {isFollowLoading || isUnfollowLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : following ? (
                            <UserMinus className="mr-2 h-4 w-4" />
                          ) : (
                            <UserPlus className="mr-2 h-4 w-4" />
                          )}
                          {following ? 'Unfollow' : 'Follow'}
                        </Button>
                      </div>
                    )}
                  </div>
                  {actionError && (
                    <p className="mt-2 text-sm text-destructive">{actionError}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
