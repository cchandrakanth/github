import { useState } from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';

interface Props {
  visible: boolean;
  title: string;
  initialValue?: string;
  submitLabel: string;
  error?: string | null;
  onSubmit: (value: string) => void;
  onClose: () => void;
}

export function NameDialog({ visible, title, initialValue = '', submitLabel, error, onSubmit, onClose }: Props) {
  const [value, setValue] = useState(initialValue);
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/40 p-6">
        <View className="w-full max-w-sm gap-3 rounded-xl bg-background p-4">
          <Text className="text-lg font-semibold text-foreground">{title}</Text>
          <TextInput
            testID="name-dialog-input"
            autoFocus
            defaultValue={initialValue}
            placeholder="Name"
            className="rounded-lg border border-border px-3 py-2 text-base text-foreground"
            onChangeText={setValue}
            onSubmitEditing={() => onSubmit(value)}
          />
          {error ? <Text className="text-xs text-destructive">{error}</Text> : null}
          <View className="flex-row justify-end gap-3">
            <Pressable accessibilityRole="button" className="px-3 py-2" onPress={onClose}>
              <Text className="text-muted-foreground">Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={submitLabel}
              className="rounded-lg bg-primary px-3 py-2"
              onPress={() => onSubmit(value)}
            >
              <Text className="text-primary-foreground">{submitLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
