const parseUserAgent = (ua = "") => {
  const str = ua.toLowerCase();

  let browser = "Unknown";
  let browserFamily = "other";

  if (str.includes("edg/") || str.includes("edge/")) {
    browser = "Microsoft Edge";
    browserFamily = "edge";
  } else if (str.includes("trident") || str.includes("msie")) {
    browser = "Internet Explorer";
    browserFamily = "ie";
  } else if (str.includes("opr/") || str.includes("opera")) {
    browser = "Opera";
    browserFamily = "opera";
  } else if (str.includes("chrome") || str.includes("chromium")) {
    browser = "Google Chrome";
    browserFamily = "chrome";
  } else if (str.includes("firefox") || str.includes("fxios")) {
    browser = "Mozilla Firefox";
    browserFamily = "firefox";
  } else if (str.includes("safari") && !str.includes("chrome")) {
    browser = "Safari";
    browserFamily = "safari";
  }

  let os = "Unknown OS";
  if (str.includes("windows nt 10")) os = "Windows 10/11";
  else if (str.includes("windows nt 6.3")) os = "Windows 8.1";
  else if (str.includes("windows nt 6.1")) os = "Windows 7";
  else if (str.includes("windows")) os = "Windows";
  else if (str.includes("android")) {
    const match = ua.match(/Android\s([\d.]+)/i);
    os = match ? `Android ${match[1]}` : "Android";
  } else if (str.includes("iphone os") || str.includes("iphone")) {
    const match = ua.match(/CPU iPhone OS ([\d_]+)/i);
    os = match ? `iOS ${match[1].replace(/_/g, ".")}` : "iOS";
  } else if (str.includes("ipad")) {
    os = "iPadOS";
  } else if (str.includes("mac os x")) {
    const match = ua.match(/Mac OS X ([\d_]+)/i);
    os = match ? `macOS ${match[1].replace(/_/g, ".")}` : "macOS";
  } else if (str.includes("linux")) {
    os = "Linux";
  }

  let deviceCategory = "desktop";
  let device = "Desktop / Laptop";

  if (
    str.includes("mobile") ||
    str.includes("iphone") ||
    (str.includes("android") && !str.includes("tablet"))
  ) {
    deviceCategory = "mobile";
    device = "Mobile";
  } else if (
    str.includes("ipad") ||
    str.includes("tablet") ||
    (str.includes("android") && !str.includes("mobile"))
  ) {
    deviceCategory = "tablet";
    device = "Tablet";
  }

  return { browser, browserFamily, os, device, deviceCategory };
};

const isMobileLoginWindowOpen = () => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(now.getTime() + istOffset);
  const h = ist.getUTCHours();
  return h >= 10 && h < 13;
};

const getClientIP = (req) => {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    "Unknown"
  );
};

module.exports = { parseUserAgent, isMobileLoginWindowOpen, getClientIP };
