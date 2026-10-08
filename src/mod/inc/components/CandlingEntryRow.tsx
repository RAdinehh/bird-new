/**
 * CandlingEntryRow.tsx — ردیف انتخاب یک ورودی تخم در فرم کندلینگ
 */
import { toFa, toEn } from '../../../shr/utils/fa';
import { Field, Grid2, NumField, Select } from '../../../shr/components/ui';

export interface EntryData {
  alive: string;
  infertile: string;
  dead: string;
  broken: string;
  infertileReason: string;
  deadReason: string;
  notes: string;
}

export const INFERTILE_REASONS: [string, string][] = [
  ['', '—'], ['season', 'فصل'], ['rooster_age', 'سن خروس'],
  ['nutrition', 'تغذیه'], ['genetics', 'ژنتیک'], ['storage', 'نگهداری تخم'],
];

export const DEAD_REASONS: [string, string][] = [
  ['', '—'], ['temp_fluctuation', 'نوسان دما'], ['humidity', 'رطوبت نامناسب'],
  ['ventilation', 'تهویه ضعیف'], ['genetics', 'ژنتیک'], ['infection', 'عفونت'],
];

export interface CandlingEntryRowProps {
  entryId: string;
  birdName?: string;
  count: number;
  entryDate: string;
  isSelected: boolean;
  data: EntryData;
  baseInfo: { base: number; source: string };
  alreadyAgg: { alive: number; infertile: number; dead: number; broken: number };
  onToggle: () => void;
  onUpdate: (patch: Partial<EntryData>) => void;
}

export default function CandlingEntryRow(props: CandlingEntryRowProps) {
  const {
    birdName, count, entryDate, isSelected, data: d,
    baseInfo, alreadyAgg, onToggle, onUpdate,
  } = props;

  const _inf = parseInt(toEn(d.infertile)) || 0;
  const _dead = parseInt(toEn(d.dead)) || 0;
  const _brk = parseInt(toEn(d.broken)) || 0;
  const _base = baseInfo.base || 0;
  const sum = _inf + _dead + _brk;
  const _alive = Math.max(0, _base - sum);
  const _over = sum > _base;
  const remaining = _base - sum;

  return (
    <div style={{
      border: '1px solid ' + (isSelected ? 'var(--accent-border)' : 'var(--border)'),
      background: isSelected ? 'var(--accent-soft)' : 'var(--card)',
      borderRadius: 'var(--r-md)',
      padding: 10,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggle}
          aria-label="انتخاب این ورودی"
          style={{
            width: 20, height: 20,
            accentColor: 'var(--accent)',
            cursor: 'pointer', flexShrink: 0,
          }}
        />
        <span style={{ flex: 1, fontSize: 'var(--fs-sm)', fontWeight: 700 }}>
          {birdName || '—'} · {toFa(count)} تخم
        </span>
        <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>{toFa(entryDate)}</span>
      </label>

      {alreadyAgg.alive + alreadyAgg.infertile + alreadyAgg.dead + alreadyAgg.broken > 0 && (
        <div style={{
          fontSize: 'var(--fs-xs)', color: 'var(--muted)',
          padding: '4px 8px', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)',
        }}>
          تجمیع قبلی: سالم {toFa(alreadyAgg.alive)} · بی‌نطفه {toFa(alreadyAgg.infertile)} · مرده {toFa(alreadyAgg.dead)}
        </div>
      )}

      {/* مبنا */}
      <div style={{
        fontSize: 'var(--fs-xs)',
        padding: 'var(--pad-tight)',
        background: 'var(--accent-soft)',
        border: '1px solid var(--accent-border)',
        borderRadius: 'var(--r-sm)',
        color: 'var(--accent)',
        fontWeight: 700,
        display: 'flex',
        justifyContent: 'space-between',
      }}>
        <span>🎯 مبنای این کندلینگ:</span>
        <span>{toFa(baseInfo.base)} تخم ({baseInfo.source})</span>
      </div>

      {isSelected && (
        <>
          <Grid2>
            <Field label="بی‌نطفه">
              <NumField
                placeholder="۰"
                value={d.infertile}
                onChange={ev => onUpdate({ infertile: ev.target.value })}
                max={count || 0} min={0} unit="عدد" autoClamp
              />
            </Field>
            <Field label="سالم" hint="خودکار">
              <div style={{
                height: 38, display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                padding: '0 12px',
                background: _over ? 'var(--danger-soft)' : 'var(--accent-soft)',
                border: '1px solid ' + (_over ? 'var(--danger)' : 'var(--accent-border)'),
                borderRadius: 'var(--r-md)',
                fontSize: 'var(--fs-base)', fontWeight: 700,
                color: _over ? 'var(--danger)' : 'var(--accent)',
              }}>{toFa(_alive)} عدد</div>
            </Field>
          </Grid2>
          <Grid2>
            <Field label="مرده">
              <NumField
                placeholder="۰" value={d.dead}
                onChange={ev => onUpdate({ dead: ev.target.value })}
                max={count || 0} min={0} unit="عدد" autoClamp
              />
            </Field>
            <Field label="شکسته">
              <NumField
                placeholder="۰" value={d.broken}
                onChange={ev => onUpdate({ broken: ev.target.value })}
                max={count || 0} min={0} unit="عدد" autoClamp
              />
            </Field>
          </Grid2>

          <div style={{
            padding: 'var(--pad-tight)',
            background: remaining < 0 ? 'var(--danger-soft)' : remaining === 0 ? 'var(--accent-soft)' : 'var(--input-bg)',
            border: '1px solid ' + (remaining < 0 ? 'var(--danger)' : remaining === 0 ? 'var(--accent-border)' : 'var(--border)'),
            borderRadius: 'var(--r-sm)',
            fontSize: 'var(--fs-xs)',
            color: remaining < 0 ? 'var(--danger)' : remaining === 0 ? 'var(--accent)' : 'var(--text)',
            fontWeight: 700,
            textAlign: 'center',
          }}>
            مجموع تلفات: {toFa(sum)} از {toFa(baseInfo.base)}
            {remaining > 0 && ' · باقی — ' + toFa(remaining)}
            {remaining < 0 && ' — بیشتر از مبنای مرحله قبل!'}
            {remaining === 0 && ' ✅ کامل'}
          </div>

          <Grid2>
            <Field label="دلیل بی‌نطفه">
              <Select
                value={d.infertileReason}
                onChange={ev => onUpdate({ infertileReason: ev.target.value })}
              >
                {INFERTILE_REASONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </Select>
            </Field>
            <Field label="دلیل مرگ">
              <Select
                value={d.deadReason}
                onChange={ev => onUpdate({ deadReason: ev.target.value })}
              >
                {DEAD_REASONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </Select>
            </Field>
          </Grid2>
        </>
      )}
    </div>
  );
}
