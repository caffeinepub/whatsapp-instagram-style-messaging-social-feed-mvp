import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Send, MessageSquare, Loader2, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import LoadingState from '../components/states/LoadingState';
import { useGetGroupMessages, useSendGroupMessage, useMyGroups, useGetPublicUserProfile } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import type { GroupMessage, GroupId } from '../backend';

function formatTime(timestamp: bigint): string {
  const ms = Number(timestamp);
  if (ms === 0) {
    return 'just now';
  }
  const date = new Date(ms);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(timestamp: bigint): string {
  const ms = Number(timestamp);
  if (ms === 0) return '';
  const date = new Date(ms);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

function MessageBubble({
  message,
  isOwn,
}: {
  message: GroupMessage;
  isOwn: boolean;
}) {
  const senderStr = message.sender.toString();
  const { data: profile } = useGetPublicUserProfile(senderStr);

  const initials = profile?.displayName
    ? profile.displayName.slice(0, 2).toUpperCase()
    : senderStr.slice(0, 2).toUpperCase();

  const displayName = profile?.displayName ?? senderStr.slice(0, 8) + '…';

  return (
    <div className={`flex gap-2 items-end ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isOwn && (
        <Avatar className="h-7 w-7 shrink-0 mb-1">
          <AvatarFallback className="text-xs bg-primary/10 text-primary">{initials}</AvatarFallback>
        </Avatar>
      )}
      <div className={`flex flex-col gap-0.5 max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {!isOwn && (
          <span className="text-xs text-muted-foreground font-medium px-1">{displayName}</span>
        )}
        <div
          className={`px-3 py-2 rounded-2xl text-sm leading-relaxed break-words ${
            isOwn
              ? 'bg-primary text-primary-foreground rounded-br-sm'
              : 'bg-muted text-foreground rounded-bl-sm'
          }`}
        >
          {message.content}
        </div>
        <span className="text-xs text-muted-foreground px-1">{formatTime(message.timestamp)}</span>
      </div>
    </div>
  );
}

function DateDivider({ label }: { label: string }) {
  if (!label) return null;
  return (
    <div className="flex items-center gap-3 my-3">
      <div className="flex-1 h-px bg-border" />
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

export default function GroupChatPage() {
  const { groupId: groupIdStr } = useParams({ from: '/groups/$groupId/chat' });
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const [messageText, setMessageText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const groupIdBigInt = BigInt(groupIdStr) as GroupId;

  const { data: myGroups, isLoading: groupsLoading } = useMyGroups();
  const group = myGroups?.find((g) => g.id.toString() === groupIdStr);

  const {
    data: messages,
    isLoading: messagesLoading,
    error: messagesError,
  } = useGetGroupMessages(groupIdBigInt);

  const sendMessage = useSendGroupMessage();

  const currentUserId = identity?.getPrincipal().toString();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const content = messageText.trim();
    if (!content) return;

    setMessageText('');
    try {
      await sendMessage.mutateAsync({ groupId: groupIdBigInt, content });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send message.';
      toast.error(msg);
      setMessageText(content);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Not authenticated
  if (!identity) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <ShieldAlert className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
        <p className="font-semibold text-lg">Authentication required</p>
        <p className="text-sm text-muted-foreground">Please log in to view group chats.</p>
        <Button onClick={() => navigate({ to: '/groups' })}>Back to Groups</Button>
      </div>
    );
  }

  // Loading groups to verify membership
  if (groupsLoading) {
    return <LoadingState message="Loading group…" />;
  }

  // Group not found or user is not a member
  if (!group) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <ShieldAlert className="h-12 w-12 mx-auto text-destructive opacity-70" />
        <p className="font-semibold text-lg">Access Denied</p>
        <p className="text-sm text-muted-foreground">
          You are not a member of this group or the group does not exist.
        </p>
        <Button onClick={() => navigate({ to: '/groups' })}>Back to Groups</Button>
      </div>
    );
  }

  // Group messages with date separators
  const messageList = messages ?? [];

  // Build list with date separators
  const renderedItems: Array<{ type: 'date'; label: string } | { type: 'message'; msg: GroupMessage }> = [];
  let lastDateLabel = '';
  for (const msg of messageList) {
    const label = formatDate(msg.timestamp);
    if (label && label !== lastDateLabel) {
      renderedItems.push({ type: 'date', label });
      lastDateLabel = label;
    }
    renderedItems.push({ type: 'message', msg });
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-background shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate({ to: '/groups/$groupId', params: { groupId: groupIdStr } })}
          className="-ml-1"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{group.name}</p>
          <p className="text-xs text-muted-foreground">
            {group.members.length} member{group.members.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Messages area */}
      <ScrollArea className="flex-1 px-4 py-3">
        {messagesLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {messagesError && (
          <div className="text-center py-8 text-sm text-destructive">
            Failed to load messages. You may not be a member of this group.
          </div>
        )}

        {!messagesLoading && !messagesError && messageList.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 space-y-3 text-center">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
              <MessageSquare className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="font-medium text-muted-foreground">No messages yet</p>
            <p className="text-sm text-muted-foreground">
              Be the first to say something in <span className="font-semibold">{group.name}</span>!
            </p>
          </div>
        )}

        {!messagesLoading && !messagesError && renderedItems.length > 0 && (
          <div className="space-y-2 pb-2">
            {renderedItems.map((item, idx) => {
              if (item.type === 'date') {
                return <DateDivider key={`date-${idx}`} label={item.label} />;
              }
              const isOwn = item.msg.sender.toString() === currentUserId;
              return (
                <MessageBubble
                  key={`msg-${idx}`}
                  message={item.msg}
                  isOwn={isOwn}
                />
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}

        {/* Anchor for auto-scroll when empty */}
        {messageList.length === 0 && <div ref={bottomRef} />}
      </ScrollArea>

      {/* Message composer */}
      <div className="px-4 py-3 border-t bg-background shrink-0">
        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${group.name}…`}
            className="resize-none min-h-[44px] max-h-32 flex-1"
            rows={1}
            disabled={sendMessage.isPending}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!messageText.trim() || sendMessage.isPending}
            className="shrink-0 h-11 w-11"
          >
            {sendMessage.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">
          Press <kbd className="px-1 py-0.5 rounded bg-muted text-xs font-mono">Enter</kbd> to send,{' '}
          <kbd className="px-1 py-0.5 rounded bg-muted text-xs font-mono">Shift+Enter</kbd> for new line
        </p>
      </div>
    </div>
  );
}
