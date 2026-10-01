import { useState, useCallback, useRef } from 'react';

export interface UndoItem<T = any> {
  id: string;
  data: T;
  label?: string;
}

export function useUndo<T = any>(timeoutMs: number = 6000) {
  const [undoItem, setUndoItem] = useState<UndoItem<T> | null>(null);
  const timerRef = useRef<any>(null);

  const register = useCallback((id: string, data: T, label?: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setUndoItem({ id, data, label });
    timerRef.current = setTimeout(() => {
      setUndoItem(null);
      timerRef.current = null;
    }, timeoutMs);
  }, [timeoutMs]);

  const consume = useCallback((): UndoItem<T> | null => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const item = undoItem;
    setUndoItem(null);
    timerRef.current = null;
    return item;
  }, [undoItem]);

  const clear = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setUndoItem(null);
    timerRef.current = null;
  }, []);

  return { undoItem, register, consume, clear };
}
