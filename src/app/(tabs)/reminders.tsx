import { SectionList, Pressable, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ScreenShell } from '@/components/ScreenShell';
import { EmptyState } from '@/components/EmptyState';
import * as remindersRepo from '@/db/repositories/remindersRepo';
import * as notesRepo from '@/db/repositories/notesRepo';
import * as notifications from '@/lib/notifications';
import { nextFireTime, scheduleSummary } from '@/lib/reminderTime';
import type { Reminder } from '@/db/schema';

interface Row {
  reminder: Reminder;
  noteTitle: string;
  next: Date | null;
}

async function loadRows(): Promise<{ today: Row[]; upcoming: Row[]; paused: Row[] }> {
  const all = await remindersRepo.listAll();
  const rows: Row[] = [];
  for (const reminder of all) {
    const note = await notesRepo.getNote(reminder.noteId);
    if (!note || note.deletedAt !== null) continue;
    rows.push({ reminder, noteTitle: note.title.trim() || 'Untitled', next: nextFireTime(reminder) });
  }
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  const active = rows.filter((r) => r.reminder.enabled === 1);
  const bySoonest = (a: Row, b: Row) => (a.next?.getTime() ?? Infinity) - (b.next?.getTime() ?? Infinity);
  return {
    today: active.filter((r) => r.next && r.next <= endOfToday).sort(bySoonest),
    upcoming: active.filter((r) => !r.next || r.next > endOfToday).sort(bySoonest),
    paused: rows.filter((r) => r.reminder.enabled !== 1),
  };
}

export default function RemindersScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ['reminders', 'overview'], queryFn: loadRows });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['reminders'] });

  const toggle = async (row: Row) => {
    const { reminder } = row;
    if (reminder.enabled === 1) {
      if (reminder.notificationId) await notifications.cancel(reminder.notificationId);
      await remindersRepo.setEnabled(reminder.id, false, null); // pause (AC-3.2)
    } else {
      const permission = await notifications.ensurePermission();
      const note = await notesRepo.getNote(reminder.noteId);
      const notificationId = permission === 'granted' && note ? await notifications.schedule(reminder, note) : null;
      await remindersRepo.setEnabled(reminder.id, true, notificationId); // resume
    }
    void refresh();
  };

  const sections = data
    ? [
        { title: 'Today', data: data.today },
        { title: 'Upcoming', data: data.upcoming },
        { title: 'Paused', data: data.paused },
      ].filter((s) => s.data.length > 0)
    : [];

  return (
    <ScreenShell title="Reminders">
      {data && sections.length === 0 ? (
        <EmptyState icon="alarm-outline" title="No reminders" message="Open a note and tap “Add reminder”." />
      ) : (
        <SectionList
          testID="reminders-list"
          sections={sections}
          keyExtractor={(row) => row.reminder.id}
          renderSectionHeader={({ section }) => (
            <Text className="px-4 pb-1 pt-4 text-xs font-semibold uppercase text-muted-foreground">{section.title}</Text>
          )}
          renderItem={({ item }) => (
            <View className="flex-row items-center gap-3 border-b border-border px-4 py-3">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Open note ${item.noteTitle}`}
                className="flex-1"
                onPress={() => router.push(`/note/${item.reminder.noteId}`)}
              >
                <Text numberOfLines={1} className="text-base font-medium text-foreground">
                  {item.noteTitle}
                </Text>
                <Text className="text-sm text-muted-foreground">
                  {scheduleSummary(item.reminder)}
                  {item.next ? ` · next ${item.next.toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' })}` : ''}
                </Text>
              </Pressable>
              <Switch
                accessibilityLabel={`Pause reminder for ${item.noteTitle}`}
                value={item.reminder.enabled === 1}
                onValueChange={() => void toggle(item)}
              />
            </View>
          )}
        />
      )}
    </ScreenShell>
  );
}
