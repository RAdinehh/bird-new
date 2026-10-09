/**
 * BreedDetailPage.tsx — صفحه جزئیات نژاد (جایگزین Sheet)
 *
 * طبق طرح پیشنهادی گزینه ۱:
 *   - Back button (راست)
 *   - Breadcrumb (تنظیمات → استانداردها → نژاد)
 *   - منوی ⋮ (تنظیمات)
 *   - صفحه کامل (نه Sheet)
 *
 * محتوا فعلاً از StandardSections استفاده می‌کنه
 * (در فاز ۲ به ۶ گروه تبدیل می‌شه)
 */
import { useNavigate, useParams } from 'react-router-dom';
import { PageContainer } from '../../../../shr/components/ui';
import SettingsGroup from '../../SettingsGroup';
import StandardSections from './StandardSections';
import { showToast, toastMsg } from '../../../../cor/store/toast';
import { showConfirmAsync } from '../../../../cor/store/dialog';
import { DEFAULT_STANDARDS, type BirdStandard } from '../index';
import { useSet } from '../../store';

function isChanged(a: unknown, b: unknown): boolean {
  try { return JSON.stringify(a) !== JSON.stringify(b); } catch { return false; }
}

export default function BreedDetailPage() {
  const navigate = useNavigate();
  const { key } = useParams<{ key: string }>();
  const birdKey = key || '';

  const s = useSet();
  const custom = (s as any).customStandards || {};
  const isCustom = !!custom[birdKey];

  const std: BirdStandard = custom[birdKey] || (DEFAULT_STANDARDS as any)[birdKey] || (
    (DEFAULT_STANDARDS as any).marandi
      ? { ...(DEFAULT_STANDARDS as any).marandi, key: birdKey }
      : ({} as BirdStandard)
  );
  const def = (DEFAULT_STANDARDS as any)[birdKey] || (DEFAULT_STANDARDS as any).marandi;

  if (!std || !std.key) {
    return (
      <PageContainer>
        <div style={{
          padding: 20, textAlign: 'center',
          color: 'var(--muted)', fontSize: 'var(--fs-sm)',
        }}>
          نژاد پیدا نشد
          <button
            onClick={() => navigate(-1)}
            style={{
              display: 'block', margin: '16px auto 0',
              padding: '10px 20px',
              background: 'var(--accent)', color: '#fff',
              border: 'none', borderRadius: 'var(--r-md)',
              fontFamily: 'inherit', fontWeight: 700, cursor: 'pointer',
            }}
          >
            بازگشت
          </button>
        </div>
      </PageContainer>
    );
  }

  const updateBird = (patch: Partial<BirdStandard>) => {
    (s as any).updateStandard(birdKey, { ...std, ...patch });
  };

  const resetBird = async () => {
    const ok = await showConfirmAsync('بازگشت به پیش‌فرض', 'همه ویرایش‌های این نژاد حذف شود؟', { danger: true });
    if (!ok) return;
    (s as any).resetStandard(birdKey);
    toastMsg.info('بازگشت به پیش‌فرض انجام شد');
  };

  const nameChanged = std.nameFa !== def.nameFa || std.nameEn !== def.nameEn || std.birdName !== def.birdName;
  const bioChanged = isChanged(std.biology, def.biology);
  const spaceChanged = isChanged(std.space, def.space);
  const envChanged = isChanged(std.env, def.env);
  const feedChanged = isChanged(std.feed, def.feed) || isChanged(std.growth, def.growth);
  const mortChanged = isChanged(std.mortality, def.mortality) || std.mortalityTotalPct !== def.mortalityTotalPct;

  return (
    <>
      {/* هدر ثابت با Back + Breadcrumb + منو */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'var(--bg)',
        borderBottom: '1px solid var(--border)',
      }}>
        {/* Breadcrumb */}
        <div style={{
          padding: '6px 14px 0',
          fontSize: 10.5,
          color: 'var(--dim)',
        }}>
          تنظیمات › استانداردها › <b style={{ color: 'var(--accent)' }}>{std.nameFa}</b>
        </div>

        {/* هدر */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 14px 12px',
        }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="بازگشت"
            style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'var(--input-bg)',
              border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, cursor: 'pointer',
              color: 'var(--text)', flexShrink: 0,
              fontFamily: 'inherit',
            }}
          >←</button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 15, fontWeight: 800,
              color: 'var(--text)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{std.nameFa}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>
              {std.birdName} · {std.category === 'native' ? 'بومی' : std.category === 'fancy' ? 'تزئینی' : 'صنعتی'}
              {isCustom ? ' · ویرایش شده' : ''}
            </div>
          </div>
        </div>
      </div>

      <PageContainer>
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
    </>
  );
}
