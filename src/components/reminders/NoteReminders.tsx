import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as remindersRepo from '@/db/repositories/remindersRepo';
import * as notesRepo from '@/db/repositories/notesRepo';
import * as notifications from '@/lib/notifications';
import { scheduleSummary } from '@/lib/reminderTime';
import { ReminderPicker, type ReminderDraft } from '@/components/reminders/ReminderPicker';

// Reminders section inside the note editor (AC-1.1, AC-1.4).
export function NoteReminders({ noteId }: { noteId: string }) {
  const queryClient = useQueryClient();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const { data: reminders } = useQuery({
    queryKey: ['reminders', noteId],
    queryFn: () => remindersRepo.listByNote(noteId),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['reminders'] });

  const save = async (draft: ReminderDraft) => {
    try {
      const reminder = await remindersRepo.createReminder({ noteId, ...draft });
      const permission = await notifications.ensurePermission();
      if (permission === 'granted') {
        const note = await notesRepo.getNote(noteId);
        if (note) {
          const notificationId = await notifications.schedule(reminder, note);
          await remindersRepo.setNotificationId(reminder.id, notificationId);
        }
      } else {
        await remindersRepo.setEnabled(reminder.id, false, null); // saved but silent (AC-1.2)
        if (Platform.OS !== 'web') setPermissionDenied(true);
      }
      setPickerOpen(false);
      setError(null);
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const remove = async (id: string, notificationId: string | null) => {
    if (notificationId) await notifications.cancel(notificationId);
    await remindersRepo.deleteReminder(id);
    refresh();
  };

  return (
    <View className="gap-1 px-4 pb-1">
      <View className="flex-row flex-wrap items-center gap-1.5">
        {(reminders ?? []).map((r) => (
          <View key={r.id} className="flex-row items-center gap-1 rounded-md bg-primary/10 px-2 py-1">
            <Ionicons name="alarm-outline" size={12} color="#4f46e5" />
            <Text className="text-xs text-primary">{scheduleSummary(r)}</Text>
            {r.enabled !== 1 && <Text className="text-xs text-muted-foreground">(paused)</Text>}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Remove reminder ${scheduleSummary(r)}`}
              onPress={() => void remove(r.id, r.notificationId)}
            >
              <Ionicons name="close" size={12} color="#4f46e5" />
            </Pressable>
          </View>
        ))}
        <Pressable
          testID="add-reminder"
          accessibilityRole="button"
          accessibilityLabel="Add reminder"
          className="flex-row items-center gap-1 rounded-md border border-border px-2 py-1"
          onPress={() => {
            setError(null);
            setPickerOpen(true);
          }}
        >
          <Ionicons name="alarm-outline" size={12} color="#71717a" />
          <Text className="text-xs text-muted-foreground">Add reminder</Text>
        </Pressable>
      </View>
      {Platform.OS === 'web' && (reminders ?? []).length > 0 && (
        <Text className="text-xs text-muted-foreground">Notifications fire on the mobile app (EC-6).</Text>
      )}
      {permissionDenied && (
        <View className="flex-row items-center gap-2 rounded-lg bg-muted p-2">
          <Ionicons name="notifications-off-outline" size={14} color="#71717a" />
          <Text className="flex-1 text-xs text-muted-foreground">
            Notifications are off. Enable them in system settings, then toggle the reminder on.
          </Text>
        </View>
      )}
      {pickerOpen && <ReminderPicker visible error={error} onSave={(d) => void save(d)} onClose={() => setPickerOpen(false)} />}
    </View>
  );
}
