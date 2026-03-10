import { Outlet, useLocation } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { Suspense, lazy, useEffect, useState } from "react";
import LoginButton from "../auth/LoginButton";
import AuthTimeoutState from "../components/states/AuthTimeoutState";
import { useActor } from "../hooks/useActor";
import { useAuthTimeout } from "../hooks/useAuthTimeout";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetCallerUserProfile } from "../hooks/useQueries";
import AppLayout from "./AppLayout";

// Lazy-load onboarding since it's only needed once per new user
const OnboardingPage = lazy(() => import("../onboarding/OnboardingPage"));

// Lightweight splash screen — renders synchronously with no async dependencies
function SplashScreen({ message }: { message?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-5">
        <img
          src="/assets/generated/app-logo.dim_512x512.png"
          alt="App Logo"
          className="h-20 w-20 object-contain"
        />
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
      </div>
    </div>
  );
}

export default function RootLayout() {
  const { identity, isInitializing } = useInternetIdentity();
  const location = useLocation();
  const authTimeout = useAuthTimeout(isInitializing);

  const isAuthenticated = !!identity;

  // Public routes that don't require authentication
  const publicRoutes = ["/explore"];
  const isPublicRoute =
    publicRoutes.some((route) => location.pathname.startsWith(route)) ||
    !!location.pathname.match(/^\/profile\/[^/]+$/);

  // Handle authentication timeout
  if (authTimeout.hasTimedOut && !isPublicRoute) {
    return (
      <AuthTimeoutState
        stage="initialization"
        onRetry={() => {
          authTimeout.reset();
          window.location.reload();
        }}
        elapsedTime={authTimeout.elapsedTime}
      />
    );
  }

  // Show splash immediately during initialization for non-public routes
  if (isInitializing && !isPublicRoute) {
    return <SplashScreen message="Starting up…" />;
  }

  // Allow access to public routes without authentication
  if (isPublicRoute && !isAuthenticated) {
    return (
      <AppLayout>
        <Outlet />
      </AppLayout>
    );
  }

  // Show login screen for non-public routes when not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-background to-accent/5 px-4">
        <div className="flex w-full max-w-md flex-col items-center gap-8 text-center">
          <img
            src="/assets/generated/app-logo.dim_512x512.png"
            alt="App Logo"
            className="h-24 w-24 object-contain"
          />
          <div className="space-y-3">
            <h1 className="text-4xl font-bold tracking-tight">Welcome</h1>
            <p className="text-lg text-muted-foreground">
              Connect, share, and chat with friends
            </p>
          </div>
          <LoginButton />
        </div>
      </div>
    );
  }

  // User is authenticated — delegate to AuthenticatedLayout
  return <AuthenticatedLayout />;
}

function AuthenticatedLayout() {
  const {
    data: userProfile,
    isLoading,
    isFetched,
    error,
  } = useGetCallerUserProfile();
  const { isFetching: actorFetching, actor } = useActor();
  const [profileLoadStart] = useState(Date.now());
  const [showTimeoutError, setShowTimeoutError] = useState(false);

  // Monitor profile loading timeout (30 s)
  useEffect(() => {
    if (!isLoading && !actorFetching) return;
    const id = setTimeout(() => {
      setShowTimeoutError(true);
    }, 30000);
    return () => clearTimeout(id);
  }, [isLoading, actorFetching]);

  if (showTimeoutError) {
    return (
      <AuthTimeoutState
        stage="profile-loading"
        onRetry={() => {
          setShowTimeoutError(false);
          window.location.reload();
        }}
        elapsedTime={Date.now() - profileLoadStart}
      />
    );
  }

  if (error && isFetched) {
    return (
      <AuthTimeoutState
        stage="profile-loading"
        onRetry={() => window.location.reload()}
      />
    );
  }

  // Show splash while actor or profile is loading
  if (isLoading || actorFetching || !actor) {
    return <SplashScreen message="Loading your profile…" />;
  }

  // Show onboarding if user has no profile yet
  if (isFetched && userProfile === null) {
    return (
      <Suspense fallback={<SplashScreen message="Loading…" />}>
        <OnboardingPage />
      </Suspense>
    );
  }

  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}
