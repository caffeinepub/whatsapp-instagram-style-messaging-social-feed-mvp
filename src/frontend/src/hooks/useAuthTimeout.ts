import { useCallback, useEffect, useState } from "react";

const TIMEOUT_DURATION = 30000; // 30 seconds

export interface AuthTimeoutState {
  hasTimedOut: boolean;
  elapsedTime: number;
  reset: () => void;
}

/**
 * Hook that monitors authentication initialization duration and triggers
 * a timeout state after 30 seconds. Provides reset functionality for retry.
 */
export function useAuthTimeout(isInitializing: boolean): AuthTimeoutState {
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);

  // Start timer when initialization begins
  useEffect(() => {
    if (isInitializing && !startTime) {
      console.log("[AuthTimeout] Starting authentication timeout timer");
      setStartTime(Date.now());
      setHasTimedOut(false);
    } else if (!isInitializing && startTime) {
      console.log("[AuthTimeout] Authentication completed, clearing timer");
      setStartTime(null);
      setElapsedTime(0);
    }
  }, [isInitializing, startTime]);

  // Monitor elapsed time and trigger timeout
  useEffect(() => {
    if (!startTime || !isInitializing) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setElapsedTime(elapsed);

      if (elapsed >= TIMEOUT_DURATION && !hasTimedOut) {
        console.error(
          "[AuthTimeout] Authentication initialization timed out after 30 seconds",
        );
        setHasTimedOut(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, isInitializing, hasTimedOut]);

  const reset = useCallback(() => {
    console.log("[AuthTimeout] Resetting timeout state for retry");
    setHasTimedOut(false);
    setElapsedTime(0);
    setStartTime(null);
  }, []);

  return {
    hasTimedOut,
    elapsedTime,
    reset,
  };
}
