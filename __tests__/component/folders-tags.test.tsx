import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type Database from 'better-sqlite3';
import { createTestDb } from '../helpers/db';
import { setDb } from '@/db/client';
import * as foldersRepo from '@/db/repositories/foldersRepo';
import * as tagsRepo from '@/db/repositories/tagsRepo';
import * as notesRepo from '@/db/repositories/notesRepo';
import { FolderChipRow } from '@/components/folders/FolderChipRow';
import { FolderSelector } from '@/components/folders/FolderSelector';
import { TagPicker } from '@/components/tags/TagPicker';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), navigate: jest.fn(), setParams: jest.fn(), canGoBack: () => true }),
}));

let sqlite: Database.Database;

beforeEach(async () => {
  ({ sqlite } = await createTestDb());
});

afterEach(() => {
  setDb(null);
  sqlite.close();
});

function withQuery(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{ui}</QueryClientProvider>;
}

describe('FolderChipRow (IT-2 / AC-1.4, AC-2.2)', () => {
  it('renders All/Unfiled/folder chips with counts and fires selection', async () => {
    const onSelect = jest.fn();
    const folder = await foldersRepo.createFolder('Work');
    const { getByLabelText } = render(
      <FolderChipRow
        folders={[{ ...folder, liveNoteCount: 2 }]}
        unfiledCount={3}
        totalCount={5}
        active={{ kind: 'all' }}
        onSelect={onSelect}
        onCreate={jest.fn()}
      />,
    );
    expect(getByLabelText('All (5)').props.accessibilityState.selected).toBe(true);
    fireEvent.press(getByLabelText('Work (2)'));
    expect(onSelect).toHaveBeenCalledWith({ kind: 'folder', id: folder.id });
    fireEvent.press(getByLabelText('Unfiled (3)'));
    expect(onSelect).toHaveBeenCalledWith({ kind: 'unfiled' });
  });
});

describe('FolderSelector (IT-1 / AC-2.1)', () => {
  it('moves the note to the picked folder', async () => {
    await foldersRepo.createFolder('Work');
    const onSelect = jest.fn();
    const { getByTestId, findByLabelText } = render(withQuery(<FolderSelector folderId={null} onSelect={onSelect} />));
    fireEvent.press(getByTestId('folder-selector'));
    fireEvent.press(await findByLabelText('Move to Work'));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0][0]).not.toBeNull();
  });
});

describe('TagPicker (IT-3 / AC-3.1)', () => {
  it('creates a tag inline (find-or-create) and selects it', async () => {
    const note = await notesRepo.createNote();
    await notesRepo.updateNoteContent(note.id, { title: 'n' });
    const onChange = jest.fn();
    const { getByTestId, findByLabelText } = render(
      withQuery(<TagPicker visible selectedIds={[]} onChange={onChange} onClose={jest.fn()} />),
    );
    fireEvent.changeText(getByTestId('tag-search-input'), 'shopping');
    fireEvent.press(await findByLabelText('Create tag shopping'));
    await waitFor(async () => {
      const tags = await tagsRepo.listTags();
      expect(tags.map((t) => t.name)).toEqual(['shopping']);
      expect(onChange).toHaveBeenCalledWith([tags[0].id]);
    });
  });

  it('toggles existing tags', async () => {
    const tag = await tagsRepo.findOrCreateTag('urgent');
    const onChange = jest.fn();
    const { findByLabelText } = render(withQuery(<TagPicker visible selectedIds={[]} onChange={onChange} onClose={jest.fn()} />));
    fireEvent.press(await findByLabelText('Tag urgent'));
    expect(onChange).toHaveBeenCalledWith([tag.id]);
  });
});
