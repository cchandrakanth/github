import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type Database from 'better-sqlite3';
import * as Notifications from 'expo-notifications';
import { createTestDb } from '../helpers/db';
import { setDb } from '@/db/client';
import * as notesRepo from '@/db/repositories/notesRepo';
import * as remindersRepo from '@/db/repositories/remindersRepo';
import { NoteReminders } from '@/components/reminders/NoteReminders';
import RemindersScreen from '@/app/(tabs)/reminders';

const mocked = Notifications as jest.Mocked<typeof Notifications>;

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), navigate: jest.fn(), setParams: jest.fn(), canGoBack: () => true }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaView: ({ children }: any) => children,
}));

let sqlite: Database.Database;
let noteId: string;

beforeEach(async () => {
  ({ sqlite } = await createTestDb());
  jest.clearAllMocks();
  mocked.scheduleNotificationAsync.mockResolvedValue('os-fresh');
  mocked.getPermissionsAsync.mockResolvedValue({ status: 'granted' } as any);
  mocked.requestPermissionsAsync.mockResolvedValue({ status: 'granted' } as any);
  const note = await notesRepo.createNote();
  await notesRepo.updateNoteContent(note.id, { title: 'Morning routine' });
  noteId = note.id;
});

afterEach(() => {
  setDb(null);
  sqlite.close();
});

function withQuery(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{ui}</QueryClientProvider>;
}

describe('NoteReminders picker flow (IT-1 / AC-1.1, AC-1.2)', () => {
  it('saves a daily reminder and schedules a notification when permission is granted', async () => {
    const { findByTestId, findByLabelText } = render(withQuery(<NoteReminders noteId={noteId} />));
    fireEvent.press(await findByTestId('add-reminder'));
    fireEvent.changeText(await findByTestId('reminder-time-input'), '07:30');
    fireEvent.press(await findByLabelText('Save reminder'));
    await waitFor(async () => {
      const rows = await remindersRepo.listByNote(noteId);
      expect(rows).toHaveLength(1);
      expect(rows[0].timeOfDay).toBe('07:30');
      expect(rows[0].enabled).toBe(1);
      expect(rows[0].notificationId).toBe('os-fresh');
    });
    expect(mocked.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
  });

  it('saves the reminder disabled with a banner when permission is denied', async () => {
    mocked.getPermissionsAsync.mockResolvedValue({ status: 'denied' } as any);
    mocked.requestPermissionsAsync.mockResolvedValue({ status: 'denied' } as any);
    const { findByTestId, findByLabelText, findByText } = render(withQuery(<NoteReminders noteId={noteId} />));
    fireEvent.press(await findByTestId('add-reminder'));
    fireEvent.press(await findByLabelText('Save reminder'));
    await waitFor(async () => {
      const rows = await remindersRepo.listByNote(noteId);
      expect(rows).toHaveLength(1);
      expect(rows[0].enabled).toBe(0);
      expect(rows[0].notificationId).toBeNull();
    });
    expect(mocked.scheduleNotificationAsync).not.toHaveBeenCalled();
    expect(await findByText(/Notifications are off/)).toBeTruthy();
  });

  it('shows validation error for a past once-reminder (AC-1.5)', async () => {
    const { findByTestId, findByLabelText, findByText } = render(withQuery(<NoteReminders noteId={noteId} />));
    fireEvent.press(await findByTestId('add-reminder'));
    fireEvent.press(await findByLabelText('Once'));
    fireEvent.changeText(await findByTestId('reminder-date-input'), '2020-01-01');
    fireEvent.press(await findByLabelText('Save reminder'));
    expect(await findByText('Reminder time must be in the future')).toBeTruthy();
    expect(await remindersRepo.listByNote(noteId)).toHaveLength(0);
  });
});

describe('Reminders tab (IT-2, IT-3, IT-4 / AC-3.1, AC-3.2)', () => {
  it('groups into Today/Upcoming/Paused with summaries', async () => {
    const daily = await remindersRepo.createReminder({ noteId, kind: 'daily', timeOfDay: '23:59' });
    await remindersRepo.setNotificationId(daily.id, 'os-a');
    const paused = await remindersRepo.createReminder({ noteId, kind: 'weekly', timeOfDay: '10:00', weekday: 3 });
    await remindersRepo.setEnabled(paused.id, false, null);

    const { findByText } = render(withQuery(<RemindersScreen />));
    expect(await findByText('Today')).toBeTruthy(); // 23:59 is still today
    expect(await findByText('Paused')).toBeTruthy();
    expect(await findByText(/Daily · 23:59/)).toBeTruthy();
    expect(await findByText(/Weekly · Wed · 10:00/)).toBeTruthy();
  });

  it('pause cancels the notification; resume schedules a new one', async () => {
    const daily = await remindersRepo.createReminder({ noteId, kind: 'daily', timeOfDay: '23:59' });
    await remindersRepo.setNotificationId(daily.id, 'os-live');

    const { findByLabelText } = render(withQuery(<RemindersScreen />));
    const toggle = await findByLabelText('Pause reminder for Morning routine');
    fireEvent(toggle, 'valueChange', false);
    await waitFor(async () => {
      const row = await remindersRepo.getReminder(daily.id);
      expect(row!.enabled).toBe(0);
    });
    expect(mocked.cancelScheduledNotificationAsync).toHaveBeenCalledWith('os-live');

    fireEvent(await findByLabelText('Pause reminder for Morning routine'), 'valueChange', true);
    await waitFor(async () => {
      const row = await remindersRepo.getReminder(daily.id);
      expect(row!.enabled).toBe(1);
      expect(row!.notificationId).toBe('os-fresh');
    });
  });
});
