import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "@tanstack/react-router";
import { Heart, Play, Upload } from "lucide-react";
import EmptyState from "../components/states/EmptyState";
import ErrorState from "../components/states/ErrorState";
import LoadingState from "../components/states/LoadingState";
import { useGetAllMovies } from "../hooks/useQueries";

export default function MoviesPage() {
  const navigate = useNavigate();
  const {
    data: movies,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetAllMovies();

  if (isLoading) {
    return <LoadingState message="Loading movies..." />;
  }

  if (isError) {
    return (
      <ErrorState
        message={
          error instanceof Error ? error.message : "Failed to load movies"
        }
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="space-y-6 p-4 pb-24 md:p-6 md:pb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Movies</h1>
        <Button onClick={() => navigate({ to: "/movies/upload" })}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Movie
        </Button>
      </div>

      {!movies || movies.length === 0 ? (
        <EmptyState
          illustration="/assets/generated/movies-empty.dim_400x300.png"
          title="No movies yet"
          message="Be the first to upload a movie for everyone to enjoy"
          actionLabel="Upload Movie"
          actionPath="/movies/upload"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {movies.map((movie) => (
            <Card
              key={movie.id.toString()}
              className="cursor-pointer overflow-hidden transition-shadow hover:shadow-lg"
              onClick={() =>
                navigate({
                  to: "/movies/$movieId",
                  params: { movieId: movie.id.toString() },
                })
              }
            >
              <div className="relative aspect-video bg-muted">
                <img
                  src={movie.thumbnail.getDirectURL()}
                  alt={movie.title}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "/assets/generated/movies-empty.dim_400x300.png";
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity hover:opacity-100">
                  <div className="rounded-full bg-white/90 p-3">
                    <Play className="h-6 w-6 fill-current text-primary" />
                  </div>
                </div>
              </div>
              <CardContent className="p-3">
                <h3 className="line-clamp-1 font-semibold">{movie.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {movie.description}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1 text-xs"
                  >
                    <Heart className="h-3 w-3" />
                    {movie.likes.length}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
