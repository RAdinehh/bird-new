/**
 * HatchEntryRow.tsx — ردیف ورودی تخم در فرم ثبت هچ
 */
import { toFa, toEn } from '../../../shr/utils/fa';
import { Field, Grid2, NumField, Textarea } from '../../../shr/components/ui';
import { calcCurrentFertile } from '../api/hatchCalc';

export interface HatchRowData {
  hatched: string;
  unhatched: string;
  deadInShell: string;
  pipped: string;
  other: string;
  gradeA: string;
  gradeB: string;
  maleCount: string;
  femaleCount: string;
  unknownCount: string;
  avgWeight: string;
  notes: string;
}

export const emptyRow = (): HatchRowData => ({
  hatched: '', unhatched: '', deadInShell: '', pipped: '', other: '',
  gradeA: '', gradeB: '', maleCount: '', femaleCount: '',
  unknownCount: '', avgWeight: '', notes: '',
});

export interface HatchEntryRowProps {
  entry: { id: string; count: number | null; entryDate: string };
  birdName?: string;
  deviceName?: string;
  candlings: any[];
  latestCand: any;
  data: HatchRowData;
  isSelected: boolean;
  daysAgo: (date: string) => number;
  isLockdown: (e: any) => boolean;
  onToggle: () => void;
  onUpdate: (patch: Partial<HatchRowData>) => void;
}

