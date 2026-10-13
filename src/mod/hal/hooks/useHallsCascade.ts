/**
 * useHallsCascade — وقتی سالنی حذف می‌شه، گله‌های یتیم رو آزاد می‌کنه
 */
import { useEffect, useRef } from 'react';

export function useHallsCascade(
  hallsRaw: any[],
  flocks: any[],
  updateFlock: (id: string, patch: any) => void,
) {
  const prevHallIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const currentIds = new Set(hallsRaw.map((h: any) => h.id));
    const prevIds = prevHallIdsRef.current;

    if (prevIds.size > 0) {
      const removedIds: string[] = [];
      prevIds.forEach(id => { if (!currentIds.has(id)) removedIds.push(id); });

      if (removedIds.length > 0) {
        removedIds.forEach(hallId => {
          flocks.filter((f: any) => f.hallId === hallId).forEach((f: any) => {
            try { updateFlock(f.id, { hallId: '', zoneId: '' }); } catch {}
          });
        });
      }
    }

    prevHallIdsRef.current = currentIds;
  }, [hallsRaw, flocks, updateFlock]);
}
