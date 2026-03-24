"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";

const IDLE_TIMEOUT_MS = 180000;
const HEARTBEAT_INTERVAL_MS = 60000;
const ACTIVITY_THROTTLE_MS = 1000;

export function useStudyTracker() {
  const { data: session, status } = useSession();
  const [isActive, setIsActive] = useState(true);

  const idleTimerRef = useRef<number | null>(null);
  const lastActivityAtRef = useRef(0);

  const isStudent =
    String(session?.user?.role || "").trim().toLowerCase() === "student";

  const clearIdleTimer = useCallback(() => {
    if (idleTimerRef.current !== null) {
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, []);

  const scheduleIdleTimer = useCallback(() => {
    clearIdleTimer();

    idleTimerRef.current = window.setTimeout(() => {
      setIsActive(false);
    }, IDLE_TIMEOUT_MS);
  }, [clearIdleTimer]);

  const markActive = useCallback(() => {
    const now = Date.now();

    if (now - lastActivityAtRef.current < ACTIVITY_THROTTLE_MS) {
      return;
    }

    lastActivityAtRef.current = now;

    if (document.hidden) {
      return;
    }

    setIsActive(true);
    scheduleIdleTimer();
  }, [scheduleIdleTimer]);

  useEffect(() => {
    if (status !== "authenticated" || !isStudent) {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsActive(false);
        clearIdleTimer();
        return;
      }

      setIsActive(true);
      scheduleIdleTimer();
    };

    const activityEvents: Array<keyof WindowEventMap> = [
      "mousemove",
      "keydown",
      "scroll",
      "click",
      "touchstart",
    ];

    document.addEventListener("visibilitychange", handleVisibilityChange);

    for (const eventName of activityEvents) {
      window.addEventListener(eventName, markActive, { passive: true });
    }

    if (!document.hidden) {
      setIsActive(true);
      scheduleIdleTimer();
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      for (const eventName of activityEvents) {
        window.removeEventListener(eventName, markActive);
      }
      clearIdleTimer();
    };
  }, [clearIdleTimer, isStudent, markActive, scheduleIdleTimer, status]);

  useEffect(() => {
    if (status !== "authenticated" || !isStudent) {
      return;
    }

    const intervalId = window.setInterval(() => {
      if (!isActive || document.hidden) {
        return;
      }

      void fetch("/api/student/track-time", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        keepalive: true,
      }).catch(() => {
        // no-op
      });
    }, HEARTBEAT_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isActive, isStudent, status]);

  return { isActive };
}
