import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { Note, Reminder } from '@/db/schema';
import * as remindersRepo from '@/db/repositories/remindersRepo';
import * as notesRepo from '@/db/repositories/notesRepo';
import { firstLine } from '@/lib/htmlToText';

// Only module allowed to touch expo-notifications (architecture rule 8).
// Web (v1): scheduling is a no-op — reminder configs still save (EC-6).

const isWeb = Platform.OS === 'web';

export async function ensurePermission(): Promise<'granted' | 'denied'> {
  if (isWeb) return 'denied';
  const current = await Notifications.getPermissionsAsync();
  if (current.status === 'granted') return 'granted';
  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === 'granted' ? 'granted' : 'denied';
}

// Our weekday 1=Mon..7=Sun → expo/iOS calendar weekday 1=Sun..7=Sat.
export function toExpoWeekday(ours: number): number {
  return (ours % 7) + 1;
}

function triggerFor(reminder: Reminder): Notifications.SchedulableNotificationTriggerInput {
  if (reminder.kind === 'once') {
    return { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(reminder.atDatetime!) };
  }
  const [hour, minute] = (reminder.timeOfDay ?? '09:00').split(':').map(Number);
  if (reminder.kind === 'daily') {
    return { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute };
  }
  return {
    type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
    weekday: toExpoWeekday(reminder.weekday ?? 1),
    hour,
    minute,
  };
}

export async function schedule(reminder: Reminder, note: Note): Promise<string | null> {
  if (isWeb) return null;
  return Notifications.scheduleNotificationAsync({
    content: {
      title: note.title.trim() || 'Reminder',
      body: firstLine(note.bodyText) || 'Open your note',
      data: { noteId: note.id },
    },
    trigger: triggerFor(reminder),
  });
}

export async function cancel(notificationId: string): Promise<void> {
  if (isWeb) return;
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

export async function cancelMany(notificationIds: string[]): Promise<void> {
  await Promise.all(notificationIds.map((id) => cancel(id)));
}

// Cancel-then-schedule so there is never a double-fire or a gap (AC-3.3).
export async function reschedule(reminder: Reminder, note: Note, oldNotificationId: string | null): Promise<string | null> {
  if (oldNotificationId) await cancel(oldNotificationId);
  return schedule(reminder, note);
}

// Launch sweep (AC-2.4, EC-1, EC-2): restore OS schedules lost to reboots or
// timezone changes, clear orphans, and mark fired once-reminders.
export async function reconcile(now: number = Date.now()): Promise<void> {
  if (isWeb) return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const osIds = new Set(scheduled.map((s) => s.identifier));
  const all = await remindersRepo.listAll();
  const knownIds = new Set<string>();

  for (const reminder of all) {
    if (reminder.kind === 'once' && reminder.atDatetime && reminder.atDatetime <= now) {
      if (reminder.notificationId) await remindersRepo.setNotificationId(reminder.id, null); // fired (AC-2.3)
      continue;
    }
    if (reminder.enabled !== 1) continue;
    const note = await notesRepo.getNote(reminder.noteId);
    if (!note || note.deletedAt !== null) continue; // trashed notes stay silent (EC-4)
    if (reminder.notificationId && osIds.has(reminder.notificationId)) {
      knownIds.add(reminder.notificationId);
      continue;
    }
    const newId = await schedule(reminder, note);
    if (newId) {
      await remindersRepo.setNotificationId(reminder.id, newId);
      knownIds.add(newId);
    }
  }

  for (const s of scheduled) {
    if (!knownIds.has(s.identifier)) await cancel(s.identifier); // orphan cleanup
  }
}

// Re-arm enabled reminders of a restored note (EC-4).
export async function rescheduleForNote(noteId: string): Promise<void> {
  if (isWeb) return;
  const note = await notesRepo.getNote(noteId);
  if (!note || note.deletedAt !== null) return;
  for (const reminder of await remindersRepo.listByNote(noteId)) {
    if (reminder.enabled !== 1) continue;
    if (reminder.kind === 'once' && reminder.atDatetime && reminder.atDatetime <= Date.now()) continue;
    const id = await reschedule(reminder, note, reminder.notificationId);
    await remindersRepo.setNotificationId(reminder.id, id);
  }
}

export function setupNotificationHandling(onOpenNote: (noteId: string) => void): () => void {
  if (isWeb) return () => {};
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    const noteId = response.notification.request.content.data?.noteId;
    if (typeof noteId === 'string') onOpenNote(noteId); // AC-2.2 deep link
  });
  // A notification may have launched the app from a killed state.
  void Notifications.getLastNotificationResponseAsync?.().then((response) => {
    const noteId = response?.notification.request.content.data?.noteId;
    if (typeof noteId === 'string') onOpenNote(noteId);
  });
  return () => sub.remove();
}
