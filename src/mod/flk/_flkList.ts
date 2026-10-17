/**
 * _flkList.ts — فیلتر لیست گله‌ها بر اساس Tab
 */
import type { Flock } from './store';
import type { Bird, Breed } from '../brd/store';
import type { TabId } from './types-flocks';

export function filterFlocksByTab(
  flocks: Flock[],
  tab: TabId,
  q: string,
  birds: Bird[],
  breeds: Breed[],
): Flock[] {
  let arr = flocks;

  if (tab === 'archived') {
    arr = arr.filter(f => f.status === 'archived' || f.status === 'sold');
  } else if (tab === 'paused') {
    arr = arr.filter(f => f.status === 'active' && f.paused && !f.hidden);
  } else if (tab === 'hidden') {
    arr = arr.filter(f => f.status === 'active' && f.hidden && !f.paused);
  } else if (tab === 'all') {
    arr = arr.filter(f => f.status === 'active' && !f.hidden && !f.paused);
  } else {
    arr = arr.filter(f => f.status === 'active' && f.type === tab && !f.hidden && !f.paused);
  }

  if (q.trim()) {
    const t = q.trim();
    arr = arr.filter(f => {
      const bird = birds.find(b => b.id === f.birdId);
      const breed = breeds.find(b => b.id === f.breedId);
      return f.name.includes(t) || bird?.name.includes(t) || breed?.name.includes(t);
    });
  }

  return arr;
}
