import { useState } from 'react';
import { useSendMessage } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2 } from 'lucide-react';
import { validateMessageContent } from '../validation/validators';

interface MessageComposerProps {
  conversationId: bigint;
}

export default function MessageComposer({ conversationId }: MessageComposerProps) {
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const sendMessageMutation = useSendMessage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateMessageContent(content);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    try {
      await sendMessageMutation.mutateAsync({ conversationId, content });
      setContent('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Type a message..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-1"
        />
        <Button
          type="submit"
          size="icon"
          disabled={sendMessageMutation.isPending || !content.trim()}
        >
          {sendMessageMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </form>
  );
}
