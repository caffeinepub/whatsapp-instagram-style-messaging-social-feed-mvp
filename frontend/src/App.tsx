import { lazy, Suspense, StrictMode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createRouter, createRoute, createRootRoute } from '@tanstack/react-router';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import { ErrorBoundary } from './components/ErrorBoundary';
import { InternetIdentityProvider } from './hooks/useInternetIdentity';
import RootLayout from './layout/RootLayout';
import { Loader2 } from 'lucide-react';

// Lazy-load all page components to reduce initial bundle size
const FeedPage = lazy(() => import('./feed/FeedPage'));
const ExplorePage = lazy(() => import('./explore/ExplorePage'));
const MessagesPage = lazy(() => import('./messages/MessagesPage'));
const ChatThreadPage = lazy(() => import('./messages/ChatThreadPage'));
const ProfilePage = lazy(() => import('./profile/ProfilePage'));
const UserProfilePage = lazy(() => import('./profile/UserProfilePage'));
const CreatePostPage = lazy(() => import('./posts/CreatePostPage'));
const SavedPostsPage = lazy(() => import('./profile/SavedPostsPage'));
const BlockedUsersPage = lazy(() => import('./profile/BlockedUsersPage'));
const GroupsPage = lazy(() => import('./groups/GroupsPage'));
const GroupDetailPage = lazy(() => import('./groups/GroupDetailPage'));
const GroupChatPage = lazy(() => import('./groups/GroupChatPage'));

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
      staleTime: 1000 * 30,       // 30 seconds default stale time
      gcTime: 1000 * 60 * 5,      // 5 minutes garbage collection time
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
  path: '/',
  component: () => (
    <Suspense fallback={<PageFallback />}>
      <FeedPage />
    </Suspense>
  ),
});

const exploreRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/explore',
  component: () => (
    <Suspense fallback={<PageFallback />}>
      <ExplorePage />
    </Suspense>
  ),
});

const messagesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/messages',
  component: () => (
    <Suspense fallback={<PageFallback />}>
      <MessagesPage />
    </Suspense>
  ),
});

const chatThreadRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/messages/$conversationId',
  component: () => (
    <Suspense fallback={<PageFallback />}>
      <ChatThreadPage />
    </Suspense>
  ),
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  component: () => (
    <Suspense fallback={<PageFallback />}>
      <ProfilePage />
    </Suspense>
  ),
});

const userProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile/$userId',
  component: () => (
    <Suspense fallback={<PageFallback />}>
      <UserProfilePage />
    </Suspense>
  ),
});

const createPostRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/create',
  component: () => (
    <Suspense fallback={<PageFallback />}>
      <CreatePostPage />
    </Suspense>
  ),
});

const savedPostsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/saved',
  component: () => (
    <Suspense fallback={<PageFallback />}>
      <SavedPostsPage />
    </Suspense>
  ),
});

const blockedUsersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/blocked-users',
  component: () => (
    <Suspense fallback={<PageFallback />}>
      <BlockedUsersPage />
    </Suspense>
  ),
});

const groupsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/groups',
  component: () => (
    <Suspense fallback={<PageFallback />}>
      <GroupsPage />
    </Suspense>
  ),
});

const groupDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/groups/$groupId',
  component: () => (
    <Suspense fallback={<PageFallback />}>
      <GroupDetailPage />
    </Suspense>
  ),
});

const groupChatRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/groups/$groupId/chat',
  component: () => (
    <Suspense fallback={<PageFallback />}>
      <GroupChatPage />
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
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
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
