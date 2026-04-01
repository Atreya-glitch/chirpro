
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support desktop notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

export const showKeywordNotification = (content: string) => {
  if (typeof window === 'undefined' || Notification.permission !== 'granted') return;

  const keywords = ['cricket', 'science'];
  const hasKeyword = keywords.some(keyword => 
    content.toLowerCase().includes(keyword.toLowerCase())
  );

  if (hasKeyword) {
    new Notification('🐦 New Chirp Insight!', {
      body: content,
      icon: '/favicon.ico',
      tag: 'keyword-match',
    });
  }
};
