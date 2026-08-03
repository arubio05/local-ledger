import { useEffect } from "react";

const DEFAULT_AUTO_LOCK_MINUTES = 10;

type Props = {
  enabled: boolean;
  onLock: () => void;
  timeoutMinutes?: number;
};

export function useAutoLock({
  enabled,
  onLock,
  timeoutMinutes = DEFAULT_AUTO_LOCK_MINUTES,
}: Props) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const timeoutMilliseconds = Math.max(timeoutMinutes, 1) * 60 * 1000;

    let timeoutId = window.setTimeout(onLock, timeoutMilliseconds);

    function resetTimer() {
      window.clearTimeout(timeoutId);

      timeoutId = window.setTimeout(onLock, timeoutMilliseconds);
    }

    const activityEvents = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
      "pointerdown",
    ] as const;

    for (const eventName of activityEvents) {
      window.addEventListener(eventName, resetTimer, { passive: true });
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        resetTimer();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearTimeout(timeoutId);

      for (const eventName of activityEvents) {
        window.removeEventListener(eventName, resetTimer);
      }

      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, onLock, timeoutMinutes]);
}
