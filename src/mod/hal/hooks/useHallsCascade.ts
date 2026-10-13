/**
 * useHallsCascade — وقتی سالنی حذف می‌شه، گله‌های یتیم رو آزاد می‌کنه
 */
import { useEffect, useRef } from 'react';

export function useHallsCascade(
  hallsRaw: { id: string }[],
  flocks: { id: string; hallId: string }[],
  updateFlock: (id: string, patch: { hallId: string; zoneId: string }) => void,
) {
  const prevHallIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const currentIds = new Set(hallsRaw.map((h) => h.id));
    const prevIds = prevHallIdsRef.current;

    if (prevIds.size > 0) {
      const removedIds: string[] = [];
      prevIds.forEach(id => { if (!currentIds.has(id)) removedIds.push(id); });

      if (removedIds.length > 0) {
        removedIds.forEach(hallId => {
          flocks.filter((f) => f.hallId === hallId).forEach((f) => {
            try { updateFlock(f.id, { hallId: '', zoneId: '' }); } catch {}
          });
        });
      }
    }

    prevHallIdsRef.current = currentIds;
  }, [hallsRaw, flocks, updateFlock]);
}
