import { Btn, Field, Grid2, NumField, Input, PageContainer, Sheet } from '../../../../shr/components/ui';
import SettingsGroup from '../../SettingsGroup';
import { showToast } from '../../../../cor/store/toast';
import { showConfirmAsync } from '../../../../cor/store/dialog';
import { EnvEditor, FeedEditor, GrowthEditor, MortalityEditor } from './editors';
import { DEFAULT_STANDARDS, type BirdStandard } from '../index';
import { useSet } from '../../store';

export function StandardDetail({
  birdKey, onClose,
}: {
  birdKey: string;
  onClose: () => void;
}) {
  const s = useSet();
  const custom = (s as any).customStandards || {};
  const isCustom = !!custom[birdKey];
  const std: BirdStandard = custom[birdKey] || DEFAULT_STANDARDS[birdKey] || {
    ...DEFAULT_STANDARDS.marandi,
    key: birdKey,
  };

  const updateBird = (patch: Partial<BirdStandard>) => {
    (s as any).updateStandard(birdKey, { ...std, ...patch });
  };

  const resetBird = async () => {
    const ok = await showConfirmAsync(
      'بازگشت به پیش‌فرض',
      'همه ویرایش‌های این نژاد حذف شود؟',
      { danger: true }
    );
    if (!ok) return;
    (s as any).resetStandard(birdKey);
    showToast('بازگشت به پیش‌فرض انجام شد', 'success', 2000);
  };

  return (
    <Sheet open={true} onClose={onClose} title={std.nameFa + ' — استاندارد'}>
      <PageContainer>
        {/* نام‌ها */}
        <SettingsGroup icon="📝" title="نام‌ها" tone="info">
          <Field label="نام نژاد (فارسی)">
            <Input value={std.nameFa} onChange={e => updateBird({ nameFa: e.target.value })} />
          </Field>
          <Field label="نام نژاد (انگلیسی)">
            <Input value={std.nameEn} onChange={e => updateBird({ nameEn: e.target.value })} />
          </Field>
          <Field label="پرنده مادر" hint="مرغ، بوقلمون، اردک، ...">
            <Input value={std.birdName} onChange={e => updateBird({ birdName: e.target.value })} />
          </Field>
        </SettingsGroup>

        {/* بیولوژی */}
        <SettingsGroup icon="🧬" title="بیولوژی" tone="accent">
          <Grid2>
            <Field label="سن شروع تخم‌گذاری">
              <NumField
                value={std.biology.layingStartDay?.toString() ?? ''}
                onChange={e => updateBird({ biology: { ...std.biology, layingStartDay: e.target.value ? Number(e.target.value) : null } })}
                unit="روز"
                min={0}
              />
            </Field>
            <Field label="سن کشتار">
              <NumField
                value={std.biology.cullDay?.toString() ?? ''}
                onChange={e => updateBird({ biology: { ...std.biology, cullDay: e.target.value ? Number(e.target.value) : null } })}
                unit="روز"
                min={0}
              />
            </Field>
          </Grid2>
          <Grid2>
            <Field label="دوره انکوباسیون">
              <NumField
                value={std.incubation.totalDays.toString()}
                onChange={e => updateBird({ incubation: { ...std.incubation, totalDays: Number(e.target.value) || 21 } })}
                unit="روز"
                min={1}
              />
            </Field>
            <Field label="روز Lockdown">
              <NumField
                value={std.incubation.lockdownDay.toString()}
                onChange={e => updateBird({ incubation: { ...std.incubation, lockdownDay: Number(e.target.value) || 18 } })}
                unit="روز"
                min={1}
              />
            </Field>
          </Grid2>
        </SettingsGroup>

        {/* دما و رطوبت */}
        <SettingsGroup icon="🌡" title="دما و رطوبت" subtitle="بر اساس سن" tone="warn">
          <EnvEditor env={std.env} onChange={env => updateBird({ env })} />
        </SettingsGroup>

        {/* تغذیه */}
        <SettingsGroup icon="🌾" title="تغذیه" subtitle="دان، آب، پروتئین، انرژی" tone="accent">
          <FeedEditor feed={std.feed} onChange={feed => updateBird({ feed })} />
        </SettingsGroup>

        {/* رشد */}
        <SettingsGroup icon="⚖️" title="رشد" subtitle="وزن، ADG، FCR" tone="purple">
          <GrowthEditor
            growth={std.growth.weightByAge}
            onChange={wba => updateBird({ growth: { ...std.growth, weightByAge: wba } })}
          />
        </SettingsGroup>

        {/* فضا و تراکم */}
        <SettingsGroup icon="📐" title="فضا و تراکم" tone="info">
          <Grid2>
            <Field label="تراکم (پرنده/m²)">
              <NumField
                value={std.space.densityMax.toString()}
                onChange={e => updateBird({ space: { ...std.space, densityMax: Number(e.target.value) || 0 } })}
                unit="پرنده"
                min={1}
              />
            </Field>
            <Field label="فضای دانخوری">
              <NumField
                value={std.space.feederSpaceCm.toString()}
                onChange={e => updateBird({ space: { ...std.space, feederSpaceCm: Number(e.target.value) || 0 } })}
                unit="cm"
                min={1}
              />
            </Field>
          </Grid2>
        </SettingsGroup>

        {/* تلفات */}
        <SettingsGroup icon="💀" title="تلفات مجاز" tone="danger">
          <MortalityEditor
            mortality={std.mortality}
            onChange={mortality => updateBird({ mortality })}
          />
          <Field label="تلفات کل چرخه (٪)">
            <NumField
              value={std.mortalityTotalPct.toString()}
              onChange={e => updateBird({ mortalityTotalPct: Number(e.target.value) || 0 })}
              unit="٪"
              min={0}
            />
          </Field>
        </SettingsGroup>

        {isCustom ? (
          <Btn onClick={resetBird} full>🔄 بازگشت به پیش‌فرض</Btn>
        ) : null}
      </PageContainer>
    </Sheet>
  );
}
