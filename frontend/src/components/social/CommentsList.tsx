import { useGetPublicUserProfile } from '../../hooks/useQueries';
import type { Comment } from '../../backend';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2 } from 'lucide-react';

interface CommentsListProps {
  comments: Comment[];
}

function CommentItem({ comment }: { comment: Comment }) {
  const { data: authorProfile, isLoading } = useGetPublicUserProfile(comment.authorId.toString());

  if (isLoading) {
    return (
      <div className="flex gap-3 py-2">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex gap-3 py-2">
      <Avatar className="h-8 w-8">
        <AvatarFallback className="text-xs">
          {authorProfile?.displayName?.charAt(0).toUpperCase() || 'U'}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-sm">
            {authorProfile?.displayName || 'Unknown User'}
          </span>
          <span className="text-xs text-muted-foreground">
            @{authorProfile?.username || 'unknown'}
          </span>
        </div>
        <p className="text-sm break-words">{comment.text}</p>
      </div>
    </div>
  );
}

export default function CommentsList({ comments }: CommentsListProps) {
  if (comments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No comments yet. Be the first to comment!
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {comments.map((comment) => (
        <CommentItem key={comment.commentId.toString()} comment={comment} />
      ))}
    </div>
  );
}
