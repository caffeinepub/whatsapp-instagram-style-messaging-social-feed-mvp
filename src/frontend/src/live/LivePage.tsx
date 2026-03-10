import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "@tanstack/react-router";
import { Heart, Play, Radio, Users } from "lucide-react";
import type { LiveStream } from "../backend";
import EmptyState from "../components/states/EmptyState";
import ErrorState from "../components/states/ErrorState";
import LoadingState from "../components/states/LoadingState";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetActiveLiveStreams,
  useGetUserProfile,
} from "../hooks/useQueries";

function LiveStreamCard({ stream }: { stream: LiveStream }) {
  const navigate = useNavigate();
  const { data: authorProfile } = useGetUserProfile(stream.author.toString());

  return (
    <Card
      className="cursor-pointer overflow-hidden transition-shadow hover:shadow-lg"
      onClick={() =>
        navigate({
          to: "/live/$streamId",
          params: { streamId: stream.id.toString() },
        })
      }
    >
      <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-accent/20">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-full bg-background/80 p-4">
            <Play className="h-8 w-8 fill-current text-primary" />
          </div>
        </div>
        <Badge className="absolute left-2 top-2 bg-red-500 text-white hover:bg-red-500">
          <span className="mr-1 inline-block h-2 w-2 animate-pulse rounded-full bg-white" />
          LIVE
        </Badge>
        <Badge variant="secondary" className="absolute right-2 top-2 gap-1">
          <Users className="h-3 w-3" />
          {stream.viewers.length}
        </Badge>
      </div>
      <CardContent className="p-3">
        <h3 className="line-clamp-1 font-semibold">{stream.title}</h3>
        {stream.description && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {stream.description}
          </p>
        )}
        <div className="mt-2 flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs">
              {(authorProfile?.displayName || "U").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground">
            {authorProfile?.displayName || "Unknown"}
          </span>
          <Badge
            variant="secondary"
            className="ml-auto flex items-center gap-1 text-xs"
          >
            <Heart className="h-3 w-3" />
            {stream.likes.length}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LivePage() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const {
    data: streams,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetActiveLiveStreams();

  if (isLoading) {
    return <LoadingState message="Loading live streams..." />;
  }

  if (isError) {
    return (
      <ErrorState
        message={
          error instanceof Error ? error.message : "Failed to load live streams"
        }
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="space-y-6 p-4 pb-24 md:p-6 md:pb-6">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Radio className="h-6 w-6 text-red-500" />
          Live
        </h1>
        {identity && (
          <Button
            onClick={() => navigate({ to: "/live/start" })}
            className="gap-2 bg-red-500 hover:bg-red-600"
          >
            <Radio className="h-4 w-4" />
            Go Live
          </Button>
        )}
      </div>

      {!streams || streams.length === 0 ? (
        <EmptyState
          illustration="/assets/generated/live-empty.dim_400x300.png"
          title="No live streams right now"
          message="Be the first to go live and share your moment with the world"
          actionLabel={identity ? "Go Live" : undefined}
          actionPath={identity ? "/live/start" : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {streams.map((stream) => (
            <LiveStreamCard key={stream.id.toString()} stream={stream} />
          ))}
        </div>
      )}
    </div>
  );
}
