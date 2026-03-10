import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, Phone, PhoneOff, Video } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CallStatus } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetCallStatus, useInitiateCall } from "../hooks/useQueries";

interface InitiateCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetUserId: string;
  targetUserName: string;
}

export default function InitiateCallDialog({
  open,
  onOpenChange,
  targetUserId,
  targetUserName,
}: InitiateCallDialogProps) {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const initiateCallMutation = useInitiateCall();
  const [activeCallId, setActiveCallId] = useState<bigint | null>(null);
  const [callType, setCallType] = useState<"voice" | "video">("voice");
  const [isConnecting, setIsConnecting] = useState(false);

  const { data: callStatus } = useGetCallStatus(activeCallId);

  // Handle call status changes
  useEffect(() => {
    if (callStatus === CallStatus.accepted && activeCallId !== null) {
      navigate({
        to: "/calls/$callId",
        params: { callId: activeCallId.toString() },
      });
      onOpenChange(false);
    } else if (callStatus === CallStatus.declined) {
      toast.info(`${targetUserName} declined the call`);
      setActiveCallId(null);
      setIsConnecting(false);
    }
  }, [callStatus, activeCallId, navigate, onOpenChange, targetUserName]);

  const handleCall = async (type: "voice" | "video") => {
    if (!identity) {
      toast.error("Please log in to make calls");
      return;
    }
    setCallType(type);
    setIsConnecting(true);
    try {
      const callId = await initiateCallMutation.mutateAsync(targetUserId);
      setActiveCallId(callId);
      toast.success(`Calling ${targetUserName}...`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to initiate call",
      );
      setIsConnecting(false);
    }
  };

  const handleCancel = () => {
    setActiveCallId(null);
    setIsConnecting(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Call {targetUserName}</DialogTitle>
          <DialogDescription>
            Choose how you'd like to connect
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-4">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="text-2xl">
              {targetUserName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <p className="text-lg font-semibold">{targetUserName}</p>

          {isConnecting ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                {callStatus === CallStatus.pending
                  ? "Ringing..."
                  : "Connecting..."}
              </p>
              <Button
                variant="destructive"
                onClick={handleCancel}
                className="gap-2"
              >
                <PhoneOff className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex gap-4">
              <Button
                onClick={() => handleCall("voice")}
                disabled={initiateCallMutation.isPending}
                className="flex-1 gap-2"
              >
                {initiateCallMutation.isPending && callType === "voice" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Phone className="h-4 w-4" />
                )}
                Voice
              </Button>
              <Button
                onClick={() => handleCall("video")}
                disabled={initiateCallMutation.isPending}
                variant="outline"
                className="flex-1 gap-2"
              >
                {initiateCallMutation.isPending && callType === "video" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Video className="h-4 w-4" />
                )}
                Video
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
