/**
 * HatchFormModal.tsx — فرم ثبت/ویرایش هچ
 */
import { toFa } from '../../../shr/utils/fa';
import {
  Btn, BtnRow, ErrorBox, Field, Grid2, Modal, NumField,
  SectionTitle, Select, Textarea,
} from '../../../shr/components/ui';
import DatePicker from '../../../shr/components/DatePicker';
import HatchEntryRow, { type HatchRowData } from './HatchEntryRow';

export interface HatchFormModalProps {
  open: boolean;
  editingId: string | null;
  formDate: string;
  setFormDate: (v: string) => void;
  formEntryId: string;
  setFormEntryId: (v: string) => void;
  deviceFilter: string;
  setDeviceFilter: (v: string) => void;
  selectedIds: Set<string>;
  entriesData: Record<string, HatchRowData>;
  err: string;
  vErrors: Record<string, string>;
  // داده
  eggEntries: any[];
  devices: { id: string; name: string }[];
  availableEntries: any[];
  birdsById: Record<string, any>;
  devicesById: Record<string, any>;
  candlings: any[];
  latestCandByEntry: Record<string, any>;
  // helpers
  daysAgo: (date: string) => number;
  isLockdown: (e: any) => boolean;
  // actions
  toggleEntry: (id: string) => void;
  updateData: (id: string, patch: Partial<HatchRowData>) => void;
  dataFor: (id: string) => HatchRowData;
  onSave: () => void;
  onClose: () => void;
}

export default function HatchFormModal(props: HatchFormModalProps) {
  const {
    open, editingId, formDate, setFormDate, formEntryId, setFormEntryId,
    deviceFilter, setDeviceFilter, selectedIds, entriesData, err, vErrors,
    eggEntries, devices, availableEntries, birdsById, devicesById,
    candlings, latestCandByEntry, daysAgo, isLockdown,
    toggleEntry, updateData, dataFor, onSave, onClose,
  } = props;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingId ? '✏️ ویرایش هچ' : '🐣 ثبت هچ'}
      footer={
        <BtnRow>
          <Btn
            variant="primary"
            onClick={onSave}
            disabled={Object.keys(vErrors).length > 0}
          >
            ذخیره ({toFa(editingId ? 1 : selectedIds.size)})
          </Btn>
          <Btn onClick={onClose}>لغو</Btn>
        </BtnRow>
      }
    >
      <SectionTitle>
        <span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📦</span>
        {' '}انتخاب ورودی‌ها
      </SectionTitle>

      {editingId ? (
        <Field label="ورودی تخم" required>
          <Select value={formEntryId} onChange={e => setFormEntryId(e.target.value)}>
            {eggEntries.map(e => {
              const bird = birdsById[e.birdId];
              const dev = devicesById[e.deviceId];
              return (
                <option key={e.id} value={e.id}>
                  {bird?.name || '—'} · {toFa(e.entryDate)} · {toFa(e.count || 0)} تخم · {dev?.name || ''}
                </option>
              );
            })}
          </Select>
        </Field>
      ) : (
        <>
          <Field
            label="فیلتر دستگاه"
            hint={selectedIds.size > 0 ? toFa(selectedIds.size) + ' انتخاب‌شده' : undefined}
          >
            <Select value={deviceFilter} onChange={e => setDeviceFilter(e.target.value)}>
              <option value="">— همه دستگاه‌ها —</option>
              {devices.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
          </Field>

          {availableEntries.length === 0 ? (
            <div style={{
              fontSize: 'var(--fs-sm)', color: 'var(--muted)',
              padding: 10, textAlign: 'center',
              background: 'var(--input-bg)', borderRadius: 'var(--r-md)',
            }}>
              ورودی‌ای نیست
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {availableEntries.map(e => {
                const bird = birdsById[e.birdId];
                const dev = devicesById[e.deviceId];
                const isSel = selectedIds.has(e.id);
                return (
                  <HatchEntryRow
                    key={e.id}
                    entry={e}
                    birdName={bird?.name}
                    deviceName={dev?.name}
                    candlings={candlings}
                    latestCand={latestCandByEntry[e.id]}
                    data={dataFor(e.id)}
                    isSelected={isSel}
                    daysAgo={daysAgo}
                    isLockdown={isLockdown}
                    onToggle={() => toggleEntry(e.id)}
                    onUpdate={(patch) => updateData(e.id, patch)}
                  />
                );
              })}
            </div>
          )}
        </>
      )}

      {editingId && (
        <>
          <SectionTitle>
            <span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📊</span>
            {' '}نتیجه
          </SectionTitle>
          <EditFields
            data={dataFor(formEntryId)}
            update={(patch) => updateData(formEntryId, patch)}
          />
        </>
      )}

      <SectionTitle>
        <span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📅</span>
        {' '}تاریخ هچ
      </SectionTitle>
      <Field label="تاریخ" required>
        <DatePicker value={formDate} onChange={v => setFormDate(v)} placeholder="انتخاب تاریخ" autoToday />
      </Field>

      <ErrorBox>{err}</ErrorBox>
    </Modal>
  );
}

