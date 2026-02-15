import { useParams } from '@tanstack/react-router';
import { useGetMessages } from '../hooks/useQueries';
import MessageComposer from './MessageComposer';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import LoadingState from '../components/states/LoadingState';
import ErrorState from '../components/states/ErrorState';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';

export default function ChatThreadPage() {
  const { conversationId } = useParams({ from: '/messages/$conversationId' });
  const { identity } = useInternetIdentity();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { data: messages, isLoading, isError, error, refetch } = useGetMessages(
    BigInt(conversationId)
  );

  const currentUserId = identity?.getPrincipal().toString();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (isLoading) {
    return <LoadingState message="Loading messages..." />;
  }

  if (isError) {
    return (
      <div className="p-4 md:p-6">
        <ErrorState
          message={error instanceof Error ? error.message : 'Failed to load messages'}
          onRetry={refetch}
        />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col md:h-[calc(100vh-0rem)]">
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {!messages || messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isOwnMessage = message.sender.toString() === currentUserId;
              return (
                <div
                  key={message.id.toString()}
                  className={cn('flex items-end gap-2', isOwnMessage && 'flex-row-reverse')}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {isOwnMessage ? 'You' : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <Card
                    className={cn(
                      'max-w-[70%] p-3',
                      isOwnMessage
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    <p className="break-words text-sm">{message.content}</p>
                  </Card>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      <div className="border-t bg-background p-4">
        <MessageComposer conversationId={BigInt(conversationId)} />
      </div>
    </div>
  );
}
