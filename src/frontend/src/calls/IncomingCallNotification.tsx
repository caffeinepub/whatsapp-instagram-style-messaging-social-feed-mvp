import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { Phone, PhoneOff } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAcceptCall,
  useDeclineCall,
  useGetIncomingCalls,
} from "../hooks/useQueries";

export default function IncomingCallNotification() {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const { data: incomingCalls } = useGetIncomingCalls();
  const acceptCall = useAcceptCall();
  const declineCall = useDeclineCall();

  const activeCall = incomingCalls?.[0] ?? null;

  useEffect(() => {
    if (!activeCall) return;
    // Play ringtone notification sound via browser notification title blink
    document.title = "📞 Incoming Call...";
    const orig = document.title;
    return () => {
      document.title = orig;
    };
  }, [activeCall]);

  if (!identity || !activeCall) return null;

  const callerId = activeCall.caller.toString();
  const shortId = `${callerId.slice(0, 8)}...`;

  const handleAccept = async () => {
    try {
      await acceptCall.mutateAsync(activeCall.id);
      navigate({
        to: "/calls/$callId",
        params: { callId: activeCall.id.toString() },
      });
    } catch {
      toast.error("Failed to accept call");
    }
  };

  const handleDecline = async () => {
    try {
      await declineCall.mutateAsync(activeCall.id);
      toast.info("Call declined");
    } catch {
      toast.error("Failed to decline call");
    }
  };

  return (
    <div
      data-ocid="incoming_call.dialog"
      className="fixed bottom-24 left-1/2 z-50 w-80 -translate-x-1/2 rounded-2xl bg-gray-900 p-4 shadow-2xl ring-1 ring-white/10 md:bottom-8"
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-gray-700 text-white">
              {callerId.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-500">
            <span className="h-2 w-2 animate-ping rounded-full bg-green-400" />
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">Incoming Call</p>
          <p className="truncate text-xs text-gray-400">{shortId}</p>
        </div>
      </div>
      <div className="mt-4 flex gap-3">
        <Button
          data-ocid="incoming_call.cancel_button"
          onClick={handleDecline}
          disabled={declineCall.isPending}
          variant="destructive"
          className="flex-1 gap-2 rounded-full"
          size="sm"
        >
          <PhoneOff className="h-4 w-4" />
          Decline
        </Button>
        <Button
          data-ocid="incoming_call.confirm_button"
          onClick={handleAccept}
          disabled={acceptCall.isPending}
          className="flex-1 gap-2 rounded-full bg-green-500 hover:bg-green-600 text-white"
          size="sm"
        >
          <Phone className="h-4 w-4" />
          Accept
        </Button>
      </div>
    </div>
  );
}
