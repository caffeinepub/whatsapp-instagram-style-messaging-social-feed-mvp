import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, Heart, Loader2 } from "lucide-react";
import { toast } from "sonner";
import ErrorState from "../components/states/ErrorState";
import LoadingState from "../components/states/LoadingState";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetMovie,
  useGetUserProfile,
  useLikeMovie,
  useUnlikeMovie,
} from "../hooks/useQueries";

export default function MovieDetailPage() {
  const { movieId } = useParams({ from: "/movies/$movieId" });
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();

  const {
    data: movie,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetMovie(BigInt(movieId));
  const { data: uploaderProfile } = useGetUserProfile(
    movie?.uploader.toString() || "",
  );
  const likeMutation = useLikeMovie();
  const unlikeMutation = useUnlikeMovie();

  const currentUserId = identity?.getPrincipal().toString();
  const isLiked =
    movie?.likes.some((id) => id.toString() === currentUserId) || false;

  const handleLikeToggle = async () => {
    if (!identity) {
      toast.error("Please log in to like movies");
      return;
    }
    try {
      if (isLiked) {
        await unlikeMutation.mutateAsync(movie!.id);
        toast.success("Removed like");
      } else {
        await likeMutation.mutateAsync(movie!.id);
        toast.success("Liked movie!");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update like");
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading movie..." />;
  }

  if (isError) {
    return (
      <ErrorState
        message={
          error instanceof Error ? error.message : "Failed to load movie"
        }
        onRetry={refetch}
      />
    );
  }

  if (!movie) {
    return (
      <div className="p-4 md:p-6">
        <ErrorState
          message="Movie not found"
          onRetry={() => navigate({ to: "/movies" })}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 pb-24 md:p-6 md:pb-6">
      <Button
        variant="ghost"
        onClick={() => navigate({ to: "/movies" })}
        className="gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Movies
      </Button>

      {/* Video Player */}
      <div className="overflow-hidden rounded-xl bg-black">
        <video
          controls
          className="w-full"
          style={{ maxHeight: "60vh" }}
          poster={movie.thumbnail.getDirectURL()}
        >
          <source src={movie.videoFile.getDirectURL()} />
          <track kind="captions" />
          Your browser does not support the video tag.
        </video>
      </div>

      {/* Movie Info */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold">{movie.title}</h1>
          <Button
            variant={isLiked ? "default" : "outline"}
            onClick={handleLikeToggle}
            disabled={likeMutation.isPending || unlikeMutation.isPending}
            className="shrink-0 gap-2"
          >
            {likeMutation.isPending || unlikeMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
            )}
            {movie.likes.length}
          </Button>
        </div>

        <p className="text-muted-foreground">{movie.description}</p>

        <Separator />

        {/* Uploader Info */}
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback>
              {(uploaderProfile?.displayName || "U").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">
              {uploaderProfile?.displayName || "Unknown User"}
            </p>
            {uploaderProfile?.username && (
              <p className="text-sm text-muted-foreground">
                @{uploaderProfile.username}
              </p>
            )}
          </div>
          <Badge variant="secondary" className="ml-auto">
            Uploader
          </Badge>
        </div>
      </div>
    </div>
  );
}
