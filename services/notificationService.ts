import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export interface ScheduleArgs {
  id: string;
  title: string;
  body: string;
  date: Date;
}

let hasRequested = false;

export async function requestPermissions(): Promise<boolean> {
  try {
    const settings = await Notifications.getPermissionsAsync();
    let granted = settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED;

    if (!granted && !hasRequested) {
      const request = await Notifications.requestPermissionsAsync();
      hasRequested = true;
      granted = request.granted || request.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED;
    }

    if (!granted && Platform.OS === 'web') {
      console.log('[Notifications] Web permissions not supported via Expo in this app; skipping scheduling');
      return false;
    }

    return granted;
  } catch (e) {
    console.error('[Notifications] ensurePermissions error', e);
    return false;
  }
}

const ensurePermissions = requestPermissions;

export async function scheduleLocalNotification({ id, title, body, date }: ScheduleArgs): Promise<string | null> {
  try {
    const allowed = await ensurePermissions();
    if (!allowed) return null;

    const identifier = await Notifications.scheduleNotificationAsync({
      content: { title, body },
      // SDK typing differences across versions; casting to supported trigger type
      trigger: date as unknown as Notifications.NotificationTriggerInput,
    });

    console.log('[Notifications] scheduled', { id, identifier, date: date.toISOString() });
    return identifier;
  } catch (e) {
    console.error('[Notifications] schedule error', e);
    return null;
  }
}

export async function cancelScheduledNotification(identifier: string | undefined | null): Promise<void> {
  try {
    if (!identifier) return;
    await Notifications.cancelScheduledNotificationAsync(identifier);
    console.log('[Notifications] canceled', identifier);
  } catch (e) {
    console.error('[Notifications] cancel error', e);
  }
}

export async function cancelMultiple(identifiers: (string | undefined | null)[]): Promise<void> {
  await Promise.all(identifiers.map((id) => cancelScheduledNotification(id)));
}

export function getNextMonthlyDate(paymentDayOfMonth?: number): Date | null {
  if (!paymentDayOfMonth || paymentDayOfMonth < 1 || paymentDayOfMonth > 31) return null;
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const candidate = new Date(year, month, Math.min(paymentDayOfMonth, 28), 9, 0, 0, 0);
  if (candidate.getTime() <= now.getTime()) {
    candidate.setMonth(candidate.getMonth() + 1);
  }
  return candidate;
}
