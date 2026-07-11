import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type Database from 'better-sqlite3';
import { createTestDb } from '../helpers/db';
import { setDb } from '@/db/client';
import * as notesRepo from '@/db/repositories/notesRepo';
import * as foldersRepo from '@/db/repositories/foldersRepo';
import SearchScreen from '@/app/(tabs)/search';

const mockRouterPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockRouterPush, navigate: jest.fn(), setParams: jest.fn(), canGoBack: () => true }),
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

function renderScreen() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <SearchScreen />
    </QueryClientProvider>,
  );
}

async function seed(title: string, body: string, folderId?: string) {
  const n = await notesRepo.createNote(folderId ?? null);
  await notesRepo.updateNoteContent(n.id, { title, bodyHtml: `<p>${body}</p>` });
  return n;
}

describe('SearchScreen', () => {
  beforeAll(() => jest.useFakeTimers());
  afterAll(() => jest.useRealTimers());

  it('starts in hint state and searches after the debounce (IT-1 / AC-1.1, AC-3.1)', async () => {
    await seed('Groceries', 'buy oat milk');
    const { getByTestId, getByText, findByText } = renderScreen();
    expect(getByText('Search your notes')).toBeTruthy();

    fireEvent.changeText(getByTestId('search-input'), 'gro');
    act(() => {
      jest.advanceTimersByTime(250);
    });
    expect(await findByText('Groceries')).toBeTruthy();
  });

  it('shows snippet highlight and folder metadata (IT-2 / AC-2.1, AC-2.4)', async () => {
    const folder = await foldersRepo.createFolder('Home');
    await seed('Groceries', 'remember oat milk', folder.id);
    const { getByTestId, findByText } = renderScreen();
    fireEvent.changeText(getByTestId('search-input'), 'oat');
    act(() => {
      jest.advanceTimersByTime(250);
    });
    expect(await findByText('Home')).toBeTruthy();
    expect(await findByText(/oat/)).toBeTruthy();
  });

  it('opens the note on tap (AC-2.3)', async () => {
    const note = await seed('Groceries', 'oat milk');
    const { getByTestId, findByTestId } = renderScreen();
    fireEvent.changeText(getByTestId('search-input'), 'oat');
    act(() => {
      jest.advanceTimersByTime(250);
    });
    fireEvent.press(await findByTestId(`search-result-${note.id}`));
    expect(mockRouterPush).toHaveBeenCalledWith(`/note/${note.id}`);
  });

  it('shows no-results state and clears back to hint (IT-3 / AC-3.2, AC-3.3)', async () => {
    await seed('Groceries', 'milk');
    const { getByTestId, getByLabelText, findByText, getByText } = renderScreen();
    fireEvent.changeText(getByTestId('search-input'), 'xyzzy');
    act(() => {
      jest.advanceTimersByTime(250);
    });
    expect(await findByText('No results for “xyzzy”')).toBeTruthy();

    fireEvent.press(getByLabelText('Clear search'));
    await waitFor(() => expect(getByText('Search your notes')).toBeTruthy());
  });
});