export default function HatchEntryRow(props: HatchEntryRowProps) {
  const {
    entry: e, birdName, deviceName, candlings, latestCand,
    data: d, isSelected, daysAgo, isLockdown, onToggle, onUpdate,
  } = props;

  const int = (s: string) => s ? parseInt(toEn(s)) || 0 : 0;

  const calc = calcCurrentFertile(e.id, e.count || 0, candlings);
  const aliveAfter = calc.fertile;

  const h = int(d.hatched);
  const uh = int(d.unhatched);
  const ds = int(d.deadInShell);
  const pp = int(d.pipped);
  const ot = int(d.other);
  const sumE = h + uh + ds + pp + ot;
  const rem = (e.count || 0) - sumE;

  const base = aliveAfter;
  const sum = h + uh + ds + pp + ot;
  const remaining = base - sum;
  const ok = remaining >= 0;

  const hatchedNum = h;

  // Quality
  const gA = int(d.gradeA);
  const gB = int(d.gradeB);
  const gradesUsed = gA + gB;
  const gradesRem = hatchedNum - gradesUsed;
  const gradesOk = gradesRem >= 0;

  // Gender
  const m = int(d.maleCount);
  const f_ = int(d.femaleCount);
  const u = int(d.unknownCount);
  const genderUsed = m + f_ + u;
  const genderRem = hatchedNum - genderUsed;
  const genderOk = genderRem >= 0;

  return (
    <div style={{
      border: '1px solid ' + (isSelected ? 'var(--accent-border)' : 'var(--border)'),
      background: isSelected ? 'var(--card-solid, var(--card))' : 'var(--card)',
      borderRadius: 'var(--r-md)',
      padding: 10,
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      {/* header row */}
      <div role="button" tabIndex={0} onClick={onToggle} style={{
        display: 'flex', alignItems: 'center', gap: 8,
        cursor: 'pointer', userSelect: 'none',
        padding: 4, margin: -4, borderRadius: 'var(--r-sm)',
      }}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => {}}
          onClick={(ev) => { ev.stopPropagation(); onToggle(); }}
          aria-label="انتخاب ورودی"
          style={{ width: 20, height: 20, accentColor: 'var(--accent)', cursor: 'pointer', flexShrink: 0 }}
        />
        <span style={{ flex: 1, fontSize: 'var(--fs-sm)', fontWeight: 700 }}>
          {birdName || '—'} · {toFa(e.count || 0)} تخم
        </span>
        <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>{deviceName || ''}</span>
        <span style={{
          fontSize: 'var(--fs-xs)', color: 'var(--accent)', fontWeight: 700,
          transform: isSelected ? 'rotate(90deg)' : 'rotate(0)',
          transition: 'transform .2s',
        }}>▶</span>
      </div>

      {/* کندلینگ‌های این ورودی */}
      {calc.byStage.length > 0 && (
        <div style={{
          fontSize: 'var(--fs-xs)', color: 'var(--muted)',
          padding: 'var(--pad-tight)',
          background: 'var(--input-bg)',
          borderRadius: 'var(--r-sm)', lineHeight: 1.7,
        }}>
          {calc.byStage.map((st, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>کندلینگ روز {toFa(st.stage)}:</span>
              <span>بی‌نطفه {toFa(st.infertile)} · مرده {toFa(st.dead)} · شکسته {toFa(st.broken)}</span>
            </div>
          ))}
          <div style={{
            paddingTop: 4, marginTop: 4, borderTop: '1px dashed var(--border)',
            display: 'flex', justifyContent: 'space-between',
            color: 'var(--accent)', fontWeight: 700,
          }}>
            <span>📊 مجموع تلفات کندلینگ:</span>
            <span>{toFa(calc.totalLoss)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent)', fontWeight: 700 }}>
            <span>🧬 نطفه‌دار فعلی:</span>
            <span>{toFa(calc.fertile)}</span>
          </div>
        </div>
      )}

      {isSelected && (
        <>
          {/* کارت اطلاعات ورودی */}
          <div style={{
            padding: 'var(--pad-tight)', background: 'var(--input-bg)',
            border: '1px solid var(--border)', borderRadius: 'var(--r-sm)',
            display: 'flex', flexDirection: 'column', gap: 4, fontSize: 'var(--fs-xs)',
          }}>
            <InfoRow l="🐦 پرنده" v={birdName || '—'} />
            <InfoRow l="🥚 تعداد کل" v={`${toFa(e.count || 0)} تخم`} />
            <InfoRow l="📅 تاریخ ورود" v={toFa(e.entryDate)} />
            <InfoRow l="🔢 روز انکوباسیون" v={`روز ${toFa(daysAgo(e.entryDate))}`} accent />
            <InfoRow l="📊 نطفه‌دار فعلی" v={`${toFa(aliveAfter)} تخم`} />
            {isLockdown(e) && (
              <div style={{
                padding: '3px 6px',
                background: 'var(--warn-soft)',
                border: '1px solid var(--warn)',
                borderRadius: 'var(--r-sm)',
                color: 'var(--warn)', fontWeight: 700, textAlign: 'center', marginTop: 2,
              }}>
                🔒 Lock-down (روز {toFa(daysAgo(e.entryDate))} از ۱۸)
              </div>
            )}
          </div>

          <div style={{
            padding: 'var(--pad-tight)',
            background: 'var(--input-bg)',
            border: '1px dashed ' + (latestCand ? 'var(--accent-border)' : 'var(--warn)'),
            borderRadius: 'var(--r-sm)',
            fontSize: 'var(--fs-xs)',
            color: latestCand ? 'var(--accent)' : 'var(--warn)',
            fontWeight: 700, textAlign: 'center',
          }}>
            {calc.byStage.length > 0
              ? '🧬 سقف این هچ: ' + toFa(base) + ' تخم نطفه‌دار'
              : '⚠️ بدون کندلینگ — سقف: ' + toFa(base) + ' تخم'}
          </div>

          <Grid2>
            <Field label="جوجه هچ‌شده" required>
              <NumField placeholder="مثلاً — ۴۵۰" value={d.hatched}
                onChange={ev => onUpdate({ hatched: ev.target.value })}
                max={Math.max(0, base - uh - ds - pp - ot)} min={0} unit="عدد" />
            </Field>
            <Field label="هچ‌نشده">
              <NumField placeholder="مثلاً — ۲۰" value={d.unhatched}
                onChange={ev => onUpdate({ unhatched: ev.target.value })}
                max={Math.max(0, base - h - ds - pp - ot)} min={0} unit="عدد" />
            </Field>
          </Grid2>
          <Grid2>
            <Field label="مرده در پوسته">
              <NumField placeholder="مثلاً — ۱۰" value={d.deadInShell}
                onChange={ev => onUpdate({ deadInShell: ev.target.value })}
                max={Math.max(0, base - h - uh - pp - ot)} min={0} unit="عدد" />
            </Field>
            <Field label="نوک‌زده">
              <NumField placeholder="مثلاً — ۵" value={d.pipped}
                onChange={ev => onUpdate({ pipped: ev.target.value })}
                max={Math.max(0, base - h - uh - ds - ot)} min={0} unit="عدد" />
            </Field>
          </Grid2>
          <Grid2>
            <Field label="سایر">
              <NumField value={d.other}
                onChange={ev => onUpdate({ other: ev.target.value })}
                max={Math.max(0, base - h - uh - ds - pp)} min={0} unit="عدد" />
            </Field>
            <Field label="وزن متوسط" hint="۲۰-۶۰ گرم">
              <NumField placeholder="مثلاً — ۱.۵" value={d.avgWeight}
                onChange={ev => onUpdate({ avgWeight: ev.target.value })}
                min={0} max={60} unit="گرم" />
            </Field>
          </Grid2>

          <div style={{
            padding: 'var(--pad-normal)',
            background: 'var(--input-bg)',
            border: '1px solid ' + (!ok ? 'var(--danger)' : remaining === 0 ? 'var(--accent-border)' : 'var(--border)'),
            borderRadius: 'var(--r-sm)',
            fontSize: 'var(--fs-xs)',
            color: !ok ? 'var(--danger)' : remaining === 0 ? 'var(--accent)' : 'var(--text)',
            fontWeight: 700, display: 'flex', justifyContent: 'space-between',
          }}>
            <span>📊 مجموع: {toFa(sum)} / {toFa(base)}</span>
            <span>
              {ok && remaining > 0 && '⏳ ' + toFa(remaining) + ' باقی'}
              {ok && remaining === 0 && '✅ کامل'}
              {!ok && '🔴 ' + toFa(Math.abs(remaining)) + ' اضافی'}
            </span>
          </div>

          {/* تفکیک کیفی */}
          {hatchedNum === 0 ? (
            <div style={{
              padding: 'var(--pad-normal)',
              background: 'var(--warn-soft)',
              border: '1px dashed var(--warn)',
              borderRadius: 'var(--r-md)',
              fontSize: 'var(--fs-xs)', color: 'var(--warn)',
              fontWeight: 700, textAlign: 'center',
            }}>
              ⬆️ اول «جوجه هچ‌شده» را وارد کن — سپس می‌توانی کیفیت، جنسیت و وزن را تکمیل کنی
            </div>
          ) : (
            <>
              <SectionLabel label="🏅 تفکیک کیفی (اختیاری)" suffix={`از ${toFa(hatchedNum)} هچ‌شده`} />
              <Grid2>
                <Field label="درجه A">
                  <NumField value={d.gradeA}
                    onChange={ev => onUpdate({ gradeA: ev.target.value })}
                    max={hatchedNum - gB} min={0} unit="عدد" />
                </Field>
                <Field label="درجه B">
                  <NumField value={d.gradeB}
                    onChange={ev => onUpdate({ gradeB: ev.target.value })}
                    max={hatchedNum - gA} min={0} unit="عدد" />
                </Field>
              </Grid2>
              <ProgressBar
                label={`A + B: ${toFa(gradesUsed)} / ${toFa(hatchedNum)}`}
                remaining={gradesRem}
                ok={gradesOk}
              />

              <SectionLabel label="⚖️ جنسیت (اختیاری)" />
              <Grid2>
                <Field label="♂ نر">
                  <NumField value={d.maleCount}
                    onChange={ev => onUpdate({ maleCount: ev.target.value })}
                    max={hatchedNum - f_ - u} min={0} unit="عدد" />
                </Field>
                <Field label="♀ ماده">
                  <NumField value={d.femaleCount}
                    onChange={ev => onUpdate({ femaleCount: ev.target.value })}
                    max={hatchedNum - m - u} min={0} unit="عدد" />
                </Field>
              </Grid2>
              <Grid2>
                <Field label="? نامعلوم">
                  <NumField value={d.unknownCount}
                    onChange={ev => onUpdate({ unknownCount: ev.target.value })}
                    max={hatchedNum - m - f_} min={0} unit="عدد" />
                </Field>
                <Field label="وزن متوسط" hint="۲۰-۶۰ گرم">
                  <NumField value={d.avgWeight}
                    onChange={ev => onUpdate({ avgWeight: ev.target.value })}
                    min={0} max={60} unit="گرم" />
                </Field>
              </Grid2>
              <ProgressBar
                label={`♂ + ♀ + ?: ${toFa(genderUsed)} / ${toFa(hatchedNum)}`}
                remaining={genderRem}
                ok={genderOk}
              />
            </>
          )}

          <Field label="یادداشت">
            <Textarea
              value={d.notes || ''}
              onChange={ev => onUpdate({ notes: ev.target.value })}
              placeholder="..."
            />
          </Field>

          <div style={{
            padding: 'var(--pad-tight)',
            background: 'var(--input-bg)',
            border: '1px solid ' + (rem < 0 ? 'var(--danger)' : rem === 0 ? 'var(--accent-border)' : 'var(--border)'),
            borderRadius: 'var(--r-sm)',
            fontSize: 'var(--fs-xs)',
            color: rem < 0 ? 'var(--danger)' : rem === 0 ? 'var(--accent)' : 'var(--text)',
            fontWeight: 700, textAlign: 'center',
          }}>
            این هچ: {toFa(sumE)} از {toFa(e.count || 0)}
            {rem > 0 && ' · باقی — ' + toFa(rem)}
            {rem < 0 && ' — بیشتر!'}
            {rem === 0 && ' ✅'}
          </div>
        </>
      )}
    </div>
  );
}

function InfoRow({ l, v, accent }: { l: string; v: string; accent?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ color: 'var(--muted)' }}>{l}:</span>
      <span style={{ fontWeight: 700, color: accent ? 'var(--accent)' : undefined }}>{v}</span>
    </div>
  );
}

