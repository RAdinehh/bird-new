/**
 * CandlingFormModal.tsx — فرم ثبت/ویرایش کندلینگ
 *
 * شامل: زمان‌بندی + انتخاب ورودی‌ها + فرم هر ورودی
 */
import { toFa } from '../../../shr/utils/fa';
import {
  Btn, BtnRow, Field, Grid2, Modal, NumField,
  SectionTitle, Select, ErrorBox,
} from '../../../shr/components/ui';
import DatePicker from '../../../shr/components/DatePicker';
import CandlingEntryRow, { type EntryData } from './CandlingEntryRow';
import type { CandlingLike, AvailableBase } from '../api/calc';

export interface AvailableEntry {
  id: string;
  birdId: string;
  count: number | null;
  entryDate: string;
  deviceId: string;
  status: string;
}

export interface CandlingFormModalProps {
  open: boolean;
  onClose: () => void;
  editingId: string | null;
  // زمان‌بندی
  modalDay: string;
  setModalDay: (v: string) => void;
  modalDate: string;
  setModalDate: (v: string) => void;
  modalDevice: string;
  setModalDevice: (v: string) => void;
  // انتخاب ورودی
  selectedIds: Set<string>;
  setSelectedIds: (v: Set<string>) => void;
  setEntriesData: (fn: (prev: Record<string, EntryData>) => Record<string, EntryData>) => void;
  toggleEntry: (id: string) => void;
  updateEntryData: (id: string, patch: Partial<EntryData>) => void;
  entriesData: Record<string, EntryData>;
  // داده
  devices: { id: string; name: string }[];
  availableEntries: AvailableEntry[];
  birdsById: Record<string, any>;
  candlings: CandlingLike[];
  // profile
  firstSelectedBirdName?: string;
  profile: { totalDays: number; lockdownDay: number };
  // اکشن‌ها
  onSave: () => void;
  saving: boolean;
  err: string;
  vErrors: Record<string, string>;
}

export default function CandlingFormModal(props: CandlingFormModalProps) {
  const {
    open, onClose, editingId,
    modalDay, setModalDay, modalDate, setModalDate, modalDevice, setModalDevice,
    selectedIds, setSelectedIds, setEntriesData,
    toggleEntry, updateEntryData, entriesData,
    devices, availableEntries, birdsById, candlings,
    firstSelectedBirdName, profile,
    onSave, err, vErrors,
  } = props;

  const dataFor = (id: string): EntryData =>
    entriesData[id] || {
      alive: '', infertile: '', dead: '', broken: '',
      infertileReason: '', deadReason: '', notes: '',
    };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingId ? '✏️ ویرایش کندلینگ' : '🔍 ثبت کندلینگ'}
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
        <span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📅</span>
        {' '}زمان‌بندی
      </SectionTitle>

      {firstSelectedBirdName && profile.totalDays ? (
        <div style={{
          fontSize: 'var(--fs-xs)', padding: '6px 10px',
          background: 'var(--accent-soft)',
          border: '1px solid var(--accent-border)',
          borderRadius: 'var(--r-sm)',
          color: 'var(--accent)', fontWeight: 700,
          display: 'flex', justifyContent: 'space-between',
        }}>
          <span>🐣 {firstSelectedBirdName}</span>
          <span>مدت {toFa(profile.totalDays)} روز · قفل {toFa(profile.lockdownDay)}</span>
        </div>
      ) : null}

      <Grid2>
        <Field label="روز انکوباسیون" required hint="۷، ۱۰، ۱۵...">
          <NumField
            value={modalDay}
            onChange={e => setModalDay(e.target.value)}
            unit="روز" min={1} max={30} autoClamp
          />
        </Field>
        <Field label="تاریخ" required>
          <DatePicker
            value={modalDate}
            onChange={v => setModalDate(v)}
            placeholder="انتخاب"
            autoToday
          />
        </Field>
      </Grid2>

      <SectionTitle>
        <span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📦</span>
        {' '}انتخاب ورودی‌ها
      </SectionTitle>

      <Field label="فیلتر دستگاه">
        <Select
          value={modalDevice}
          onChange={e => {
            setModalDevice(e.target.value);
            setSelectedIds(new Set());
            setEntriesData(() => ({}));
          }}
        >
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
          ورودی‌ای برای این دستگاه نیست
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {availableEntries.map(e => {
            const bird = birdsById[e.birdId];
            const isSelected = selectedIds.has(e.id);
            const d = dataFor(e.id);
            const sum = (parseInt(d.infertile) || 0) + (parseInt(d.dead) || 0) + (parseInt(d.broken) || 0);
            const dayNum = parseInt(modalDay) || 0;

            // محاسبه‌ی مبنا از داخل — بدون import مجدد
            const myCandlings = candlings
              .filter((c) => c.eggEntryId === e.id)
              .sort((a, b) => a.stage - b.stage);
            const prevs = myCandlings.filter(c => c.stage < dayNum);
            const baseInfo: AvailableBase = prevs.length === 0
              ? { base: e.count || 0, source: 'کل ورودی' }
              : { base: prevs[prevs.length - 1].alive || 0, source: 'مرحله ' + prevs[prevs.length - 1].stage };

            const existingCandlings = candlings.filter(c => c.eggEntryId === e.id);
            const alreadyAgg = existingCandlings.reduce(
              (acc, c) => ({
                alive: acc.alive + (c.alive || 0),
                infertile: acc.infertile + (c.infertile || 0),
                dead: acc.dead + (c.dead || 0),
                broken: acc.broken + (c.broken || 0),
              }),
              { alive: 0, infertile: 0, dead: 0, broken: 0 }
            );

            return (
              <CandlingEntryRow
                key={e.id}
                entryId={e.id}
                birdName={bird?.name}
                count={e.count || 0}
                entryDate={e.entryDate}
                isSelected={isSelected}
                data={d}
                baseInfo={baseInfo}
                alreadyAgg={alreadyAgg}
                onToggle={() => toggleEntry(e.id)}
                onUpdate={(patch) => updateEntryData(e.id, patch)}
              />
            );
          })}
        </div>
      )}

      <ErrorBox>{err}</ErrorBox>
    </Modal>
  );
}
