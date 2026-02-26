import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Heart, MessageCircle, Video as VideoIcon, Bookmark, Share2, MoreHorizontal, Trash2, Loader2 } from 'lucide-react';
import type { Post } from '../../backend';
import { useGetUserProfile, useLikePost, useUnlikePost, useSavePost, useUnsavePost, useGetCallerUserProfile, useDeletePost } from '../../hooks/useQueries';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { ContentType } from '../../backend';
import CommentsList from './CommentsList';
import CommentInput from './CommentInput';
import { toast } from 'sonner';

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const { data: authorProfile } = useGetUserProfile(post.author.toString());
  const { data: currentUserProfile } = useGetCallerUserProfile();
  const { identity } = useInternetIdentity();
  const likePostMutation = useLikePost();
  const unlikePostMutation = useUnlikePost();
  const savePostMutation = useSavePost();
  const unsavePostMutation = useUnsavePost();
  const deletePostMutation = useDeletePost();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const currentUserId = identity?.getPrincipal().toString();
  const hasLiked = currentUserId ? post.likes.some(id => id.toString() === currentUserId) : false;
  const isSaved = currentUserProfile?.savedPosts.some(id => id.toString() === post.id.toString()) || false;
  const isReel = post.contentType === ContentType.reel;
  const isOwner = currentUserId ? post.author.toString() === currentUserId : false;

  const handleLikeToggle = async () => {
    try {
      if (hasLiked) {
        await unlikePostMutation.mutateAsync(post.id);
      } else {
        await likePostMutation.mutateAsync(post.id);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update like');
    }
  };

  const handleSaveToggle = async () => {
    try {
      if (isSaved) {
        await unsavePostMutation.mutateAsync(post.id);
        toast.success('Post removed from saved');
      } else {
        await savePostMutation.mutateAsync(post.id);
        toast.success('Post saved');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update saved status');
    }
  };

  const handleShare = async () => {
    try {
      const postUrl = `${window.location.origin}/?post=${post.id}`;
      await navigator.clipboard.writeText(postUrl);
      toast.success('Post link copied to clipboard');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deletePostMutation.mutateAsync(post.id);
      toast.success('Post deleted successfully');
      setShowDeleteDialog(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete post');
      setShowDeleteDialog(false);
    }
  };

  const mediaItems = post.media ?? [];

  const renderMediaItem = (url: string, index: number, isVideo: boolean) => {
    if (isVideo) {
      return (
        <video
          key={index}
          src={url}
          controls
          className="w-full aspect-[9/16] object-cover bg-muted"
          playsInline
        />
      );
    }
    return (
      <img
        key={index}
        src={url}
        alt={`Post content${index > 0 ? ` ${index + 1}` : ''}`}
        className="w-full object-cover bg-muted"
      />
    );
  };

  return (
    <>
      <Card>
        <CardContent className="p-0">
          {/* Author Header */}
          <div className="p-4">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>
                  {authorProfile?.displayName?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{authorProfile?.displayName || 'Unknown User'}</p>
                  {isReel && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      <VideoIcon className="h-3 w-3" />
                      Reel
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  @{authorProfile?.username || 'unknown'}
                </p>
              </div>

              {/* Owner actions menu */}
              {isOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Post options</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive gap-2"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete {isReel ? 'Reel' : 'Post'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* Caption */}
          {post.caption && (
            <div className="px-4 pb-3">
              <p className="text-sm whitespace-pre-wrap">{post.caption}</p>
            </div>
          )}

          {/* Media Content */}
          {mediaItems.length > 0 && (
            <div className="relative">
              {mediaItems.length === 1 ? (
                renderMediaItem(mediaItems[0].url, 0, isReel || mediaItems[0].url.startsWith('data:video'))
              ) : (
                <Carousel className="w-full">
                  <CarouselContent>
                    {mediaItems.map((asset, index) => (
                      <CarouselItem key={index}>
                        {renderMediaItem(
                          asset.url,
                          index,
                          isReel || asset.url.startsWith('data:video')
                        )}
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  {mediaItems.length > 1 && (
                    <>
                      <CarouselPrevious className="left-2" />
                      <CarouselNext className="right-2" />
                    </>
                  )}
                </Carousel>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLikeToggle}
                disabled={likePostMutation.isPending || unlikePostMutation.isPending}
                className="gap-2"
              >
                <Heart
                  className={`h-5 w-5 ${hasLiked ? 'fill-red-500 text-red-500' : ''}`}
                />
                <span>{post.likes.length}</span>
              </Button>
              <Button variant="ghost" size="sm" className="gap-2">
                <MessageCircle className="h-5 w-5" />
                <span>{post.comments.length}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSaveToggle}
                disabled={savePostMutation.isPending || unsavePostMutation.isPending}
              >
                <Bookmark className={`h-5 w-5 ${isSaved ? 'fill-current' : ''}`} />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleShare}>
                <Share2 className="h-5 w-5" />
              </Button>
            </div>

            <Separator />

            {/* Comments Section */}
            <div className="space-y-3">
              {post.comments.length > 0 && (
                <CommentsList comments={post.comments} />
              )}
              <CommentInput postId={post.id} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {isReel ? 'Reel' : 'Post'}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this {isReel ? 'reel' : 'post'}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePostMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deletePostMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletePostMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
