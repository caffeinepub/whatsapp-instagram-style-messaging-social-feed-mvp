import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Phone } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import InitiateCallDialog from "../calls/InitiateCallDialog";
import ErrorState from "../components/states/ErrorState";
import LoadingState from "../components/states/LoadingState";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetMessages, useGetUserProfile } from "../hooks/useQueries";
import MessageComposer from "./MessageComposer";

export default function ChatThreadPage() {
  const { conversationId } = useParams({ from: "/messages/$conversationId" });
  const { identity } = useInternetIdentity();
  const _navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [callDialogOpen, setCallDialogOpen] = useState(false);

  const {
    data: messages,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetMessages(BigInt(conversationId));

  const currentUserId = identity?.getPrincipal().toString();

  const otherUserId = useMemo(() => {
    if (!messages || messages.length === 0 || !currentUserId) {
      return undefined;
    }
    const otherUserMessage = messages.find(
      (m) => m.sender.toString() !== currentUserId,
    );
    if (otherUserMessage) {
      return otherUserMessage.sender.toString();
    }
    return undefined;
  }, [messages, currentUserId]);

  const {
    data: receiverProfile,
    isError: profileError,
    isLoading: _profileLoading,
  } = useGetUserProfile(otherUserId || "");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  if (isLoading) {
    return <LoadingState message="Loading messages..." />;
  }

  if (isError) {
    return (
      <div className="p-4 md:p-6">
        <ErrorState
          message={
            error instanceof Error ? error.message : "Failed to load messages"
          }
          onRetry={refetch}
        />
      </div>
    );
  }

  const receiverName =
    receiverProfile?.displayName || receiverProfile?.username || "User";
  const isOnline = receiverProfile?.online || false;

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col md:h-[calc(100vh-0rem)]">
      {/* Chat Header */}
      <div className="border-b bg-background px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback>
              {receiverName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold">{receiverName}</h2>
              {receiverProfile && !profileError && (
                <div className="flex items-center gap-1.5">
                  <div
                    className={cn(
                      "h-2 w-2 rounded-full",
                      isOnline ? "bg-green-500" : "bg-gray-400",
                    )}
                  />
                  <span className="text-xs text-muted-foreground">
                    {isOnline ? "Online" : "Offline"}
                  </span>
                </div>
              )}
            </div>
            {receiverProfile?.username && (
              <p className="text-xs text-muted-foreground">
                @{receiverProfile.username}
              </p>
            )}
          </div>
          {/* Call Button */}
          {otherUserId && identity && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCallDialogOpen(true)}
              title="Call"
            >
              <Phone className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {!messages || messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isOwnMessage = message.sender.toString() === currentUserId;
              return (
                <div
                  key={message.id.toString()}
                  className={cn(
                    "flex items-end gap-2",
                    isOwnMessage && "flex-row-reverse",
                  )}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {isOwnMessage
                        ? "You"
                        : receiverName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <Card
                    className={cn(
                      "max-w-[70%] p-3",
                      isOwnMessage
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted",
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

      {/* Message Composer */}
      <div className="border-t bg-background p-4">
        <MessageComposer conversationId={BigInt(conversationId)} />
      </div>

      {/* Call Dialog */}
      {otherUserId && (
        <InitiateCallDialog
          open={callDialogOpen}
          onOpenChange={setCallDialogOpen}
          targetUserId={otherUserId}
          targetUserName={receiverName}
        />
      )}
    </div>
  );
}
