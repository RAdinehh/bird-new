/**
 * useBreedStandard — خواندن استاندارد کامل یک نژاد
 *
 * اولویت:
 *   ۱. اگه نژاد در brd.breeds هست و standardKey داره → از standards بخون
 *   ۲. اگه customStandards تنظیمات داره اون کلید → استفاده کن
 *   ۳. اگه fallback (اسم مشابه) → DEFAULT_STANDARDS
 *   ۴. هیچی → null
 */
import { useBrd } from '../../mod/brd/store';
import { useSet } from '../../mod/set/store';
import { getStandardFor } from '../../mod/set/standards/resolve';
import type { BirdStandard } from '../../mod/set/standards/types';

export function useBreedStandard() {
  const breeds = useBrd(s => s.breeds);
  const customStandards = useSet(s => s.customStandards);

  /**
   * استاندارد رو بر اساس breedId برگردون
   */
  const byBreedId = (breedId: string | null | undefined): BirdStandard | null => {
    if (!breedId) return null;
    const breed = breeds.find(b => b.id === breedId);
    if (!breed) return null;
    const key = (breed as { standardKey?: string }).standardKey;
    return getStandardFor(key || breed.name, { customStandards: customStandards || {} });
  };

  /**
   * استاندارد رو بر اساس اسم نژاد برگردون
   */
  const byName = (breedName: string | null | undefined): BirdStandard | null => {
    if (!breedName) return null;
    return getStandardFor(breedName, { customStandards: customStandards || {} });
  };

  /**
   * کلید استاندارد نژاد
   */
  const keyOf = (breedId: string | null | undefined): string | null => {
    if (!breedId) return null;
    const breed = breeds.find(b => b.id === breedId);
    if (!breed) return null;
    return (breed as { standardKey?: string }).standardKey || breed.name;
  };

  return { byBreedId, byName, keyOf };
}
