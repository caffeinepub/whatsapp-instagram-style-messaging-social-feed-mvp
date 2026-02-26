import { useState } from 'react';
import { useSearchUsers, useFollowUser, useUnfollowUser, useStartConversation, useGetCallerUserProfile, useBlockUser, useUnblockUser } from '../hooks/useQueries';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, Loader2, UserPlus, UserMinus, MessageCircle, MoreVertical, ShieldBan, ShieldCheck } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
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
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [userToBlock, setUserToBlock] = useState<{ id: string; username: string } | null>(null);
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  
  const { data: searchResults, isLoading, isError, error, refetch } = useSearchUsers(searchTerm);
  const { data: currentUserProfile } = useGetCallerUserProfile();
  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();
  const startConversationMutation = useStartConversation();
  const blockMutation = useBlockUser();
  const unblockMutation = useUnblockUser();

  const isAuthenticated = !!identity;
  const currentUserId = identity?.getPrincipal().toString();

  const handleSearch = (value: string) => {
    const error = validateSearchTerm(value);
    setSearchError(error || '');
    setSearchTerm(value);
    setActionErrors({});
  };

  const handleFollow = async (userId: string, username: string) => {
    if (!isAuthenticated) {
      toast.error('Please log in to follow users');
      return;
    }
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
    if (!isAuthenticated) {
      toast.error('Please log in to unfollow users');
      return;
    }
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
    if (!isAuthenticated) {
      toast.error('Please log in to start conversations');
      return;
    }
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

  const openBlockDialog = (userId: string, username: string) => {
    if (!isAuthenticated) {
      toast.error('Please log in to block users');
      return;
    }
    setUserToBlock({ id: userId, username });
    setBlockDialogOpen(true);
  };

  const handleBlock = async () => {
    if (!userToBlock) return;
    
    setActionErrors(prev => ({ ...prev, [userToBlock.id]: '' }));
    try {
      await blockMutation.mutateAsync(userToBlock.id);
      toast.success(`You blocked @${userToBlock.username}`);
      setBlockDialogOpen(false);
      setUserToBlock(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to block user';
      setActionErrors(prev => ({ ...prev, [userToBlock.id]: errorMessage }));
      toast.error(errorMessage);
    }
  };

  const handleUnblock = async (userId: string, username: string) => {
    if (!isAuthenticated) {
      toast.error('Please log in to unblock users');
      return;
    }
    setActionErrors(prev => ({ ...prev, [userId]: '' }));
    try {
      await unblockMutation.mutateAsync(userId);
      toast.success(`You unblocked @${username}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to unblock user';
      setActionErrors(prev => ({ ...prev, [userId]: errorMessage }));
      toast.error(errorMessage);
    }
  };

  const handleProfileClick = (userId: string) => {
    navigate({ to: `/profile/$userId`, params: { userId } });
  };

  const isFollowing = (userId: string) => {
    return currentUserProfile?.following.some(id => id.toString() === userId) || false;
  };

  const isBlocked = (userId: string) => {
    return currentUserProfile?.blockedUsers.some(id => id.toString() === userId) || false;
  };

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Explore</h1>
        <p className="text-muted-foreground">Discover and connect with new people</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder={isAuthenticated ? "Search by username or display name..." : "Log in to search users"}
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
          disabled={!isAuthenticated}
        />
        {searchError && (
          <p className="mt-1 text-sm text-destructive">{searchError}</p>
        )}
      </div>

      {!isAuthenticated && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-primary/10 p-3">
              <Search className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Log in to explore</h3>
              <p className="text-sm text-muted-foreground">
                Sign in to search for users and connect with friends
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {isAuthenticated && isLoading && <LoadingState message="Searching users..." />}

      {isAuthenticated && isError && (
        <ErrorState
          message={error instanceof Error ? error.message : 'Failed to search users'}
          onRetry={refetch}
        />
      )}

      {isAuthenticated && searchResults && searchResults.length === 0 && searchTerm.trim() && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="rounded-full bg-muted p-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold">No users found</h3>
              <p className="text-sm text-muted-foreground">
                Try searching with a different term
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {isAuthenticated && searchResults && searchResults.length > 0 && (
        <div className="space-y-3">
          {searchResults.map((result) => {
            const userId = result.principal.toString();
            const isCurrentUser = userId === currentUserId;
            const following = isFollowing(userId);
            const blocked = isBlocked(userId);

            return (
              <Card 
                key={userId} 
                className="cursor-pointer transition-colors hover:bg-accent/50"
                onClick={() => handleProfileClick(userId)}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>
                      {result.profile.displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{result.profile.displayName}</h3>
                    <p className="text-sm text-muted-foreground truncate">@{result.profile.username}</p>
                    {result.profile.bio && (
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                        {result.profile.bio}
                      </p>
                    )}
                    {actionErrors[userId] && (
                      <p className="mt-1 text-xs text-destructive">{actionErrors[userId]}</p>
                    )}
                  </div>
                  {!isCurrentUser && (
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {!blocked && (
                        <>
                          <Button
                            size="sm"
                            variant={following ? 'outline' : 'default'}
                            onClick={() => following ? handleUnfollow(userId, result.profile.username) : handleFollow(userId, result.profile.username)}
                            disabled={followMutation.isPending || unfollowMutation.isPending}
                          >
                            {followMutation.isPending || unfollowMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : following ? (
                              <>
                                <UserMinus className="mr-1 h-4 w-4" />
                                Unfollow
                              </>
                            ) : (
                              <>
                                <UserPlus className="mr-1 h-4 w-4" />
                                Follow
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStartChat(userId, result.profile.username)}
                            disabled={startConversationMutation.isPending}
                          >
                            {startConversationMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MessageCircle className="h-4 w-4" />
                            )}
                          </Button>
                        </>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {blocked ? (
                            <DropdownMenuItem onClick={() => handleUnblock(userId, result.profile.username)}>
                              <ShieldCheck className="mr-2 h-4 w-4" />
                              Unblock
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem 
                              onClick={() => openBlockDialog(userId, result.profile.username)}
                              className="text-destructive"
                            >
                              <ShieldBan className="mr-2 h-4 w-4" />
                              Block
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block @{userToBlock?.username}?</AlertDialogTitle>
            <AlertDialogDescription>
              This user will no longer be able to see your posts or contact you. You will also unfollow each other.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBlock} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Block
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
