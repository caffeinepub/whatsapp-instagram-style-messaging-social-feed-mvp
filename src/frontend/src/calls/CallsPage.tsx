import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "@tanstack/react-router";
import {
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneMissed,
  PhoneOff,
} from "lucide-react";
import { useState } from "react";
import EmptyState from "../components/states/EmptyState";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

interface CallLogEntry {
  id: string;
  participantName: string;
  type: "voice" | "video";
  status: "completed" | "missed" | "declined" | "incoming";
  timestamp: Date;
  duration?: string;
}

function CallStatusIcon({ status }: { status: CallLogEntry["status"] }) {
  switch (status) {
    case "completed":
      return <PhoneCall className="h-4 w-4 text-green-500" />;
    case "missed":
      return <PhoneMissed className="h-4 w-4 text-red-500" />;
    case "declined":
      return <PhoneOff className="h-4 w-4 text-orange-500" />;
    case "incoming":
      return <PhoneIncoming className="h-4 w-4 text-blue-500" />;
  }
}

function CallStatusLabel({ status }: { status: CallLogEntry["status"] }) {
  const labels = {
    completed: "Completed",
    missed: "Missed",
    declined: "Declined",
    incoming: "Incoming",
  };
  const variants: Record<
    CallLogEntry["status"],
    "default" | "secondary" | "destructive" | "outline"
  > = {
    completed: "secondary",
    missed: "destructive",
    declined: "outline",
    incoming: "default",
  };
  return <Badge variant={variants[status]}>{labels[status]}</Badge>;
}

export default function CallsPage() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();

  // Simulated call log — in a real app this would come from the backend
  const [callLog] = useState<CallLogEntry[]>([]);

  if (!identity) {
    return (
      <div className="space-y-6 p-4 pb-24 md:p-6 md:pb-6">
        <h1 className="text-2xl font-bold">Calls</h1>
        <EmptyState
          illustration="/assets/generated/calls-empty.dim_400x300.png"
          title="Sign in to make calls"
          message="Log in to start making voice and video calls with your connections"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 pb-24 md:p-6 md:pb-6">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Phone className="h-6 w-6" />
          Calls
        </h1>
      </div>

      <p className="text-sm text-muted-foreground">
        You can start a call from any user's profile page or from a chat thread.
      </p>

      {callLog.length === 0 ? (
        <EmptyState
          illustration="/assets/generated/calls-empty.dim_400x300.png"
          title="No recent calls"
          message="Start a call from a user's profile or from a chat thread"
          actionLabel="Explore Users"
          actionPath="/explore"
        />
      ) : (
        <div className="space-y-2">
          {callLog.map((call) => (
            <Card key={call.id}>
              <CardContent className="flex items-center gap-3 p-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {call.participantName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{call.participantName}</p>
                    <CallStatusIcon status={call.status} />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{call.timestamp.toLocaleDateString()}</span>
                    {call.duration && <span>· {call.duration}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CallStatusLabel status={call.status} />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      navigate({
                        to: "/profile/$userId",
                        params: { userId: call.id },
                      })
                    }
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
