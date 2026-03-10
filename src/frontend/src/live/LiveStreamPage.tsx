import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, Heart, Loader2, Radio, Square, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import ErrorState from "../components/states/ErrorState";
import LoadingState from "../components/states/LoadingState";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useEndLiveStream,
  useGetActiveLiveStreams,
  useGetUserProfile,
  useJoinLiveStream,
  useLikeLiveStream,
} from "../hooks/useQueries";

export default function LiveStreamPage() {
  const { streamId } = useParams({ from: "/live/$streamId" });
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();

  const {
    data: streams,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetActiveLiveStreams();
  const joinMutation = useJoinLiveStream();
  const likeMutation = useLikeLiveStream();
  const endMutation = useEndLiveStream();

  const [hasJoined, setHasJoined] = useState(false);

  const stream = streams?.find((s) => s.id.toString() === streamId);
  const { data: authorProfile } = useGetUserProfile(
    stream?.author.toString() || "",
  );

  const currentUserId = identity?.getPrincipal().toString();
  const isBroadcaster = stream?.author.toString() === currentUserId;
  const isLiked =
    stream?.likes.some((id) => id.toString() === currentUserId) || false;

  // biome-ignore lint/correctness/useExhaustiveDependencies: joinMutation is stable
  useEffect(() => {
    if (stream && !hasJoined && !isBroadcaster) {
      setHasJoined(true);
      joinMutation.mutateAsync(stream.id).catch(() => {
        // Ignore join errors (e.g., already joined)
      });
    }
  }, [stream, hasJoined, isBroadcaster]);

  // Redirect if stream ended
  useEffect(() => {
    if (!isLoading && streams && !stream) {
      toast.info("This live stream has ended");
      navigate({ to: "/live" });
    }
  }, [streams, stream, isLoading, navigate]);

  const handleLike = async () => {
    if (!identity) {
      toast.error("Please log in to like streams");
      return;
    }
    if (!stream) return;
    try {
      await likeMutation.mutateAsync(stream.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to like stream");
    }
  };

  const handleEndStream = async () => {
    if (!stream) return;
    try {
      await endMutation.mutateAsync(stream.id);
      toast.success("Stream ended");
      navigate({ to: "/live" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to end stream");
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading live stream..." />;
  }

  if (isError) {
    return (
      <ErrorState
        message={
          error instanceof Error ? error.message : "Failed to load stream"
        }
        onRetry={refetch}
      />
    );
  }

  if (!stream) {
    return <LoadingState message="Connecting to stream..." />;
  }

  return (
    <div className="space-y-4 p-4 pb-24 md:p-6 md:pb-6">
      <Button
        variant="ghost"
        onClick={() => navigate({ to: "/live" })}
        className="gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Live
      </Button>

      {/* Stream Video Area */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="flex aspect-video items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-white">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="text-2xl">
                  {(authorProfile?.displayName || "L").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 h-4 w-4 animate-pulse rounded-full bg-red-500" />
            </div>
            <p className="text-lg font-semibold">
              {authorProfile?.displayName || "Broadcaster"}
            </p>
            <p className="text-sm text-gray-300">is live</p>
          </div>
        </div>

        {/* Live Badge */}
        <Badge className="absolute left-3 top-3 bg-red-500 text-white hover:bg-red-500">
          <span className="mr-1 inline-block h-2 w-2 animate-pulse rounded-full bg-white" />
          LIVE
        </Badge>

        {/* Viewer Count */}
        <Badge variant="secondary" className="absolute right-3 top-3 gap-1">
          <Users className="h-3 w-3" />
          {stream.viewers.length}
        </Badge>
      </div>

      {/* Stream Info */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">{stream.title}</h1>
            {stream.description && (
              <p className="mt-1 text-muted-foreground">{stream.description}</p>
            )}
          </div>
          <Button
            variant={isLiked ? "default" : "outline"}
            onClick={handleLike}
            disabled={likeMutation.isPending || isLiked}
            className="shrink-0 gap-2"
          >
            {likeMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
            )}
            {stream.likes.length}
          </Button>
        </div>

        {/* Broadcaster Info */}
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback>
              {(authorProfile?.displayName || "U").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">
              {authorProfile?.displayName || "Unknown"}
            </p>
            {authorProfile?.username && (
              <p className="text-sm text-muted-foreground">
                @{authorProfile.username}
              </p>
            )}
          </div>
          {isBroadcaster && <Badge className="ml-auto">You</Badge>}
        </div>

        {/* End Stream Button (broadcaster only) */}
        {isBroadcaster && (
          <Button
            variant="destructive"
            onClick={handleEndStream}
            disabled={endMutation.isPending}
            className="w-full gap-2"
          >
            {endMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Square className="h-4 w-4 fill-current" />
            )}
            End Stream
          </Button>
        )}
      </div>
    </div>
  );
}
