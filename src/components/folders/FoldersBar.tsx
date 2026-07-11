import { useState } from 'react';
import { Alert, Platform } from 'react-native';
import { FolderChipRow, type FolderFilter } from '@/components/folders/FolderChipRow';
import { NameDialog } from '@/components/NameDialog';
import { useFolderData } from '@/components/folders/useFolderData';
import * as foldersRepo from '@/db/repositories/foldersRepo';
import { confirmAction } from '@/lib/confirm';
import type { FolderWithCount } from '@/db/repositories/foldersRepo';

interface Props {
  active: FolderFilter;
  onSelect: (filter: FolderFilter) => void;
}

export function FoldersBar({ active, onSelect }: Props) {
  const { folders, unfiledCount, totalCount, refresh } = useFolderData();
  const [dialog, setDialog] = useState<{ mode: 'create' } | { mode: 'rename'; folder: FolderWithCount } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (value: string) => {
    try {
      if (dialog?.mode === 'rename') await foldersRepo.renameFolder(dialog.folder.id, value);
      else await foldersRepo.createFolder(value);
      setDialog(null);
      setError(null);
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const deleteFolder = (folder: FolderWithCount) => {
    confirmAction('Delete folder?', `Notes in "${folder.name}" move to Unfiled.`, 'Delete', () => {
      void foldersRepo.deleteFolder(folder.id).then(() => {
        if (active.kind === 'folder' && active.id === folder.id) onSelect({ kind: 'all' }); // EC-1
        refresh();
      });
    });
  };

  const move = async (folder: FolderWithCount, dir: -1 | 1) => {
    const ids = folders.map((f) => f.id);
    const i = ids.indexOf(folder.id);
    const j = i + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    await foldersRepo.reorderFolders(ids);
    refresh();
  };

  const onLongPressFolder = (folder: FolderWithCount) => {
    if (Platform.OS === 'web') {
      setDialog({ mode: 'rename', folder });
      return;
    }
    Alert.alert(folder.name, undefined, [
      { text: 'Rename', onPress: () => setDialog({ mode: 'rename', folder }) },
      { text: 'Move left', onPress: () => void move(folder, -1) },
      { text: 'Move right', onPress: () => void move(folder, 1) },
      { text: 'Delete', style: 'destructive', onPress: () => deleteFolder(folder) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <>
      <FolderChipRow
        folders={folders}
        unfiledCount={unfiledCount}
        totalCount={totalCount}
        active={active}
        onSelect={onSelect}
        onLongPressFolder={onLongPressFolder}
        onCreate={() => {
          setError(null);
          setDialog({ mode: 'create' });
        }}
      />
      {dialog && (
        <NameDialog
          visible
          title={dialog.mode === 'rename' ? 'Rename folder' : 'New folder'}
          initialValue={dialog.mode === 'rename' ? dialog.folder.name : ''}
          submitLabel={dialog.mode === 'rename' ? 'Rename' : 'Create'}
          error={error}
          onSubmit={(v) => void submit(v)}
          onClose={() => {
            setDialog(null);
            setError(null);
          }}
        />
      )}
    </>
  );
}
