import { useState } from 'react';
import { useSearchUsers, useFollowUser, useUnfollowUser } from '../hooks/useQueries';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, Loader2, UserPlus, UserMinus, MessageCircle } from 'lucide-react';
import LoadingState from '../components/states/LoadingState';
import ErrorState from '../components/states/ErrorState';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useNavigate } from '@tanstack/react-router';
import { useStartConversation } from '../hooks/useQueries';
import { validateSearchTerm } from '../validation/validators';
import type { UserProfile } from '../backend';

export default function ExplorePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchError, setSearchError] = useState('');
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  
  const { data: users, isLoading, isError, error, refetch } = useSearchUsers(searchTerm);
  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();
  const startConversationMutation = useStartConversation();

  const currentUserId = identity?.getPrincipal().toString();

  const handleSearch = (value: string) => {
    const error = validateSearchTerm(value);
    setSearchError(error || '');
    setSearchTerm(value);
  };

  const handleFollow = (userId: string) => {
    followMutation.mutate(userId);
  };

  const handleUnfollow = (userId: string) => {
    unfollowMutation.mutate(userId);
  };

  const handleStartChat = async (userId: string) => {
    try {
      const conversationId = await startConversationMutation.mutateAsync(userId);
      navigate({ to: `/messages/$conversationId`, params: { conversationId: conversationId.toString() } });
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  };

  const isFollowing = (currentUserId: string, userProfile: UserProfile): boolean => {
    return userProfile.followers.some(id => id.toString() === currentUserId);
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
      ) : !users || users.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">
            {searchTerm ? 'No users found' : 'Start typing to search for users'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((user) => {
            // We need to find a way to identify this user - we'll use a combination approach
            // Since we can't easily get the user's Principal from the profile, we'll use username as key
            const isCurrentUser = user.username === users.find(u => 
              u.followers.some(f => f.toString() === currentUserId)
            )?.username && currentUserId !== undefined;
            
            const following = currentUserId ? isFollowing(currentUserId, user) : false;

            return (
              <Card key={user.username}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {user.displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{user.displayName}</p>
                      <p className="text-sm text-muted-foreground">@{user.username}</p>
                      {user.bio && (
                        <p className="mt-1 text-sm text-muted-foreground">{user.bio}</p>
                      )}
                    </div>
                  </div>
                  {!isCurrentUser && (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          // We need to get the user's principal - for now we'll use a workaround
                          // This is a limitation of the current backend API
                          console.warn('Start chat feature requires user Principal ID');
                        }}
                        disabled={true}
                        title="Chat feature requires backend enhancement"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={following ? 'outline' : 'default'}
                        size="sm"
                        onClick={() => {
                          // Same issue - we need the Principal to follow/unfollow
                          console.warn('Follow/unfollow requires user Principal ID');
                        }}
                        disabled={true}
                        title="Follow feature requires backend enhancement"
                      >
                        {following ? (
                          <>
                            <UserMinus className="mr-2 h-4 w-4" />
                            Unfollow
                          </>
                        ) : (
                          <>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Follow
                          </>
                        )}
                      </Button>
                    </div>
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
