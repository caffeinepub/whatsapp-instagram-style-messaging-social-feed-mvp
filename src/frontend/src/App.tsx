import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { ThemeProvider } from "next-themes";
import { StrictMode, Suspense, lazy } from "react";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { InternetIdentityProvider } from "./hooks/useInternetIdentity";
import RootLayout from "./layout/RootLayout";

// Lazy-load all page components to reduce initial bundle size
const FeedPage = lazy(() => import("./feed/FeedPage"));
const ExplorePage = lazy(() => import("./explore/ExplorePage"));
const MessagesPage = lazy(() => import("./messages/MessagesPage"));
const ChatThreadPage = lazy(() => import("./messages/ChatThreadPage"));
const ProfilePage = lazy(() => import("./profile/ProfilePage"));
const UserProfilePage = lazy(() => import("./profile/UserProfilePage"));
const CreatePostPage = lazy(() => import("./posts/CreatePostPage"));
const SavedPostsPage = lazy(() => import("./profile/SavedPostsPage"));
const BlockedUsersPage = lazy(() => import("./profile/BlockedUsersPage"));
const GroupsPage = lazy(() => import("./groups/GroupsPage"));
const GroupDetailPage = lazy(() => import("./groups/GroupDetailPage"));
const GroupChatPage = lazy(() => import("./groups/GroupChatPage"));

// New pages
const MoviesPage = lazy(() => import("./movies/MoviesPage"));
const MovieDetailPage = lazy(() => import("./movies/MovieDetailPage"));
const UploadMoviePage = lazy(() => import("./movies/UploadMoviePage"));
const LivePage = lazy(() => import("./live/LivePage"));
const StartLivePage = lazy(() => import("./live/StartLivePage"));
const LiveStreamPage = lazy(() => import("./live/LiveStreamPage"));
const CallsPage = lazy(() => import("./calls/CallsPage"));
const ActiveCallPage = lazy(() => import("./calls/ActiveCallPage"));
const UploadStoryPage = lazy(() => import("./stories/UploadStoryPage"));

// Lightweight fallback shown while lazy chunks load
function PageFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}

// QueryClient with sensible staleTime and gcTime to reduce redundant backend calls
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      gcTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const rootRoute = createRootRoute({
  component: RootLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => (
    <Suspense fallback={<PageFallback />}>
      <FeedPage />
    </Suspense>
  ),
});

const exploreRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/explore",
  component: () => (
    <Suspense fallback={<PageFallback />}>
      <ExplorePage />
    </Suspense>
  ),
});

const messagesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/messages",
  component: () => (
    <Suspense fallback={<PageFallback />}>
      <MessagesPage />
    </Suspense>
  ),
});

const chatThreadRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/messages/$conversationId",
  component: () => (
    <Suspense fallback={<PageFallback />}>
      <ChatThreadPage />
    </Suspense>
  ),
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: () => (
    <Suspense fallback={<PageFallback />}>
      <ProfilePage />
    </Suspense>
  ),
});

const userProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile/$userId",
  component: () => (
    <Suspense fallback={<PageFallback />}>
      <UserProfilePage />
    </Suspense>
  ),
});

const createPostRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/create",
  component: () => (
    <Suspense fallback={<PageFallback />}>
      <CreatePostPage />
    </Suspense>
  ),
});

const savedPostsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/saved",
  component: () => (
    <Suspense fallback={<PageFallback />}>
      <SavedPostsPage />
    </Suspense>
  ),
});

const blockedUsersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/blocked-users",
  component: () => (
    <Suspense fallback={<PageFallback />}>
      <BlockedUsersPage />
    </Suspense>
  ),
});

const groupsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/groups",
  component: () => (
    <Suspense fallback={<PageFallback />}>
      <GroupsPage />
    </Suspense>
  ),
});

const groupDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/groups/$groupId",
  component: () => (
    <Suspense fallback={<PageFallback />}>
      <GroupDetailPage />
    </Suspense>
  ),
});

const groupChatRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/groups/$groupId/chat",
  component: () => (
    <Suspense fallback={<PageFallback />}>
      <GroupChatPage />
    </Suspense>
  ),
});

// Movies routes
const moviesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/movies",
  component: () => (
    <Suspense fallback={<PageFallback />}>
      <MoviesPage />
    </Suspense>
  ),
});

const uploadMovieRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/movies/upload",
  component: () => (
    <Suspense fallback={<PageFallback />}>
      <UploadMoviePage />
    </Suspense>
  ),
});

const movieDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/movies/$movieId",
  component: () => (
    <Suspense fallback={<PageFallback />}>
      <MovieDetailPage />
    </Suspense>
  ),
});

// Live routes
const liveRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/live",
  component: () => (
    <Suspense fallback={<PageFallback />}>
      <LivePage />
    </Suspense>
  ),
});

const startLiveRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/live/start",
  component: () => (
    <Suspense fallback={<PageFallback />}>
      <StartLivePage />
    </Suspense>
  ),
});

const liveStreamRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/live/$streamId",
  component: () => (
    <Suspense fallback={<PageFallback />}>
      <LiveStreamPage />
    </Suspense>
  ),
});

// Calls routes
const callsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/calls",
  component: () => (
    <Suspense fallback={<PageFallback />}>
      <CallsPage />
    </Suspense>
  ),
});

const activeCallRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/calls/$callId",
  component: () => (
    <Suspense fallback={<PageFallback />}>
      <ActiveCallPage />
    </Suspense>
  ),
});

// Stories routes
const uploadStoryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/stories/upload",
  component: () => (
    <Suspense fallback={<PageFallback />}>
      <UploadStoryPage />
    </Suspense>
  ),
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  exploreRoute,
  messagesRoute,
  chatThreadRoute,
  profileRoute,
  userProfileRoute,
  createPostRoute,
  savedPostsRoute,
  blockedUsersRoute,
  groupsRoute,
  groupDetailRoute,
  groupChatRoute,
  moviesRoute,
  uploadMovieRoute,
  movieDetailRoute,
  liveRoute,
  startLiveRoute,
  liveStreamRoute,
  callsRoute,
  activeCallRoute,
  uploadStoryRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <StrictMode>
      <ErrorBoundary>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <InternetIdentityProvider>
            <QueryClientProvider client={queryClient}>
              <ErrorBoundary>
                <RouterProvider router={router} />
              </ErrorBoundary>
              <Toaster />
            </QueryClientProvider>
          </InternetIdentityProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </StrictMode>
  );
}
