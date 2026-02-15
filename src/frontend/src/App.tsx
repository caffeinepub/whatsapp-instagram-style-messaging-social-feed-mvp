import { RouterProvider, createRouter, createRootRoute, createRoute, Outlet } from '@tanstack/react-router';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import AuthGate from './auth/AuthGate';
import OnboardingPage from './onboarding/OnboardingPage';
import AppLayout from './layout/AppLayout';
import FeedPage from './feed/FeedPage';
import ExplorePage from './explore/ExplorePage';
import MessagesPage from './messages/MessagesPage';
import ChatThreadPage from './messages/ChatThreadPage';
import ProfilePage from './profile/ProfilePage';
import CreatePostPage from './posts/CreatePostPage';

function RootComponent() {
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  
  const isAuthenticated = !!identity;
  const showOnboarding = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  if (showOnboarding) {
    return <OnboardingPage />;
  }

  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

const rootRoute = createRootRoute({
  component: RootComponent,
});

const feedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: FeedPage,
});

const exploreRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/explore',
  component: ExplorePage,
});

const messagesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/messages',
  component: MessagesPage,
});

const chatThreadRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/messages/$conversationId',
  component: ChatThreadPage,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  component: ProfilePage,
});

const createPostRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/create',
  component: CreatePostPage,
});

const routeTree = rootRoute.addChildren([
  feedRoute,
  exploreRoute,
  messagesRoute,
  chatThreadRoute,
  profileRoute,
  createPostRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthGate>
        <RouterProvider router={router} />
        <Toaster />
      </AuthGate>
    </ThemeProvider>
  );
}
