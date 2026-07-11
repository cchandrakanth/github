import { Alert, Platform } from 'react-native';
import { confirmAction } from '@/lib/confirm';
import * as notesRepo from '@/db/repositories/notesRepo';
import { cancelMany } from '@/lib/notifications';
import type { Note } from '@/db/schema';

async function togglePin(note: Note, refresh: () => void) {
  await notesRepo.setPinned(note.id, note.pinned !== 1);
  refresh();
}

function deleteNote(note: Note, refresh: () => void) {
  confirmAction('Delete note?', 'It will move to Trash. You can restore it later.', 'Delete', () => {
    void notesRepo.softDeleteNote(note.id).then(({ cancelledNotificationIds }) => {
      void cancelMany(cancelledNotificationIds);
      refresh();
    });
  });
}

export function noteActionsMenu(note: Note, refresh: () => void): void {
  const pinLabel = note.pinned === 1 ? 'Unpin' : 'Pin';
  if (Platform.OS === 'web') {
    void togglePin(note, refresh); // web uses hover menu in v2; long-press fallback toggles pin
    return;
  }
  Alert.alert(note.title || 'Untitled', undefined, [
    { text: pinLabel, onPress: () => void togglePin(note, refresh) },
    { text: 'Delete', style: 'destructive', onPress: () => deleteNote(note, refresh) },
    { text: 'Cancel', style: 'cancel' },
  ]);
}
