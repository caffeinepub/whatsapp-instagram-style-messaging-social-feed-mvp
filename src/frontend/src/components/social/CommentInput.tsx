import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { PostId } from "../../backend";
import { useAddComment } from "../../hooks/useQueries";
import { validateCommentText } from "../../validation/validators";

interface CommentInputProps {
  postId: PostId;
}

export default function CommentInput({ postId }: CommentInputProps) {
  const [commentText, setCommentText] = useState("");
  const addCommentMutation = useAddComment();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const error = validateCommentText(commentText);
    if (error) {
      toast.error(error);
      return;
    }

    try {
      await addCommentMutation.mutateAsync({ postId, text: commentText });
      setCommentText("");
      toast.success("Comment added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add comment");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        type="text"
        placeholder="Add a comment..."
        value={commentText}
        onChange={(e) => setCommentText(e.target.value)}
        disabled={addCommentMutation.isPending}
        className="flex-1"
      />
      <Button
        type="submit"
        size="icon"
        disabled={addCommentMutation.isPending || !commentText.trim()}
      >
        {addCommentMutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </form>
  );
}
