import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  Loader2,
  Lock,
  MessageCircle,
  Phone,
  ShieldBan,
  ShieldCheck,
  UserMinus,
  UserPlus,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import InitiateCallDialog from "../calls/InitiateCallDialog";
import ErrorState from "../components/states/ErrorState";
import LoadingState from "../components/states/LoadingState";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useBlockUser,
  useFollowUser,
  useGetCallerUserProfile,
  useGetUserProfile,
  useStartConversation,
  useUnblockUser,
  useUnfollowUser,
} from "../hooks/useQueries";

export default function UserProfilePage() {
  const { userId } = useParams({ from: "/profile/$userId" });
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [callDialogOpen, setCallDialogOpen] = useState(false);

  const {
    data: userProfile,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetUserProfile(userId);
  const { data: currentUserProfile } = useGetCallerUserProfile();
  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();
  const startConversationMutation = useStartConversation();
  const blockMutation = useBlockUser();
  const unblockMutation = useUnblockUser();

  const isAuthenticated = !!identity;
  const currentUserId = identity?.getPrincipal().toString();
  const isOwnProfile = currentUserId === userId;

  const isFollowing =
    currentUserProfile?.following.some((id) => id.toString() === userId) ||
    false;
  const isBlocked =
    currentUserProfile?.blockedUsers.some((id) => id.toString() === userId) ||
    false;

  const handleFollow = async () => {
    if (!isAuthenticated) {
      toast.error("Please log in to follow users");
      return;
    }
    try {
      await followMutation.mutateAsync(userId);
      toast.success(`You are now following @${userProfile?.username}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to follow user",
      );
    }
  };

  const handleUnfollow = async () => {
    if (!isAuthenticated) {
      toast.error("Please log in to unfollow users");
      return;
    }
    try {
      await unfollowMutation.mutateAsync(userId);
      toast.success(`You unfollowed @${userProfile?.username}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to unfollow user",
      );
    }
  };

  const handleStartChat = async () => {
    if (!isAuthenticated) {
      toast.error("Please log in to start conversations");
      return;
    }
    try {
      const conversationId =
        await startConversationMutation.mutateAsync(userId);
      navigate({
        to: "/messages/$conversationId",
        params: { conversationId: conversationId.toString() },
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to start conversation",
      );
    }
  };

  const handleBlock = async () => {
    if (!isAuthenticated) {
      toast.error("Please log in to block users");
      return;
    }
    try {
      await blockMutation.mutateAsync(userId);
      toast.success(`You blocked @${userProfile?.username}`);
      setBlockDialogOpen(false);
      navigate({ to: "/explore" });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to block user",
      );
    }
  };

  const handleUnblock = async () => {
    if (!isAuthenticated) {
      toast.error("Please log in to unblock users");
      return;
    }
    try {
      await unblockMutation.mutateAsync(userId);
      toast.success(`You unblocked @${userProfile?.username}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to unblock user",
      );
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading profile..." />;
  }

  if (isError) {
    return (
      <div className="container mx-auto max-w-4xl p-4 md:p-6">
        <ErrorState
          message={
            error instanceof Error ? error.message : "Failed to load profile"
          }
          onRetry={refetch}
        />
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="container mx-auto max-w-4xl p-4 md:p-6">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="rounded-full bg-muted p-4">
              <Lock className="h-12 w-12 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Profile Not Available</h2>
              <p className="text-muted-foreground">
                {isAuthenticated
                  ? "This profile is private or you don't have permission to view it."
                  : "Please log in to view this profile."}
              </p>
            </div>
            {!isAuthenticated && (
              <Button onClick={() => navigate({ to: "/" })}>Go to Login</Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      <Card>
        <CardContent className="space-y-6 p-6">
          {/* Profile Header */}
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            <Avatar className="h-24 w-24">
              <AvatarFallback className="text-3xl">
                {userProfile.displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">
                    {userProfile.displayName}
                  </h1>
                  {userProfile.online && (
                    <Badge
                      variant="outline"
                      className="border-green-500 text-green-500"
                    >
                      Online
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground">@{userProfile.username}</p>
              </div>
              {!isOwnProfile && isAuthenticated && (
                <div className="flex flex-wrap gap-2">
                  {!isBlocked && (
                    <>
                      <Button
                        variant={isFollowing ? "outline" : "default"}
                        onClick={isFollowing ? handleUnfollow : handleFollow}
                        disabled={
                          followMutation.isPending || unfollowMutation.isPending
                        }
                      >
                        {followMutation.isPending ||
                        unfollowMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : isFollowing ? (
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
                      <Button
                        variant="outline"
                        onClick={handleStartChat}
                        disabled={startConversationMutation.isPending}
                      >
                        {startConversationMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <MessageCircle className="mr-2 h-4 w-4" />
                            Message
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setCallDialogOpen(true)}
                      >
                        <Phone className="mr-2 h-4 w-4" />
                        Call
                      </Button>
                    </>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon">
                        <ShieldBan className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {isBlocked ? (
                        <DropdownMenuItem onClick={handleUnblock}>
                          <ShieldCheck className="mr-2 h-4 w-4" />
                          Unblock
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => setBlockDialogOpen(true)}
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
            </div>
          </div>

          <Separator />

          {/* Stats */}
          <div className="flex gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold">
                {userProfile.followers.length}
              </p>
              <p className="text-sm text-muted-foreground">Followers</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">
                {userProfile.following.length}
              </p>
              <p className="text-sm text-muted-foreground">Following</p>
            </div>
          </div>

          {/* Bio */}
          {userProfile.bio && (
            <>
              <Separator />
              <div className="space-y-2">
                <h2 className="font-semibold">Bio</h2>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {userProfile.bio}
                </p>
              </div>
            </>
          )}

          {/* Privacy Badge */}
          <div className="flex items-center gap-2">
            <Badge
              variant={
                userProfile.privacy === "profilePublic"
                  ? "default"
                  : "secondary"
              }
            >
              {userProfile.privacy === "profilePublic"
                ? "Public Profile"
                : "Private Profile"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Block Dialog */}
      <AlertDialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block @{userProfile.username}?</AlertDialogTitle>
            <AlertDialogDescription>
              This user will no longer be able to see your posts or contact you.
              You will also unfollow each other.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBlock}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Block
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Call Dialog */}
      <InitiateCallDialog
        open={callDialogOpen}
        onOpenChange={setCallDialogOpen}
        targetUserId={userId}
        targetUserName={userProfile.displayName}
      />
    </div>
  );
}
