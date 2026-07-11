import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type Database from 'better-sqlite3';
import { createTestDb } from '../helpers/db';
import { setDb } from '@/db/client';
import * as notesRepo from '@/db/repositories/notesRepo';
import { NotesList } from '@/components/NotesList';
import { TrashList } from '@/app/trash';
import { useAutosave } from '@/hooks/useAutosave';
import { Text, Pressable } from 'react-native';

const mockRouterPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockRouterPush, back: jest.fn(), navigate: jest.fn(), canGoBack: () => true }),
  Stack: { Screen: () => null },
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaView: ({ children }: any) => children,
}));

let sqlite: Database.Database;

beforeEach(async () => {
  ({ sqlite } = await createTestDb());
  mockRouterPush.mockClear();
});

afterEach(() => {
  setDb(null);
  sqlite.close();
});

function withQuery(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{ui}</QueryClientProvider>;
}

describe('NotesList (IT-3, IT-4)', () => {
  it('shows empty state with no notes (AC-3.5)', async () => {
    const { findByTestId } = render(withQuery(<NotesList />));
    expect(await findByTestId('empty-state')).toBeTruthy();
  });

  it('renders notes and opens the editor route on tap (AC-3.1)', async () => {
    const note = await notesRepo.createNote();
    await notesRepo.updateNoteContent(note.id, { title: 'Groceries', bodyHtml: '<p>milk</p>' });
    const { findByText } = render(withQuery(<NotesList />));
    fireEvent.press(await findByText('Groceries'));
    expect(mockRouterPush).toHaveBeenCalledWith(`/note/${note.id}`);
  });

  it('shows pinned notes first with pin indicator data (AC-3.4)', async () => {
    const a = await notesRepo.createNote();
    await notesRepo.updateNoteContent(a.id, { title: 'first unpinned' });
    const b = await notesRepo.createNote();
    await notesRepo.updateNoteContent(b.id, { title: 'second pinned' });
    await notesRepo.setPinned(b.id, true);
    // a edited later so it is newest
    await notesRepo.updateNoteContent(a.id, { title: 'first unpinned!' });

    const { findByText, getByTestId } = render(withQuery(<NotesList />));
    await findByText('second pinned');
    const titles = getByTestId('notes-list').props.data.map((n: any) => n.title);
    expect(titles).toEqual(['second pinned', 'first unpinned!']);
  });
});

describe('TrashList (IT-5 / AC-4.2)', () => {
  it('restores a trashed note', async () => {
    const note = await notesRepo.createNote();
    await notesRepo.updateNoteContent(note.id, { title: 'bring me back' });
    await notesRepo.softDeleteNote(note.id);

    const { findByLabelText } = render(withQuery(<TrashList />));
    fireEvent.press(await findByLabelText('Restore bring me back'));
    await waitFor(async () => {
      expect((await notesRepo.listNotes()).map((n) => n.title)).toEqual(['bring me back']);
    });
  });
});

describe('useAutosave (IT-1 / AC-1.2)', () => {
  beforeAll(() => jest.useFakeTimers());
  afterAll(() => jest.useRealTimers());

  function Probe({ save }: { save: (v: string) => void }) {
    const { schedule } = useAutosave<string>(save);
    return (
      <Pressable testID="type" onPress={() => schedule('typed value')}>
        <Text>type</Text>
      </Pressable>
    );
  }

  it('debounces and saves within 1s of the last keystroke', () => {
    const save = jest.fn();
    const { getByTestId } = render(<Probe save={save} />);
    fireEvent.press(getByTestId('type'));
    fireEvent.press(getByTestId('type'));
    expect(save).not.toHaveBeenCalled();
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith('typed value');
  });

  it('flushes pending changes on unmount (EC-2 protection)', () => {
    const save = jest.fn();
    const { getByTestId, unmount } = render(<Probe save={save} />);
    fireEvent.press(getByTestId('type'));
    unmount();
    expect(save).toHaveBeenCalledWith('typed value');
  });
});
