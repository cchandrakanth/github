import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as foldersRepo from '@/db/repositories/foldersRepo';
import * as notesRepo from '@/db/repositories/notesRepo';

export function useFolderData() {
  const queryClient = useQueryClient();
  const folders = useQuery({ queryKey: ['folders'], queryFn: foldersRepo.listFoldersWithCounts });
  const unfiled = useQuery({ queryKey: ['folders', 'unfiled-count'], queryFn: foldersRepo.countUnfiled });
  const total = useQuery({ queryKey: ['folders', 'total-count'], queryFn: notesRepo.countLiveNotes });
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['folders'] });
    void queryClient.invalidateQueries({ queryKey: ['notes'] });
  };
  return {
    folders: folders.data ?? [],
    unfiledCount: unfiled.data ?? 0,
    totalCount: total.data ?? 0,
    refresh,
  };
}
