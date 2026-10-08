/**
 * CapacityEditor.tsx — ویرایش ظرفیت و مشخصات هر پرنده در دستگاه
 *
 * بخش «ظرفیت بر اساس پرنده» در فرم DevicesPage.
 */
import { useState } from 'react';
import { toFa, toEn } from '../../../shr/utils/fa';
import { Field, Grid2, NumField } from '../../../shr/components/ui';
import { normalizeBird } from '../helpers';
import { fillCapacityFromProfile, type DeviceCapacity } from '../store';
import OvNumField from './OvNumField';
import { toastMsg } from '../../../cor/store/toast';

export interface CapacityEditorProps {
  birds: { id: string; name: string }[];
  capacityByBird: DeviceCapacity[];
  onChange: (next: DeviceCapacity[]) => void;
}

export default function CapacityEditor(props: CapacityEditorProps) {
  const { birds, capacityByBird, onChange } = props;
  const [expandedBird, setExpandedBird] = useState<string | null>(null);
  const [undoData, setUndoData] = useState<{ birdName: string; data: any } | null>(null);

  const addCapacity = (birdName: string) => {
    if (!birdName.trim()) return;
    if (capacityByBird.some(c => normalizeBird(c.birdName) === normalizeBird(birdName))) return;
    const defaults = fillCapacityFromProfile(birdName);
    const newCap: any = { birdName, capacity: null, ...(defaults || {}) };
    onChange([...capacityByBird, newCap]);
    toastMsg.added(birdName);
  };

  const removeCapacity = (birdName: string) => {
    const removed = capacityByBird.find(c => normalizeBird(c.birdName) === normalizeBird(birdName));
    if (!removed) return;
    onChange(capacityByBird.filter(c => normalizeBird(c.birdName) !== normalizeBird(birdName)));
    setUndoData({ birdName, data: removed });
    setTimeout(() => setUndoData(cur => cur && cur.birdName === birdName ? null : cur), 5000);
  };

  const undoRemove = () => {
    if (!undoData) return;
    onChange([...capacityByBird, undoData.data]);
    setUndoData(null);
  };

  const updateCapacity = (birdName: string, capacity: number | null) => {
    onChange(capacityByBird.map(c =>
      normalizeBird(c.birdName) === normalizeBird(birdName) ? { ...c, capacity } : c
    ));
  };

  const updateCapacityFull = (birdName: string, patch: Partial<DeviceCapacity>) => {
    onChange(capacityByBird.map(c =>
      normalizeBird(c.birdName) === normalizeBird(birdName) ? { ...c, ...patch } : c
    ));
  };

  const fillProfile = (birdName: string) => {
    const p = fillCapacityFromProfile(birdName);
    if (!p) return;
    updateCapacityFull(birdName, p);
  };

  const resetSection = (birdName: string, section: 'setter' | 'hatcher' | 'time') => {
    const prof: any = fillCapacityFromProfile(birdName);
    if (!prof) return;
    if (section === 'setter') {
      updateCapacityFull(birdName, { setterTemp: prof.setterTemp, setterHumidity: prof.setterHumidity });
    } else if (section === 'hatcher') {
      updateCapacityFull(birdName, { hatcherTemp: prof.hatcherTemp, hatcherHumidity: prof.hatcherHumidity });
    } else {
      updateCapacityFull(birdName, { totalDays: prof.totalDays, lockdownDay: prof.lockdownDay });
    }
  };

  const fmt = (v: any) => (v != null && v !== '') ? toFa(String(v)) : '—';
  const resetBtnStyle = {
    background: 'none', border: 'none', color: 'var(--warn)',
    cursor: 'pointer', fontSize: 'var(--fs-xs)', fontFamily: 'inherit',
    fontWeight: 600, padding: 0,
  } as any;

  if (birds.length === 0) {
    return (
      <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)', padding: 10, textAlign: 'center', background: 'var(--input-bg)', borderRadius: 'var(--r-md)' }}>
        هنوز پرنده‌ای در ماژول «پرنده و نژاد» ثبت نشده
      </div>
    );
  }

  return (
    <>
      {/* انتخاب پرنده‌ها */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {birds.map(b => {
          const isSelected = capacityByBird.some(c => normalizeBird(c.birdName) === normalizeBird(b.name));
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => isSelected ? removeCapacity(b.name) : addCapacity(b.name)}
              aria-pressed={isSelected}
              style={{
                padding: '6px 12px',
                background: isSelected ? 'var(--accent-soft)' : 'var(--btn-bg)',
                border: isSelected ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                borderRadius: 'var(--r-md)',
                color: isSelected ? 'var(--accent)' : 'var(--text)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 'var(--fs-sm)',
                fontWeight: isSelected ? 700 : 600,
                boxShadow: isSelected ? '0 0 0 2px var(--accent-soft)' : 'none',
                transition: 'all .15s',
              }}
            >+ {b.name}</button>
          );
        })}
      </div>

      {/* Undo bar */}
      {undoData && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 12px', background: 'var(--input-bg)',
          border: '1px solid var(--warn)', borderRadius: 'var(--r-md)',
          marginTop: 6, fontSize: 'var(--fs-sm)',
        }}>
          <span>«{undoData.birdName}» حذف شد</span>
          <button type="button" onClick={undoRemove} style={{
            background: 'none', border: 'none',
            color: 'var(--warn)', fontWeight: 700, cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 'var(--fs-sm)', padding: '2px 8px',
          }}>بازگردانی</button>
        </div>
      )}

      {/* بخش ویرایش هر پرنده */}
      {capacityByBird.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' as any, marginTop: 6 }}>
          {capacityByBird.map(c => {
            const prof: any = fillCapacityFromProfile(c.birdName);
            const d: any = prof || {};
            const setterOv = (d.setterTemp != null && c.setterTemp != null && Number(c.setterTemp) !== Number(d.setterTemp))
                          || (d.setterHumidity != null && c.setterHumidity != null && Number(c.setterHumidity) !== Number(d.setterHumidity));
            const hatcherOv = (d.hatcherTemp != null && c.hatcherTemp != null && Number(c.hatcherTemp) !== Number(d.hatcherTemp))
                           || (d.hatcherHumidity != null && c.hatcherHumidity != null && Number(c.hatcherHumidity) !== Number(d.hatcherHumidity));
            const timeOv = (d.totalDays != null && c.totalDays != null && Number(c.totalDays) !== Number(d.totalDays))
                        || (d.lockdownDay != null && c.lockdownDay != null && Number(c.lockdownDay) !== Number(d.lockdownDay));
            const isExpanded = expandedBird === c.birdName;
            return (
              <div key={c.birdName} style={{
                borderRadius: 'var(--r-md)',
                overflow: 'hidden',
                background: isExpanded ? 'var(--accent-soft)' : 'var(--input-bg)',
                transition: 'background .15s',
              }}>
                <div
                  onClick={() => setExpandedBird(isExpanded ? null : c.birdName)}
                  role="button" tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpandedBird(isExpanded ? null : c.birdName); } }}
                  aria-expanded={isExpanded}
                  style={{ padding: '10px 12px', cursor: 'pointer', userSelect: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 'var(--fs-md)', fontWeight: 700, flex: 1 }}>
                      {c.birdName}
                      {prof ? (
                        <span title="از پروفایل انکوباسیون" style={{ fontSize: 10, color: 'var(--accent)', marginRight: 4 }}>🪄</span>
                      ) : null}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--muted)', transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }}>▼</span>
                    <button type="button" onClick={(e) => { e.stopPropagation(); removeCapacity(c.birdName); }} aria-label={`حذف ${c.birdName}`} style={{
                      background: 'var(--danger-soft)', border: '1px solid var(--danger)', color: 'var(--danger)',
                      cursor: 'pointer', borderRadius: 'var(--r-sm)',
                      width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, padding: 0, fontFamily: 'inherit', fontWeight: 700, flexShrink: 0,
                    }}>✕</button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' as any, flexWrap: 'wrap', marginTop: 6, fontSize: 'var(--fs-sm)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontWeight: 700 }}>🌡 ستر</span>
                      <span style={{ fontWeight: 700 }}>{fmt(c.setterTemp)}°</span>
                      <span style={{ color: 'var(--dim)', fontWeight: 600 }}>{fmt(c.setterHumidity)}٪</span>
                    </span>
                    <span style={{ color: 'var(--dim)', fontSize: 14 }}>→</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontWeight: 700 }}>🐣 هچر</span>
                      <span style={{ fontWeight: 700 }}>{fmt(c.hatcherTemp)}°</span>
                      <span style={{ color: 'var(--dim)', fontWeight: 600 }}>{fmt(c.hatcherHumidity)}٪</span>
                    </span>
                    <span style={{ color: 'var(--dim)', fontSize: 14 }}>·</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontWeight: 700 }}>⏱</span>
                      <span style={{ fontWeight: 600 }}>{fmt(c.totalDays)}/{fmt(c.lockdownDay)}</span>
                    </span>
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ padding: 'var(--sp-3)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' as any, background: 'var(--card)' }}>
                    <Field label="ظرفیت" hint="حداکثر تعداد تخم">
                      <NumField value={String(c.capacity || '')} onChange={e => updateCapacity(c.birdName, parseInt(toEn(e.target.value)) || null)} unit="تخم" min={0} placeholder="۰" />
                    </Field>

                    <button type="button" onClick={() => fillProfile(c.birdName)} style={{
                      padding: '6px 10px',
                      background: 'var(--accent-soft)',
                      border: '1px solid var(--accent-border)',
                      color: 'var(--accent)',
                      borderRadius: 'var(--r-sm)',
                      cursor: 'pointer', fontFamily: 'inherit',
                      fontSize: 'var(--fs-sm)', fontWeight: 600,
                    }}>🔄 پر کردن از پروفایل</button>

                    <SectionHeader label="🌡 ستر" showReset={setterOv && !!prof} onReset={() => resetSection(c.birdName, 'setter')} />
                    <Grid2>
                      <OvNumField label="دما" hint="°C" isTemp={true} defValue={d.setterTemp}
                        value={c.setterTemp} onChange={(e: any) => updateCapacityFull(c.birdName, { setterTemp: parseFloat(toEn(e.target.value)) || 0 })}
                        unit="°C" min={20} max={45} placeholder="۳۷٫۷" />
                      <OvNumField label="رطوبت" hint="٪" defValue={d.setterHumidity}
                        value={c.setterHumidity} onChange={(e: any) => updateCapacityFull(c.birdName, { setterHumidity: parseFloat(toEn(e.target.value)) || 0 })}
                        unit="٪" min={0} max={100} placeholder="۵۰" />
                    </Grid2>

                    <SectionHeader label="🐣 هچر" showReset={hatcherOv && !!prof} onReset={() => resetSection(c.birdName, 'hatcher')} />
                    <Grid2>
                      <OvNumField label="دما" hint="°C" isTemp={true} defValue={d.hatcherTemp}
                        value={c.hatcherTemp} onChange={(e: any) => updateCapacityFull(c.birdName, { hatcherTemp: parseFloat(toEn(e.target.value)) || 0 })}
                        unit="°C" min={20} max={45} placeholder="۳۷٫۲" />
                      <OvNumField label="رطوبت" hint="٪" defValue={d.hatcherHumidity}
                        value={c.hatcherHumidity} onChange={(e: any) => updateCapacityFull(c.birdName, { hatcherHumidity: parseFloat(toEn(e.target.value)) || 0 })}
                        unit="٪" min={0} max={100} placeholder="۶۲" />
                    </Grid2>

                    <SectionHeader label="⏱ زمان" showReset={timeOv && !!prof} onReset={() => resetSection(c.birdName, 'time')} />
                    <Grid2>
                      <OvNumField label="مدت کل" hint="از ورود تا هچ" defValue={d.totalDays}
                        value={c.totalDays} onChange={(e: any) => updateCapacityFull(c.birdName, { totalDays: parseInt(toEn(e.target.value)) || 0 })}
                        unit="روز" min={0} max={60} placeholder="۲۱" />
                      <OvNumField label="روز قفل" hint="Lockdown" defValue={d.lockdownDay}
                        value={c.lockdownDay} onChange={(e: any) => updateCapacityFull(c.birdName, { lockdownDay: parseInt(toEn(e.target.value)) || 0 })}
                        unit="روز" min={0} max={60} placeholder="۱۸" />
                    </Grid2>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function SectionHeader({ label, showReset, onReset }: { label: string; showReset: boolean; onReset: () => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4, borderTop: '1px dashed var(--border)' }}>
      <span style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>{label}</span>
      {showReset ? (
        <button type="button" onClick={onReset} style={{
          background: 'none', border: 'none', color: 'var(--warn)',
          cursor: 'pointer', fontSize: 'var(--fs-xs)', fontFamily: 'inherit',
          fontWeight: 600, padding: 0,
        }}>↩️ پیش‌فرض</button>
      ) : null}
    </div>
  );
}
