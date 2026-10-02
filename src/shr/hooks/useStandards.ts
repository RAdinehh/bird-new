/**
 * useStandards.ts — hook مرکزی برای دسترسی به استانداردها
 *
 * هر ماژول می‌تواند از این hook استفاده کند تا:
 *   - خودکار از standards (تنظیمات کاربر) مقادیر بگیرد
 *   - وقتی کاربر standards را تغییر می‌دهد، همه‌جا آپدیت شود
 *
 * مثال استفاده:
 *   const { env, feed, incubation } = useStandards();
 *   const target = env('مرندی', 5);
 *   console.log(target.temp.target); // 31
 */

import { useSet } from '../../mod/set/store';
import {
  getEffectiveEnv,
  getEffectiveFeed,
  getEffectiveGrowth,
  getIncubation,
  getBiology,
  getSpace,
  getProduction,
  getMortalityRange,
  type ResolveOptions,
  type EffectiveEnv,
  type EffectiveFeed,
  type EffectiveGrowth,
  type IncubationStandard,
  type BiologyStandard,
  type SpaceStandard,
  type ProductionStandard,
  type MortalityRange,
} from '../../mod/set/standards';

export function useStandards() {
  const custom = useSet((s: any) => s.customStandards) || {};
  const opts: ResolveOptions = { customStandards: custom };

  return {
    /** محیط (دما/رطوبت/نور) بر اساس نام و سن */
    env: (name: string | null | undefined, ageDays: number | null): EffectiveEnv =>
      getEffectiveEnv(name, ageDays, null, opts),

    /** تغذیه (دان/آب/پروتئین/انرژی) */
    feed: (
      name: string | null | undefined,
      ageDays: number | null,
      overrideFeedG?: number | null,
      overrideWaterMl?: number | null,
    ): EffectiveFeed =>
      getEffectiveFeed(name, ageDays, overrideFeedG, overrideWaterMl, opts),

    /** رشد (وزن/ADG/FCR) */
    growth: (name: string | null | undefined, ageDays: number | null): EffectiveGrowth =>
      getEffectiveGrowth(name, ageDays, opts),

    /** انکوباسیون */
    incubation: (name: string | null | undefined): IncubationStandard | null =>
      getIncubation(name, opts),

    /** بیولوژی (سن بلوغ، شروع تخم‌گذاری، ...) */
    biology: (name: string | null | undefined): BiologyStandard | null =>
      getBiology(name, opts),

    /** فضا و تراکم */
    space: (name: string | null | undefined): SpaceStandard | null =>
      getSpace(name, opts),

    /** تولید (تخم/سال، وزن تخم، ...) */
    production: (name: string | null | undefined): ProductionStandard | null =>
      getProduction(name, opts),

    /** تلفات مجاز بر اساس سن */
    mortality: (
      name: string | null | undefined,
      ageDays: number | null,
    ): MortalityRange | null =>
      getMortalityRange(name, ageDays, opts),
  };
}
