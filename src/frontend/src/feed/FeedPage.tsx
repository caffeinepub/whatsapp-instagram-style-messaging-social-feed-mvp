import { useGetFeed } from '../hooks/useQueries';
import PostCard from '../components/social/PostCard';
import LoadingState from '../components/states/LoadingState';
import ErrorState from '../components/states/ErrorState';
import EmptyState from '../components/states/EmptyState';

export default function FeedPage() {
  const { data: posts, isLoading, isError, error, refetch } = useGetFeed();

  if (isLoading) {
    return <LoadingState message="Loading your feed..." />;
  }

  if (isError) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : 'Failed to load feed'}
        onRetry={refetch}
      />
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <EmptyState
        illustration="/assets/generated/empty-feed.dim_900x600.png"
        title="Your feed is empty"
        message="Follow some users to see their posts here"
        actionLabel="Explore Users"
        actionPath="/explore"
      />
    );
  }

  return (
    <div className="space-y-6 p-4 pb-24 md:p-6 md:pb-6">
      <h1 className="text-2xl font-bold">Feed</h1>
      <div className="space-y-6">
        {posts.map((post) => (
          <PostCard key={post.id.toString()} post={post} />
        ))}
      </div>
    </div>
  );
}
