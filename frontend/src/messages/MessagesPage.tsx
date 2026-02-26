import { useListConversations, useGetConversationDetails } from '../hooks/useQueries';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import LoadingState from '../components/states/LoadingState';
import ErrorState from '../components/states/ErrorState';
import EmptyState from '../components/states/EmptyState';
import { useNavigate } from '@tanstack/react-router';

export default function MessagesPage() {
  const { data: conversationIds, isLoading, isError, error, refetch } = useListConversations();

  if (isLoading) {
    return <LoadingState message="Loading conversations..." />;
  }

  if (isError) {
    return (
      <div className="p-4 md:p-6">
        <ErrorState
          message={error instanceof Error ? error.message : 'Failed to load conversations'}
          onRetry={refetch}
        />
      </div>
    );
  }

  if (!conversationIds || conversationIds.length === 0) {
    return (
      <EmptyState
        illustration="/assets/generated/empty-messages.dim_900x600.png"
        title="No conversations yet"
        message="Start a conversation from the Explore page"
        actionLabel="Explore Users"
        actionPath="/explore"
      />
    );
  }

  return (
    <div className="space-y-6 p-4 pb-24 md:p-6 md:pb-6">
      <h1 className="text-2xl font-bold">Messages</h1>
      <div className="space-y-2">
        {conversationIds.map((conversationId) => (
          <ConversationItem key={conversationId.toString()} conversationId={conversationId} />
        ))}
      </div>
    </div>
  );
}

function ConversationItem({ conversationId }: { conversationId: bigint }) {
  const { data: details } = useGetConversationDetails(conversationId);
  const navigate = useNavigate();

  const handleClick = () => {
    navigate({ 
      to: '/messages/$conversationId', 
      params: { conversationId: conversationId.toString() } 
    });
  };

  if (!details) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>?</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="cursor-pointer transition-colors hover:bg-accent" onClick={handleClick}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback>
              {details.otherUserName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="font-semibold">{details.otherUserName}</p>
            {details.lastMessage && (
              <p className="truncate text-sm text-muted-foreground">
                {details.lastMessage}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
