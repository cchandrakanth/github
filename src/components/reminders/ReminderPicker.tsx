import { useState } from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';
import type { ReminderKind } from '@/db/schema';
import { WEEKDAY_LABELS } from '@/lib/reminderTime';

export interface ReminderDraft {
  kind: ReminderKind;
  atDatetime?: number;
  timeOfDay?: string;
  weekday?: number;
}

interface Props {
  visible: boolean;
  initial?: ReminderDraft;
  error?: string | null;
  onSave: (draft: ReminderDraft) => void;
  onClose: () => void;
}

function Segment({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      className={selected ? 'flex-1 items-center rounded-md bg-background py-2 shadow-sm' : 'flex-1 items-center rounded-md py-2'}
      onPress={onPress}
    >
      <Text className={selected ? 'text-sm font-semibold text-foreground' : 'text-sm text-muted-foreground'}>{label}</Text>
    </Pressable>
  );
}

export function ReminderPicker({ visible, initial, error, onSave, onClose }: Props) {
  const [kind, setKind] = useState<ReminderKind>(initial?.kind ?? 'daily');
  const [time, setTime] = useState(initial?.timeOfDay ?? '09:00');
  const [weekday, setWeekday] = useState(initial?.weekday ?? 1);
  const [date, setDate] = useState(() =>
    initial?.atDatetime ? new Date(initial.atDatetime).toISOString().slice(0, 10) : new Date(Date.now() + 86_400_000).toISOString().slice(0, 10),
  );

  const save = () => {
    if (kind === 'once') {
      const at = new Date(`${date}T${time}:00`);
      onSave({ kind, atDatetime: at.getTime() });
    } else if (kind === 'daily') {
      onSave({ kind, timeOfDay: time });
    } else {
      onSave({ kind, timeOfDay: time, weekday });
    }
  };

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <View className="gap-4 rounded-t-2xl bg-background p-4 pb-8">
          <Text className="text-lg font-semibold text-foreground">Remind me…</Text>
          <View className="flex-row rounded-lg bg-muted p-1">
            <Segment label="Once" selected={kind === 'once'} onPress={() => setKind('once')} />
            <Segment label="Daily" selected={kind === 'daily'} onPress={() => setKind('daily')} />
            <Segment label="Weekly" selected={kind === 'weekly'} onPress={() => setKind('weekly')} />
          </View>
          {kind === 'weekly' && (
            <View className="flex-row justify-between">
              {WEEKDAY_LABELS.map((label, i) => {
                const selected = weekday === i + 1;
                return (
                  <Pressable
                    key={label}
                    accessibilityRole="button"
                    accessibilityLabel={label}
                    accessibilityState={{ selected }}
                    className={
                      selected
                        ? 'h-10 w-10 items-center justify-center rounded-full bg-primary'
                        : 'h-10 w-10 items-center justify-center rounded-full border border-border'
                    }
                    onPress={() => setWeekday(i + 1)}
                  >
                    <Text className={selected ? 'text-xs text-primary-foreground' : 'text-xs text-foreground'}>{label[0]}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}
          <View className="flex-row items-center gap-3">
            {kind === 'once' && (
              <View className="flex-1 gap-1">
                <Text className="text-xs text-muted-foreground">Date (YYYY-MM-DD)</Text>
                <TextInput
                  testID="reminder-date-input"
                  value={date}
                  className="rounded-lg border border-border px-3 py-2 text-base text-foreground"
                  onChangeText={setDate}
                />
              </View>
            )}
            <View className="flex-1 gap-1">
              <Text className="text-xs text-muted-foreground">Time (HH:mm)</Text>
              <TextInput
                testID="reminder-time-input"
                value={time}
                className="rounded-lg border border-border px-3 py-2 text-base text-foreground"
                onChangeText={setTime}
              />
            </View>
          </View>
          {error ? <Text className="text-xs text-destructive">{error}</Text> : null}
          <View className="flex-row justify-end gap-3">
            <Pressable accessibilityRole="button" accessibilityLabel="Cancel" className="px-3 py-2" onPress={onClose}>
              <Text className="text-muted-foreground">Cancel</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Save reminder" className="rounded-lg bg-primary px-4 py-2" onPress={save}>
              <Text className="text-primary-foreground">Save</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
