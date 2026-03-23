"use client"

import { useEffect, useCallback, useRef } from "react";
import { getStore } from "@/lib/store";

/**
 * Hook to manage browser notifications for ChirpPro.
 * Monitors for specific keywords ("cricket", "science") and respects user preferences.
 */
export function useNotifications() {
  const notifiedIds = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, []);

  const notify = useCallback((title: string, body: string) => {
    const store = getStore();
    if (!store.notificationsEnabled) return;

    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        body,
        // Using a generic icon hint as we cannot generate a favicon
        icon: "https://picsum.photos/seed/chirp/64/64",
      });
    }
  }, []);

  const checkTweetForNotification = useCallback((tweet: { id: number; content: string }) => {
    const keywords = ["cricket", "science"];
    const lowerText = tweet.content.toLowerCase();
    
    if (notifiedIds.current.has(tweet.id)) return;

    if (keywords.some(keyword => lowerText.includes(keyword))) {
      notify("New Relevant Chirp!", tweet.content);
      notifiedIds.current.add(tweet.id);
    }
  }, [notify]);

  const checkFeedForNotifications = useCallback((tweets: any[]) => {
    tweets.forEach(tweet => checkTweetForNotification(tweet));
  }, [checkTweetForNotification]);

  return { checkTweetForNotification, checkFeedForNotifications };
}
