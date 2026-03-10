import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CallStatus } from "../backend";
import { useGetCallStatus } from "../hooks/useQueries";

export default function ActiveCallPage() {
  const { callId } = useParams({ from: "/calls/$callId" });
  const navigate = useNavigate();

  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const { data: callStatus } = useGetCallStatus(BigInt(callId));

  // Timer
  useEffect(() => {
    const interval = setInterval(() => setDuration((d) => d + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Redirect if call ended/declined
  useEffect(() => {
    if (callStatus === CallStatus.declined) {
      toast.info("Call ended");
      navigate({ to: "/calls" });
    }
  }, [callStatus, navigate]);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleHangUp = () => {
    toast.info("Call ended");
    navigate({ to: "/calls" });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 p-6 text-white">
      {/* Connection Status */}
      <Badge className="mb-8 bg-green-500 text-white hover:bg-green-500">
        <span className="mr-1 inline-block h-2 w-2 animate-pulse rounded-full bg-white" />
        Connected
      </Badge>

      {/* Participant Avatar */}
      <Avatar className="h-32 w-32">
        <AvatarFallback className="bg-gray-700 text-4xl text-white">
          ?
        </AvatarFallback>
      </Avatar>

      <h2 className="mt-6 text-2xl font-bold">Active Call</h2>
      <p className="mt-2 text-gray-400">{formatDuration(duration)}</p>

      {/* Call Controls */}
      <div className="mt-12 flex items-center gap-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMuted(!isMuted)}
          className={`h-14 w-14 rounded-full ${isMuted ? "bg-red-500/20 text-red-400" : "bg-white/10 text-white"} hover:bg-white/20`}
        >
          {isMuted ? (
            <MicOff className="h-6 w-6" />
          ) : (
            <Mic className="h-6 w-6" />
          )}
        </Button>

        <Button
          onClick={handleHangUp}
          className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600"
          size="icon"
        >
          <PhoneOff className="h-7 w-7" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsVideoOff(!isVideoOff)}
          className={`h-14 w-14 rounded-full ${isVideoOff ? "bg-red-500/20 text-red-400" : "bg-white/10 text-white"} hover:bg-white/20`}
        >
          {isVideoOff ? (
            <VideoOff className="h-6 w-6" />
          ) : (
            <Video className="h-6 w-6" />
          )}
        </Button>
      </div>
    </div>
  );
}
