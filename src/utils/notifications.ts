export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  const perm = await Notification.requestPermission();
  return perm === 'granted';
}

export function sendNotification(title: string, body: string, icon = '/favicon.svg'): void {
  if (Notification.permission !== 'granted') return;
  new Notification(title, { body, icon });
}

export function scheduleNotification(title: string, body: string, delayMs: number): ReturnType<typeof setTimeout> {
  return setTimeout(() => sendNotification(title, body), delayMs);
}
