import PostCard from "../components/social/PostCard";
import EmptyState from "../components/states/EmptyState";
import ErrorState from "../components/states/ErrorState";
import LoadingState from "../components/states/LoadingState";
import { useGetSavedPosts } from "../hooks/useQueries";

export default function SavedPostsPage() {
  const {
    data: savedPosts,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetSavedPosts();

  if (isLoading) {
    return <LoadingState message="Loading saved posts..." />;
  }

  if (isError) {
    return (
      <div className="p-4 md:p-6">
        <ErrorState
          message={
            error instanceof Error
              ? error.message
              : "Failed to load saved posts"
          }
          onRetry={refetch}
        />
      </div>
    );
  }

  if (!savedPosts || savedPosts.length === 0) {
    return (
      <div className="p-4 md:p-6">
        <EmptyState
          title="No saved posts"
          message="Posts you save will appear here"
          actionLabel="Explore Feed"
          actionPath="/"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 pb-24 md:p-6 md:pb-6">
      <h1 className="text-2xl font-bold">Saved Posts</h1>
      <div className="space-y-6">
        {savedPosts.map((post) => (
          <PostCard key={post.id.toString()} post={post} />
        ))}
      </div>
    </div>
  );
}
