import { Platform } from 'react-native';

// Only module allowed to touch expo-notifications. Expanded by the
// note-reminders feature (specs/note-reminders); notes-crud needs cancel
// support so deleting a note clears its scheduled notifications (AC-4.4).

export async function cancel(notificationId: string): Promise<void> {
  if (Platform.OS === 'web') return; // no local notifications on web (v1)
  const Notifications = await import('expo-notifications');
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

export async function cancelMany(notificationIds: string[]): Promise<void> {
  await Promise.all(notificationIds.map((id) => cancel(id)));
}
