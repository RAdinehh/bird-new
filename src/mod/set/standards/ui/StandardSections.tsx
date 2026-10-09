/**
 * StandardSections — ترکیب ۶ گروه استاندارد
 *
 * طبق طرح گزینه ۱:
 *   ۱. شناسه
 *   ۲. محیط
 *   ۳. تغذیه و رشد
 *   ۴. تأسیسات
 *   ۵. سلامت
 *   ۶. تولید
 */
import type { BirdStandard } from '../types';
import { isChanged } from './_groupedSections';
import {
  IdentitySection,
  EnvironmentSection,
  NutritionSection,
  HousingSection,
  HealthSection,
  ProductionSection,
} from './_groupedSections';

interface Props {
  std: BirdStandard;
  def: BirdStandard;
  isCustom?: boolean;
  updateBird: (patch: Partial<BirdStandard>) => void;
}

export default function StandardSections(props: Props) {
  const { std, def, updateBird } = props;

  // ═══ تشخیص تغییرات هر گروه ═══
  const identityChanged =
    std.nameFa !== def.nameFa ||
    std.nameEn !== def.nameEn ||
    std.birdName !== def.birdName ||
    isChanged(std.source, def.source) ||
    isChanged(std.publishYear, def.publishYear);

  const envChanged =
    isChanged(std.env, def.env) ||
    isChanged(std.lightingProgram, def.lightingProgram) ||
    isChanged(std.ventilation, def.ventilation) ||
    isChanged(std.waterQuality, def.waterQuality);

  const nutritionChanged =
    isChanged(std.feed, def.feed) ||
    isChanged(std.growth, def.growth);

  const housingChanged =
    isChanged(std.space, def.space) ||
    isChanged(std.equipment, def.equipment) ||
    isChanged(std.litter, def.litter);

  const healthChanged =
    isChanged(std.mortality, def.mortality) ||
    std.mortalityTotalPct !== def.mortalityTotalPct ||
    isChanged(std.targets, def.targets) ||
    isChanged(std.keyMilestones, def.keyMilestones);

  const productionChanged =
    isChanged(std.biology, def.biology) ||
    isChanged(std.production, def.production) ||
    isChanged(std.incubation, def.incubation) ||
    isChanged(std.hatchingParams, def.hatchingParams);

  return (
    <>
      <IdentitySection
        std={std} def={def}
        isChanged={identityChanged}
        updateBird={updateBird}
      />
      <EnvironmentSection
        std={std} def={def}
        isChanged={envChanged}
        updateBird={updateBird}
      />
      <NutritionSection
        std={std} def={def}
        isChanged={nutritionChanged}
        updateBird={updateBird}
      />
      <HousingSection
        std={std} def={def}
        isChanged={housingChanged}
        updateBird={updateBird}
      />
      <HealthSection
        std={std} def={def}
        isChanged={healthChanged}
        updateBird={updateBird}
      />
      <ProductionSection
        std={std} def={def}
        isChanged={productionChanged}
        updateBird={updateBird}
      />
    </>
  );
}
