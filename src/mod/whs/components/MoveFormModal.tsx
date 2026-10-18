/**
 * MoveFormModal — فرم افزودن/ویرایش حرکت انبار
 */
import { Btn, BtnRow, Field, Grid2, Modal, MoneyField, NumField, Select, Textarea, ErrorBox } from '../../../shr/components/ui';
import DatePicker from '../../../shr/components/DatePicker';
import SmartSelect from '../../../shr/components/SmartSelect';
import { toFa } from '../../../shr/utils/fa';
import { MOVEMENT_REASON, UNIT_LABEL, CATEGORY_ICON, CATEGORY_LABEL, type MovementType, type MovementReason, type Item } from '../store';
import type { Person } from '../../ctc/store';
import type { F } from '../MovesPage';
import type React from 'react';

const REASONS_BY_TYPE: Record<MovementType, MovementReason[]> = {
  in: ['purchase', 'gift', 'return', 'adjustment'],
  out: ['consumption', 'sale', 'loss', 'gift', 'adjustment'],
  adjust: ['adjustment'],
};

interface Props {
  open: boolean;
  setOpen: (v: boolean) => void;
  form: F;
  setForm: React.Dispatch<React.SetStateAction<F>>;
  err: string;
  vErrors: Record<string, string>;
  items: Item[];
  filteredContacts: Person[];
  onSave: () => void;
}

export default function MoveFormModal(props: Props) {
  const { open, setOpen, form, setForm, err, vErrors, items, filteredContacts, onSave } = props;

  const selectedItem = items.find((i) => i.id === form.itemId);
  const currentStock = selectedItem?.currentStock || 0;
  const isAdjustment = form.type === 'adjust';
  const isPurchase = form.reason === 'purchase';
  const isSale = form.reason === 'sale';
  const partyRequired = form.reason === 'purchase' || form.reason === 'sale';
  const partyLabel = form.reason === 'purchase' ? 'تأمین‌کننده' : form.reason === 'sale' ? 'مشتری' : 'طرف';

  return (
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="ثبت گردش انبار"
        footer={<BtnRow><Btn variant="primary" onClick={onSave}>ذخیره</Btn><Btn onClick={() => setOpen(false)}>لغو</Btn></BtnRow>}
      >
        <Grid2>
          <Field label="نوع گردش" required>
            <Select value={form.type} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              const newType = e.target.value as MovementType;
              const validReasons = REASONS_BY_TYPE[newType];
              const newReason = validReasons.includes(form.reason) ? form.reason : validReasons[0];
              setForm({ ...form, type: newType, reason: newReason });
            }}>
              <option value="in">📥 ورود به انبار</option>
              <option value="out">📤 خروج از انبار</option>
            </Select>
          </Field>
          <Field label="دلیل" required error={vErrors.reason}>
            <Select value={form.reason} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, reason: e.target.value as MovementReason })}>
              {REASONS_BY_TYPE[form.type].map((r) =>
                <option key={r} value={r}>{MOVEMENT_REASON[r]}</option>
              )}
            </Select>
          </Field>
        </Grid2>

        <Field label="کالا" required hint={selectedItem ? `موجودی فعلی — ${toFa(currentStock)} ${UNIT_LABEL[selectedItem.unit]}` : undefined}>
          <SmartSelect
            value={form.itemId}
            onChange={v => setForm({ ...form, itemId: v })}
            options={items.map(it => ({
              value: it.id,
              label: it.name,
              subtitle: `${toFa(it.currentStock)} ${UNIT_LABEL[it.unit]}`,
              group: it.category,
            }))}
            groupLabels={Object.fromEntries(
              Object.entries(CATEGORY_LABEL).map(([k, v]) => [k, v])
            ) as Record<string, string>}
            groupIcons={Object.fromEntries(
              Object.entries(CATEGORY_ICON).map(([k, v]) => [k, v])
            ) as Record<string, string>}
            placeholder="— انتخاب کالا —"
            modalTitle="انتخاب کالای انبار"
            autoThreshold={6}
          />
        </Field>

        <Grid2>
          <Field label="تعداد" required error={vErrors.quantity}>
            <NumField placeholder="مثلاً — ۱۰۰"
              value={form.quantity}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, quantity: e.target.value })}
              unit={selectedItem ? UNIT_LABEL[selectedItem.unit] : ''}
              max={form.type === 'out' ? currentStock : undefined} min={0} />
          </Field>
          <Field label="قیمت واحد">
            <MoneyField placeholder="مثلاً — ۵۰٬۰۰۰" value={form.unitPrice} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, unitPrice: e.target.value })} />
          </Field>
        </Grid2>

        {!isAdjustment ? (
          <Grid2>
            <Field label="تاریخ" required error={vErrors.date}>
              <DatePicker value={form.date} onChange={v => setForm({ ...form, date: v })}  autoToday />
            </Field>
            <Field
              label={partyLabel}
              required={partyRequired}
              hint={partyRequired ? undefined : 'اختیاری'}
            >
              {filteredContacts.length === 0 ? (
                <div style={{
                  padding: 'var(--pad-normal)',
                  background: 'var(--warn-soft)',
                  border: '1px dashed var(--warn)',
                  borderRadius: 'var(--r-sm)',
                  fontSize: 'var(--fs-xs)',
                  color: 'var(--warn)',
                  fontWeight: 600,
                }}>
                  {isPurchase ? 'هیچ فروشنده‌ای تعریف نشده' : isSale ? 'هیچ مشتری‌ای تعریف نشده' : 'مخاطبی تعریف نشده'}
                </div>
              ) : (
                <SmartSelect
                  value={form.partyId}
                  onChange={v => setForm({ ...form, partyId: v })}
                  options={filteredContacts.map(c => ({
                    value: c.id,
                    label: c.name,
                    subtitle: c.roles.length > 0
                      ? c.roles.map((r) => r === 'customer' ? 'مشتری' : r === 'supplier' ? 'فروشنده' : 'کارگر').join('، ')
                      : undefined,
                  }))}
                  placeholder={partyRequired ? `— انتخاب ${partyLabel} —` : '— بدون مخاطب —'}
                  modalTitle={`انتخاب ${partyLabel}`}
                  autoThreshold={6}
                />
              )}
            </Field>
          </Grid2>
        ) : (
          <Field label="تاریخ" required error={vErrors.date}>
            <DatePicker value={form.date} onChange={v => setForm({ ...form, date: v })}  autoToday />
          </Field>
        )}

        <Field label="یادداشت">
            <Textarea placeholder="..." value={form.notes} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, notes: e.target.value })} />
          </Field>

        <ErrorBox>{err}</ErrorBox>
      </Modal>
  );
}
