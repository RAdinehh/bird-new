import { PageContainer, Sheet } from '../../../../shr/components/ui';
import SettingsGroup from '../../SettingsGroup';
import StandardSections from './StandardSections';
import { showToast, toastMsg } from '../../../../cor/store/toast';
import { showConfirmAsync } from '../../../../cor/store/dialog';
import { EnvEditor, FeedEditor, GrowthEditor, MortalityEditor, LitterEditor } from './editors';
import { DEFAULT_STANDARDS, type BirdStandard } from '../index';
import { useSet } from '../../store';

// ═══ Field کوچیک با label بالا ═══
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
      <span style={{
        fontSize: 11,
        color: 'var(--muted)',
        fontWeight: 600,
        textAlign: 'right',
      }}>{label}</span>
      {children}
    </div>
  );
}

// ═══ Grid2 — ۲ ستونه ═══
function G2({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 8,
    }}>
      {children}
    </div>
  );
}

function isChanged(a: unknown, b: unknown): boolean {
  try { return JSON.stringify(a) !== JSON.stringify(b); } catch { return false; }
}

export function StandardDetail({ birdKey, onClose }: { birdKey: string; onClose: () => void; }) {
  const s = useSet();
  const custom = (s as any).customStandards || {};
  const isCustom = !!custom[birdKey];
  const std: BirdStandard = custom[birdKey] || DEFAULT_STANDARDS[birdKey] || {
    ...DEFAULT_STANDARDS.marandi,
    key: birdKey,
  };
  const def = DEFAULT_STANDARDS[birdKey] || DEFAULT_STANDARDS.marandi;

  const updateBird = (patch: Partial<BirdStandard>) => {
    (s as any).updateStandard(birdKey, { ...std, ...patch });
  };

  const resetBird = async () => {
    const ok = await showConfirmAsync('بازگشت به پیش‌فرض', 'همه ویرایش‌های این نژاد حذف شود؟', { danger: true });
    if (!ok) return;
    (s as any).resetStandard(birdKey);
    toastMsg.info('بازگشت به پیش‌فرض انجام شد')
  };

  const nameChanged = std.nameFa !== def.nameFa || std.nameEn !== def.nameEn || std.birdName !== def.birdName;
  const bioChanged = isChanged(std.biology, def.biology);
  const spaceChanged = isChanged(std.space, def.space);
  const envChanged = isChanged(std.env, def.env);
  const feedChanged = isChanged(std.feed, def.feed) || isChanged(std.growth, def.growth);
  const mortChanged = isChanged(std.mortality, def.mortality) || std.mortalityTotalPct !== def.mortalityTotalPct;

  return (
    <Sheet open={true} onClose={onClose} title={std.nameFa + ' — استاندارد'}>
      <PageContainer>

        {/* شناسه نژاد */}
        <StandardSections
          std={std}
          def={def}
          isCustom={isCustom}
          nameChanged={nameChanged}
          bioChanged={bioChanged}
          spaceChanged={spaceChanged}
          envChanged={envChanged}
          feedChanged={feedChanged}
          mortChanged={mortChanged}
          updateBird={updateBird}
        />

        {isCustom ? (
          <button
            type="button"
            onClick={resetBird}
            style={{
              width: '100%',
              padding: '12px',
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-lg)',
              color: 'var(--danger)',
              fontFamily: 'inherit',
              fontSize: 'var(--fs-base)',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            🔄 بازگشت به پیش‌فرض
          </button>
        ) : null}

      </PageContainer>
    </Sheet>
  );
}
