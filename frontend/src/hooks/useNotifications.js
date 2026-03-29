"use client";
import { useState, useEffect, useCallback } from "react";
import {
  getNotificationPermission,
  requestNotificationPermission,
  maybeNotify,
} from "@/utils/notificationUtils";

export function useNotifications(prefs) {
  const [permission, setPermission] = useState("default");

  useEffect(() => {
    setPermission(getNotificationPermission());
    const interval = setInterval(
      () => setPermission(getNotificationPermission()),
      2000,
    );
    return () => clearInterval(interval);
  }, []);

  const requestPermission = useCallback(async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
    return result;
  }, []);

  const notifyIfKeyword = useCallback(
    (tweet) => {
      if (!prefs) return false;
      return maybeNotify(tweet, prefs);
    },
    [prefs],
  );

  return {
    permission,
    requestPermission,
    notifyIfKeyword,
    isGranted: permission === "granted",
    isDenied: permission === "denied",
    isUnsupported: permission === "unsupported",
  };
}