function SectionLabel({ label, suffix }: { label: string; suffix?: string }) {
  return (
    <div style={{
      fontSize: 'var(--fs-base)', color: 'var(--text)',
      fontWeight: 700, letterSpacing: '.3px',
    }}>
      {label}{suffix ? ` — ${suffix}` : ''}
    </div>
  );
}

function ProgressBar({ label, remaining, ok }: { label: string; remaining: number; ok: boolean }) {
  const color = !ok ? 'var(--danger)' : remaining === 0 ? 'var(--accent)' : 'var(--text)';
  const bg = !ok ? 'var(--danger-soft)' : remaining === 0 ? 'var(--accent-soft)' : 'var(--input-bg)';
  const border = !ok ? 'var(--danger)' : remaining === 0 ? 'var(--accent-border)' : 'var(--border)';
  return (
    <div style={{
      padding: 'var(--pad-tight)',
      background: bg,
      border: '1px solid ' + border,
      borderRadius: 'var(--r-sm)',
      fontSize: 'var(--fs-xs)',
      color,
      fontWeight: 700, textAlign: 'center',
    }}>
      {label}{!ok ? ' 🔴 ' + toFa(Math.abs(remaining)) + ' اضافی' : remaining === 0 ? ' ✅ کامل' : ' · ⏳ ' + toFa(remaining) + ' باقی'}
    </div>
  );
}