// ===== بخش ویرایش (فقط وقتی editingId داریم) =====
function EditFields({ data: d, update }: { data: HatchRowData; update: (p: Partial<HatchRowData>) => void }) {
  const int = (s: string) => parseInt(s || '0') || 0;
  const h = int(d.hatched);
  const uh = int(d.unhatched);
  const ds = int(d.deadInShell);
  const pp = int(d.pipped);
  const ot = int(d.other);
  const hatchedNum = h;

  const gA = int(d.gradeA);
  const gB = int(d.gradeB);
  const gradesUsed = gA + gB;
  const gradesRem = hatchedNum - gradesUsed;
  const gradesOk = gradesRem >= 0;

  const m = int(d.maleCount);
  const f_ = int(d.femaleCount);
  const u = int(d.unknownCount);
  const genderUsed = m + f_ + u;
  const genderRem = hatchedNum - genderUsed;
  const genderOk = genderRem >= 0;

  return (
    <>
      <Grid2>
        <Field label="جوجه هچ‌شده" required>
          <NumField value={d.hatched} onChange={ev => update({ hatched: ev.target.value })} min={0} unit="عدد" />
        </Field>
        <Field label="هچ‌نشده">
          <NumField value={d.unhatched} onChange={ev => update({ unhatched: ev.target.value })} min={0} unit="عدد" />
        </Field>
      </Grid2>
      <Grid2>
        <Field label="مرده در پوسته">
          <NumField value={d.deadInShell} onChange={ev => update({ deadInShell: ev.target.value })} min={0} unit="عدد" />
        </Field>
        <Field label="نوک‌زده">
          <NumField value={d.pipped} onChange={ev => update({ pipped: ev.target.value })} min={0} unit="عدد" />
        </Field>
      </Grid2>
      <Grid2>
        <Field label="سایر">
          <NumField value={d.other} onChange={ev => update({ other: ev.target.value })} min={0} unit="عدد" />
        </Field>
        <Field label="وزن متوسط">
          <NumField value={d.avgWeight} onChange={ev => update({ avgWeight: ev.target.value })} min={0} unit="گرم" />
        </Field>
      </Grid2>

      {hatchedNum === 0 ? (
        <div style={{
          padding: 'var(--pad-normal)',
          background: 'var(--warn-soft)',
          border: '1px dashed var(--warn)',
          borderRadius: 'var(--r-md)',
          fontSize: 'var(--fs-xs)', color: 'var(--warn)',
          fontWeight: 700, textAlign: 'center',
        }}>
          ⬆️ اول «جوجه هچ‌شده» را وارد کن
        </div>
      ) : (
        <>
          <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>
            🏅 تفکیک کیفی — از {toFa(hatchedNum)} هچ‌شده
          </div>
          <Grid2>
            <Field label="درجه A">
              <NumField value={d.gradeA} onChange={ev => update({ gradeA: ev.target.value })} max={hatchedNum - gB} min={0} unit="عدد" />
            </Field>
            <Field label="درجه B">
              <NumField value={d.gradeB} onChange={ev => update({ gradeB: ev.target.value })} max={hatchedNum - gA} min={0} unit="عدد" />
            </Field>
          </Grid2>
          <StatusBar
            label={`A + B: ${toFa(gradesUsed)} / ${toFa(hatchedNum)}`}
            remaining={gradesRem}
            ok={gradesOk}
          />

          <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>
            ⚖️ جنسیت و وزن
          </div>
          <Grid2>
            <Field label="♂ نر">
              <NumField value={d.maleCount} onChange={ev => update({ maleCount: ev.target.value })} max={hatchedNum - f_ - u} min={0} unit="عدد" />
            </Field>
            <Field label="♀ ماده">
              <NumField value={d.femaleCount} onChange={ev => update({ femaleCount: ev.target.value })} max={hatchedNum - m - u} min={0} unit="عدد" />
            </Field>
          </Grid2>
          <Grid2>
            <Field label="? نامعلوم">
              <NumField value={d.unknownCount} onChange={ev => update({ unknownCount: ev.target.value })} max={hatchedNum - m - f_} min={0} unit="عدد" />
            </Field>
            <Field label="وزن متوسط" hint="۲۰-۶۰ گرم">
              <NumField value={d.avgWeight} onChange={ev => update({ avgWeight: ev.target.value })} min={0} max={60} unit="گرم" />
            </Field>
          </Grid2>
          <StatusBar
            label={`♂ + ♀ + ?: ${toFa(genderUsed)} / ${toFa(hatchedNum)}`}
            remaining={genderRem}
            ok={genderOk}
          />
        </>
      )}

      <Field label="یادداشت">
        <Textarea value={d.notes || ''} onChange={ev => update({ notes: ev.target.value })} placeholder="..." />
      </Field>
    </>
  );
}

function StatusBar({ label, remaining, ok }: { label: string; remaining: number; ok: boolean }) {
  const color = !ok ? 'var(--danger)' : remaining === 0 ? 'var(--accent)' : 'var(--text)';
  const bg = !ok ? 'var(--danger-soft)' : remaining === 0 ? 'var(--accent-soft)' : 'var(--input-bg)';
  const border = !ok ? 'var(--danger)' : remaining === 0 ? 'var(--accent-border)' : 'var(--border)';
  return (
    <div style={{
      padding: 'var(--pad-tight)',
      background: bg, border: '1px solid ' + border,
      borderRadius: 'var(--r-sm)',
      fontSize: 'var(--fs-xs)', color,
      fontWeight: 700, textAlign: 'center',
    }}>
      {label}{!ok ? ' 🔴 اضافی' : remaining === 0 ? ' ✅ کامل' : ' · ⏳ ' + toFa(remaining) + ' باقی'}
    </div>
  );
}
