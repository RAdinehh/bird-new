/**
 * sexingWidgetLogic.ts — منطق خالص widget «زمان تفکیک»
 * فاز ۷.۱ — تست‌پذیر، بدون UI
 */
import { getAgeDays } from '../flk/store';

export interface SexingStats {
  overdue: number;
  thisWeek: number;
  twoWeeks: number;
  total: number;
}

/**
 * computeSexingStats — گروه‌بندی گله‌های breeder بدون genderSplitAt
 * طبق FlockCard.tsx:247: badge فقط برای breeder + !genderSplitAt
 */
export function computeSexingStats(
  activeFlocks: any[],
  breeds: any[],
  getStdSexingAge: (breedName: string) => number | null,
): SexingStats {
  let overdue = 0, thisWeek = 0, twoWeeks = 0;

  for (const f of activeFlocks) {
    if (f.type !== 'breeder') continue;
    if (f.genderSplitAt) continue;

    const breed = breeds.find((b: any) => b.id === f.breedId);
    if (!breed) continue;

    let sexingAge: number | null = null;
    if (f.sexingAgeOverride != null) sexingAge = f.sexingAgeOverride;
    else sexingAge = getStdSexingAge(breed.name);
    if (sexingAge == null) continue;

    let ageDays = 0;
    try { ageDays = getAgeDays(f); } catch { continue; }

    const daysUntil = sexingAge - ageDays;
    if (daysUntil < 0) overdue++;
    else if (daysUntil <= 7) thisWeek++;
    else if (daysUntil <= 14) twoWeeks++;
  }

  return { overdue, thisWeek, twoWeeks, total: overdue + thisWeek + twoWeeks };
}
