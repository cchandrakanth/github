import { useCallback, useEffect, useRef } from 'react';

export const AUTOSAVE_DEBOUNCE_MS = 800;

// Debounced autosave (AC-1.2): save fires <=1s after typing stops and always
// flushes pending changes on unmount.
export function useAutosave<T>(save: (value: T) => void | Promise<void>, delayMs: number = AUTOSAVE_DEBOUNCE_MS) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<{ value: T } | null>(null);
  const saveRef = useRef(save);
  saveRef.current = save;

  const flush = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (pending.current) {
      const { value } = pending.current;
      pending.current = null;
      void saveRef.current(value);
    }
  }, []);

  const schedule = useCallback(
    (value: T) => {
      pending.current = { value };
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, delayMs);
    },
    [delayMs, flush],
  );

  useEffect(() => flush, [flush]); // flush on unmount

  return { schedule, flush };
}
