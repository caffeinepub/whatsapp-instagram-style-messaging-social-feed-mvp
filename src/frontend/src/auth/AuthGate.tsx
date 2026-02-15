import { type ReactNode } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useActor } from '../hooks/useActor';
import LoginButton from './LoginButton';
import { Loader2 } from 'lucide-react';

interface AuthGateProps {
  children: ReactNode;
}

export default function AuthGate({ children }: AuthGateProps) {
  const { identity, isInitializing } = useInternetIdentity();
  const { isFetching: actorFetching } = useActor();

  const isAuthenticated = !!identity;
  const isLoading = isInitializing || actorFetching;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

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

  return <>{children}</>;
}
