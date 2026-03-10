import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

interface AuthTimeoutStateProps {
  stage?: "initialization" | "profile-loading" | "actor-creation";
  onRetry: () => void;
  elapsedTime?: number;
}

/**
 * Component displayed when authentication times out or encounters errors.
 * Shows user-friendly error message with retry functionality.
 */
export default function AuthTimeoutState({
  stage = "initialization",
  onRetry,
  elapsedTime,
}: AuthTimeoutStateProps) {
  const stageMessages = {
    initialization: "Internet Identity initialization",
    "profile-loading": "User profile loading",
    "actor-creation": "Backend connection",
  };

  const stageName = stageMessages[stage];
  const timeoutSeconds = elapsedTime ? Math.floor(elapsedTime / 1000) : 30;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="rounded-full bg-destructive/10 p-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Connection Timeout</h1>
            <p className="text-muted-foreground">
              {stageName} took longer than expected ({timeoutSeconds}s)
            </p>
          </div>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>What went wrong?</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>
              The authentication process didn't complete in time. This could be
              due to:
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm">
              <li>Slow network connection</li>
              <li>Internet Identity service issues</li>
              <li>Browser extension interference</li>
            </ul>
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <Button onClick={onRetry} className="w-full" size="lg">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            <p>If the problem persists:</p>
            <ul className="mt-2 space-y-1">
              <li>• Check your internet connection</li>
              <li>• Try disabling browser extensions</li>
              <li>• Refresh the page</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
