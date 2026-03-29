export const REQUIRED_KEYWORDS = ["cricket", "science"];

export const getNotificationPermission = () => {
  if (typeof window === "undefined" || !("Notification" in window))
    return "unsupported";
  return Notification.permission;
};

export const requestNotificationPermission = async () => {
  if (typeof window === "undefined" || !("Notification" in window))
    return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return await Notification.requestPermission();
};

export const detectKeywords = (
  content,
  watchedKeywords = REQUIRED_KEYWORDS,
) => {
  if (!content) return { matched: false, matchedKeywords: [] };
  const allKeywords = [
    ...new Set([
      ...REQUIRED_KEYWORDS,
      ...watchedKeywords.map((k) => k.toLowerCase()),
    ]),
  ];
  const matched = [];
  for (const kw of allKeywords) {
    const regex = new RegExp(
      `\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
      "i",
    );
    if (regex.test(content)) matched.push(kw);
  }
  return { matched: matched.length > 0, matchedKeywords: matched };
};

export const fireTweetNotification = (tweet, matchedKeywords = []) => {
  if (typeof window === "undefined") return null;
  if (!("Notification" in window) || Notification.permission !== "granted")
    return null;
  const tags = matchedKeywords.map((k) => `#${k}`).join(" ");
  const body =
    tweet.content?.length > 180
      ? tweet.content.slice(0, 177) + "..."
      : tweet.content;
  const n = new Notification(`🐦 TweetApp · ${tags}`, {
    body,
    icon: "/favicon.ico",
    tag: `tweet-${tweet._id}`,
    requireInteraction: false,
  });
  setTimeout(() => n.close(), 6000);
  n.onclick = () => {
    window.focus();
    n.close();
  };
  return n;
};

export const maybeNotify = (tweet, prefs) => {
  if (!prefs?.enabled) return false;
  if (getNotificationPermission() !== "granted") return false;
  const { matched, matchedKeywords } = detectKeywords(
    tweet.content,
    prefs.keywords || REQUIRED_KEYWORDS,
  );
  if (!matched) return false;
  fireTweetNotification(tweet, matchedKeywords);
  return true;
};
