import { useState } from 'react';
import { Btn, PageContainer } from '../../../../shr/components/ui';
import SettingsGroup from '../../SettingsGroup';
import { showToast } from '../../../../cor/store/toast';
import { showConfirmAsync } from '../../../../cor/store/dialog';
import { useBrd } from '../../../brd/store';
import { useFlk } from '../../../flk/store';
import { toFa } from '../../../../shr/utils/fa';
import { getStandardsGroupedByBird, type BirdStandard } from '../index';
import { useSet } from '../../store';
import { StandardDetail } from './StandardDetail';
import { AddBirdModal } from './AddBirdModal';

export default function EnvStandardsTab() {
  const custom = useSet(state => state.customStandards) || {};
  const updateStandard = useSet(state => state.updateStandard);
  const resetStandard = useSet(state => state.resetStandard);

  const { flocks } = useFlk();
  const { birds: brdBirds } = useBrd();

  const [selectedBird, setSelectedBird] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [onlyActive, setOnlyActive] = useState(true);

  const grouped = getStandardsGroupedByBird(custom);

  const activeBirdNames = new Set<string>();
  (flocks || [])
    .filter((f: any) => f.status === 'active')
    .forEach((f: any) => {
      const brd = (brdBirds || []).find((b: any) => b.id === f.birdId);
      if (brd?.name) activeBirdNames.add(brd.name.trim());
    });

  const customBirdNames = new Set<string>();
  Object.values(custom).forEach((std: any) => {
    if (std.birdName) customBirdNames.add(std.birdName);
  });

  const visibleGroups = onlyActive
    ? Object.entries(grouped).filter(([birdName]) =>
        activeBirdNames.has(birdName) || customBirdNames.has(birdName)
      )
    : Object.entries(grouped);

  const handleAddBreed = (
    key: string, nameFa: string, nameEn: string, birdName: string, template: BirdStandard,
  ) => {
    const newStd: BirdStandard = { ...template, key, nameFa, nameEn, birdName };
    updateStandard(key, newStd);
    showToast(nameFa + ' اضافه شد', 'success', 2000);
    setOnlyActive(false);
  };

  const resetAll = async () => {
    const ok = await showConfirmAsync('بازگشت همه', 'همه ویرایش‌های استانداردها حذف شود؟', { danger: true });
    if (!ok) return;
    Object.keys(custom).forEach(k => resetStandard(k));
    showToast('همه به پیش‌فرض برگشتند', 'success', 2000);
  };

  return (
    <PageContainer>

      {/* دکمه فیلتر */}
      <button
        type="button"
        onClick={() => setOnlyActive(!onlyActive)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          background: onlyActive ? 'var(--accent-soft)' : 'var(--input-bg)',
          border: '1px solid ' + (onlyActive ? 'var(--accent-border)' : 'var(--border)'),
          borderRadius: 'var(--r-md)',
          cursor: 'pointer',
          fontFamily: 'inherit',
          fontSize: 'var(--fs-sm)',
          fontWeight: 600,
          color: onlyActive ? 'var(--accent)' : 'var(--muted)',
        }}
      >
        <span>{onlyActive ? '✓ فقط پرنده‌های فعال' : '👁 همه پرنده‌ها'}</span>
        <span style={{
          width: 36, height: 20, borderRadius: 10,
          background: onlyActive ? 'var(--accent)' : 'var(--border)',
          position: 'relative',
          transition: 'background 200ms',
        }}>
          <span style={{
            position: 'absolute', top: 2,
            [onlyActive ? 'right' : 'left']: 2,
            width: 16, height: 16,
            borderRadius: '50%',
            background: '#fff',
            transition: 'all 200ms',
          }} />
        </span>
      </button>

      {visibleGroups.length === 0 ? (
        <div style={{
          padding: 'var(--pad-comfy)',
          textAlign: 'center',
          fontSize: 'var(--fs-sm)',
          color: 'var(--muted)',
          lineHeight: 2,
          background: 'var(--input-bg)',
          borderRadius: 'var(--r-md)',
        }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🐔</div>
          <div style={{ fontWeight: 700, color: 'var(--text)' }}>هنوز گله فعالی ندارید</div>
          <div style={{ fontSize: 'var(--fs-xs)', marginTop: 4 }}>
            ابتدا در ماژول «گله» یک گله بسازید
          </div>
          <button
            type="button"
            onClick={() => setOnlyActive(false)}
            style={{
              marginTop: 10,
              padding: '6px 12px',
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)',
              color: 'var(--text)',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 'var(--fs-xs)',
            }}
          >
            👁 نمایش همه پرنده‌ها
          </button>
        </div>
      ) : (
        visibleGroups.map(([birdName, breeds]) => (
          <SettingsGroup
            key={birdName}
            icon="🐔"
            title={birdName}
            subtitle={toFa(breeds.length) + ' نژاد'}
            tone="accent"
          >
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 8,
            }}>
              {breeds.map((std) => {
                const isCustom = !!custom[std.key];
                const isNative = std.category === 'native';
                const flockCount = (flocks || []).filter((f: any) => {
                  if (f.status !== 'active') return false;
                  const brd = (brdBirds || []).find((b: any) => b.id === f.birdId);
                  return brd?.name?.trim() === birdName;
                }).length;

                return (
                  <button
                    key={std.key}
                    type="button"
                    onClick={() => setSelectedBird(std.key)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: 4,
                      padding: '10px 12px',
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--r-md)',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      textAlign: 'right',
                      minWidth: 0,
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      width: '100%',
                      minWidth: 0,
                    }}>
                      <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>
                        {isNative ? '🇮🇷' : '🔬'}
                      </span>
                      <span style={{
                        fontSize: 'var(--fs-base)',
                        fontWeight: 700,
                        color: 'var(--text)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1,
                        minWidth: 0,
                      }}>{std.nameFa}</span>
                      {isCustom && (
                        <span style={{ fontSize: 10, color: 'var(--accent)', flexShrink: 0 }}>✓</span>
                      )}
                    </div>
                    <div style={{
                      fontSize: 'var(--fs-xs)',
                      color: 'var(--muted)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      width: '100%',
                    }}>
                      {isNative ? 'بومی' : 'صنعتی'}
                      {flockCount > 0 ? ' · ' + toFa(flockCount) + ' گله' : ''}
                    </div>
                  </button>
                );
              })}
            </div>
          </SettingsGroup>
        ))
      )}

      <Btn onClick={() => setShowAddModal(true)} full>➕ افزودن نژاد جدید</Btn>

      {Object.keys(custom).length > 0 ? (
        <Btn onClick={resetAll} full>🔄 بازگشت همه به پیش‌فرض</Btn>
      ) : null}

      {selectedBird ? (
        <StandardDetail birdKey={selectedBird} onClose={() => setSelectedBird(null)} />
      ) : null}

      <AddBirdModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        existingCustom={custom}
        onAdd={handleAddBreed}
      />
    </PageContainer>
  );
}
