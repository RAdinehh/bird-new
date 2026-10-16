/**
 * useMultiSelect — هوک عمومی Multi-Select با Long-Press
 *
 * استفاده:
 *   const ms = useMultiSelect({
 *     items: list,
 *     getId: (e) => e.id,
 *     onDelete: async (ids) => { ... },
 *     onArchive: async (ids) => { ... },  // اختیاری
 *   });
 */
import { useState, useRef, useCallback, useMemo } from 'react';

export interface MultiSelectConfig<T> {
  items: T[];
  getId: (item: T) => string;
  onDelete?: (ids: string[]) => void | Promise<void>;
  onArchive?: (ids: string[]) => void | Promise<void>;
  onCustomAction?: {
    label: string;
    icon?: string;
    danger?: boolean;
    action: (ids: string[]) => void | Promise<void>;
  };
  /** زمان نگه‌داشتن (میلی‌ثانیه) — پیش‌فرض ۵۰۰ */
  longPressMs?: number;
}

export interface MultiSelectState<T> {
  /** آیا حالت انتخاب فعاله؟ */
  selectionMode: boolean;
  /** آی‌دی‌های انتخاب‌شده */
  selectedIds: Set<string>;
  /** لیست آیتم‌های انتخاب‌شده */
  selectedItems: T[];
  /** تعداد انتخاب */
  count: number;
  /** اگه آیتم انتخاب شده؟ */
  isSelected: (id: string) => boolean;
  /** toggle یه آیتم */
  toggleSelect: (id: string) => void;
  /** لغو همه انتخاب */
  clearSelection: () => void;
  /** خروج از حالت انتخاب */
  exitSelection: () => void;
  /** انتخاب همه */
  selectAll: () => void;
  /** حذف گروهی */
  doDelete: () => Promise<void>;
  /** آرشیو گروهی */
  doArchive: () => Promise<void>;
  /** اکشن سفارشی */
  doCustom: () => Promise<void>;
  /** دستگیره‌های Long-Press */
  startLongPress: (id: string) => void;
  cancelLongPress: () => void;
  /** آیا Long-Press fire شد؟ */
  didLongPressFire: () => boolean;
  /** reset fire flag */
  resetLongPressFire: () => void;
  /** آیا دکمه‌ی آرشیو موجوده؟ */
  hasArchive: boolean;
  /** آیا دکمه‌ی حذف موجوده؟ */
  hasDelete: boolean;
  /** اکشن سفارشی */
  customAction?: MultiSelectConfig<T>['onCustomAction'];
}

export function useMultiSelect<T>(config: MultiSelectConfig<T>): MultiSelectState<T> {
  const {
    items, getId, onDelete, onArchive, onCustomAction,
    longPressMs = 800,
  } = config;

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const longPressTimerRef = useRef<number | null>(null);
  const longPressFiredRef = useRef<boolean>(false);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const startLongPress = useCallback((id: string) => {
    if (selectionMode) return;
    longPressFiredRef.current = false;
    if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = window.setTimeout(() => {
      longPressFiredRef.current = true;
      setSelectionMode(true);
      setSelectedIds(new Set([id]));
      try { (navigator as any).vibrate?.([15]); } catch { /* silent */ }
      longPressTimerRef.current = null;
    }, longPressMs);
  }, [selectionMode, longPressMs]);

  const cancelLongPress = useCallback(() => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const exitSelection = useCallback(() => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(items.map(getId)));
  }, [items, getId]);

  const selectedItems = useMemo(() => {
    return items.filter(item => selectedIds.has(getId(item)));
  }, [items, selectedIds, getId]);

  const doDelete = useCallback(async () => {
    if (!onDelete) return;
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    await onDelete(ids);
    exitSelection();
  }, [onDelete, selectedIds, exitSelection]);

  const doArchive = useCallback(async () => {
    if (!onArchive) return;
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    await onArchive(ids);
    exitSelection();
  }, [onArchive, selectedIds, exitSelection]);

  const doCustom = useCallback(async () => {
    if (!onCustomAction) return;
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    await onCustomAction.action(ids);
    exitSelection();
  }, [onCustomAction, selectedIds, exitSelection]);

  const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds]);
  const didLongPressFire = useCallback(() => longPressFiredRef.current, []);
  const resetLongPressFire = useCallback(() => { longPressFiredRef.current = false; }, []);

  return {
    selectionMode,
    selectedIds,
    selectedItems,
    count: selectedIds.size,
    isSelected,
    toggleSelect,
    clearSelection,
    exitSelection,
    selectAll,
    doDelete,
    doArchive,
    doCustom,
    startLongPress,
    cancelLongPress,
    didLongPressFire,
    resetLongPressFire,
    hasArchive: !!onArchive,
    hasDelete: !!onDelete,
    customAction: onCustomAction,
  };
}
