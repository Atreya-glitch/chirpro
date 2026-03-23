export function getISTDate(): Date {
  const now = new Date();
  const utcOffset = now.getTime() + (now.getTimezoneOffset() * 60000);
  const istOffset = 5.5 * 3600000;
  return new Date(utcOffset + istOffset);
}

export function isTimeInRange(startHour: number, endHour: number): boolean {
  const istDate = getISTDate();
  const hours = istDate.getHours();
  const minutes = istDate.getMinutes();
  
  const currentTime = hours + minutes / 60;
  return currentTime >= startHour && currentTime < endHour;
}

export function getSubscriptionLimits(plan: string): number {
  switch (plan.toLowerCase()) {
    case 'bronze': return 3;
    case 'silver': return 5;
    case 'gold': return Infinity;
    default: return 1; // Free
  }
}

export function getBrowserInfo(): { browser: string; os: string; isMobile: boolean; deviceType: 'desktop' | 'laptop' | 'mobile' } {
  if (typeof window === 'undefined') return { browser: 'Unknown', os: 'Unknown', isMobile: false, deviceType: 'desktop' };
  
  const ua = window.navigator.userAgent;
  let browser = 'Unknown';
  if (ua.includes('Edg/')) browser = 'Microsoft Edge';
  else if (ua.includes('Chrome/')) browser = 'Google Chrome';
  else if (ua.includes('Firefox/')) browser = 'Firefox';
  else if (ua.includes('Safari/')) browser = 'Safari';

  let os = 'Unknown';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Macintosh')) os = 'macOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone')) os = 'iOS';

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  
  let deviceType: 'desktop' | 'laptop' | 'mobile' = isMobile ? 'mobile' : 'desktop';
  
  // Heuristic for laptop vs desktop based on screen resolution
  if (!isMobile) {
    const screenWidth = window.screen.width;
    if (screenWidth >= 1024 && screenWidth <= 1600) {
      deviceType = 'laptop';
    } else if (screenWidth > 1600) {
      deviceType = 'desktop';
    }
  }
  
  return { browser, os, isMobile, deviceType };
}