/**
 * ItemsFormModal — فرم افزودن/ویرایش قلم انبار
 */
import { Btn, BtnRow, ErrorBox, Field, Grid2, Grid3, Input, Modal, MoneyField, NumField, SectionTitle, Select, Textarea } from '../../../shr/components/ui';
import DatePicker from '../../../shr/components/DatePicker';
import SmartSelect from '../../../shr/components/SmartSelect';
import { toFa, toEn } from '../../../shr/utils/fa';
import { CATEGORY_DEFAULTS, UNIT_LABEL, CATEGORY_ICON, CATEGORY_LABEL, type ItemUnit, type ItemCategory } from '../store';

export interface ItemsFormModalProps {
  open: boolean;
  setOpen: (v: boolean) => void;
  form: any;
  setForm: any;
  vErrors: Record<string, string>;
  err: string;
  suppliers: any[];
  halls: any[];
  currentStockForEdit: number;
  save: () => void;
}

export default function ItemsFormModal(props: ItemsFormModalProps) {
  const { open, setOpen, form, setForm, vErrors, err, suppliers, halls, currentStockForEdit, save } = props;
  const extras = (CATEGORY_DEFAULTS as any)[form.category];
  const isMedicine = form.category === 'medicine' || form.category === 'vaccine';

  return (
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={form.id ? 'ویرایش قلم' : 'افزودن قلم'}
        footer={<BtnRow><Btn variant="primary" onClick={save}>ذخیره</Btn><Btn onClick={() => setOpen(false)}>لغو</Btn></BtnRow>}
      >
        <Grid2>
          <Field label="نام قلم" required error={vErrors.name}>
            <Input placeholder="ذرت، نیوکاسل، ویتامین..." value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="تأمین‌کننده" hint="فقط فروشنده‌ها">
            <SmartSelect
              value={form.supplierId}
              onChange={v => setForm((f: any) => ({ ...f, supplierId: v }))}
              options={suppliers.map(c => ({
                value: c.id,
                label: c.name,
                subtitle: (s => s.phone || undefined)(c),
              }))}
              placeholder="— انتخاب —"
              modalTitle="انتخاب فروشنده"
              autoThreshold={6}
            />
          </Field>
        </Grid2>

        <Grid2>
          <Field label="دسته" required error={vErrors.category}>
            <Select value={form.category} onChange={e => {
              const newCat = e.target.value as ItemCategory;
              const def = CATEGORY_DEFAULTS[newCat];
              setForm((f: any) => ({
                ...f,
                category: newCat,
                unit: def.unit,
                storage: def.storage,
                expireDate: def.needsExpiry ? f.expireDate : '',
                withdrawalDays: def.needsWithdrawal ? f.withdrawalDays : '',
              }));
            }}>
              {(Object.keys(CATEGORY_LABEL) as ItemCategory[]).map(c =>
                <option key={c} value={c}>{CATEGORY_ICON[c]} {CATEGORY_LABEL[c]}</option>
              )}
            </Select>
          </Field>
          <Field label="واحد">
            <Select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value as ItemUnit })}>
              {(Object.keys(UNIT_LABEL) as ItemUnit[]).map(u =>
                <option key={u} value={u}>{UNIT_LABEL[u]}</option>
              )}
            </Select>
          </Field>
        </Grid2>

        {!form.id ? (
          <>
            <Grid2>
              <Field label="موجودی اولیه" hint="فقط هنگام ایجاد">
                <NumField placeholder="مثلاً — ۱۰۰" value={form.initialStock} onChange={e => setForm({ ...form, initialStock: e.target.value })} unit={(UNIT_LABEL as any)[form.unit]} min={0} />
              </Field>
              <Field label="حداقل موجودی" hint="هشدار کمبود">
                <NumField placeholder="مثلاً — ۱۰۰" unit={form.unit || "عدد"} value={form.minStock} onChange={e => setForm({ ...form, minStock: e.target.value })} min={0} />
              </Field>
            </Grid2>
            <Field label="قیمت موجودی اولیه" hint="اختیاری — برای محاسبه قیمت میانگین">
              <MoneyField placeholder="مثلاً — ۵۰٬۰۰۰" value={form.initialPrice} onChange={e => setForm({ ...form, initialPrice: e.target.value })} />
            </Field>
          </>
        ) : (
          <Grid2>
            <Field label="موجودی فعلی" hint="برای تغییر، از تب «ورود/خروج» استفاده کن">
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 12px', background: 'var(--input-bg)',
                border: '1px dashed var(--border)', borderRadius: 'var(--r-sm)',
                fontFamily: 'inherit', fontSize: 'var(--fs-base)',
                color: 'var(--text)', fontWeight: 700, minHeight: 38,
              }}>
                <span>{toFa(currentStockForEdit)}</span>
                <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 500 }}>
                  {(UNIT_LABEL as any)[form.unit] || 'عدد'}
                </span>
              </div>
            </Field>
            <Field label="حداقل موجودی" hint="هشدار کمبود">
              <NumField placeholder="مثلاً — ۱۰۰" unit={form.unit || "عدد"} value={form.minStock} onChange={e => setForm({ ...form, minStock: e.target.value })} min={0} />
            </Field>
          </Grid2>
        )}

        {!!extras && (
          <>
            <SectionTitle>{extras.title}</SectionTitle>
            {(extras.needsBatch || extras.needsExpiry) && (
              <Grid2>
                {extras.needsBatch && (
                  <Field label="شماره بچ">
                    <Input placeholder="..." dir="ltr" value={form.batchNo} onChange={e => setForm({ ...form, batchNo: e.target.value })} />
                  </Field>
                )}
                {extras.needsExpiry && (
                  <Field label="تاریخ انقضا">
                    <DatePicker value={form.expireDate} onChange={v => setForm({ ...form, expireDate: v })}  autoToday />
                  </Field>
                )}
              </Grid2>
            )}
            {(extras.needsWithdrawal || extras.needsStorage) && (
              <Grid2>
                {extras.needsWithdrawal && (
                  <Field label="دوره منع مصرف">
                    <NumField placeholder="مثلاً — ۳" value={form.withdrawalDays} onChange={e => setForm({ ...form, withdrawalDays: e.target.value })} unit="روز" min={0} />
                  </Field>
                )}
                {extras.needsStorage && (
                  <Field label="نگهداری">
                    <Select value={form.storage} onChange={e => setForm({ ...form, storage: e.target.value })}>
                      <option value="room">دمای اتاق</option>
                      <option value="fridge">یخچال (۲-۸°)</option>
                      <option value="freezer">فریزر</option>
                    </Select>
                  </Field>
                )}
              </Grid2>
            )}
            {isMedicine && (
              <>
                <SectionTitle>💊 اطلاعات مصرف</SectionTitle>
                <Grid3>
                  <Field label="نوع مصرف">
                    <Select value={form.usageType} onChange={e => setForm({ ...form, usageType: e.target.value })}>
                      <option value="">— انتخاب —</option>
                      <option value="oral">🍽 خوراکی</option>
                      <option value="injectable">💉 تزریقی</option>
                      <option value="water">💧 محلول</option>
                      <option value="spray">🌫 اسپری</option>
                    </Select>
                  </Field>
                  <Field label="دوز هر پرنده" hint="اختیاری">
                    <NumField placeholder="۰.۵" value={form.dosePerBird} onChange={e => setForm({ ...form, dosePerBird: e.target.value })} unit="ml" min={0} />
                  </Field>
                  <Field label="تاریخ تولید" hint="اختیاری">
                    <DatePicker value={form.productionDate} onChange={v => setForm({ ...form, productionDate: v })} />
                  </Field>
                </Grid3>
              </>
            )}
          </>
        )}

        {form.category === 'equipment' && (
          <>
            <SectionTitle>🔧 اطلاعات تجهیزات</SectionTitle>
            <Grid2>
              <Field label="تاریخ خرید">
                <DatePicker value={form.purchaseDate} onChange={v => setForm({ ...form, purchaseDate: v })} />
              </Field>
              <Field label="گارانتی تا" hint="اختیاری">
                <DatePicker value={form.warrantyUntil} onChange={v => setForm({ ...form, warrantyUntil: v })} />
              </Field>
            </Grid2>
            <Grid2>
              <Field label="سالن استقرار" hint="اختیاری">
                <Select value={form.hallId} onChange={e => setForm({ ...form, hallId: e.target.value })}>
                  <option value="">— بدون سالن —</option>
                  {halls.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                </Select>
              </Field>
              <Field label="وضعیت">
                <Select value={form.equipmentStatus} onChange={e => setForm({ ...form, equipmentStatus: e.target.value })}>
                  <option value="active">✅ فعال</option>
                  <option value="repair">🔧 در تعمیر</option>
                  <option value="scrapped">❌ اسقاط</option>
                </Select>
              </Field>
            </Grid2>
            <Field label="قیمت خرید (کل)">
              <MoneyField placeholder="مثلاً — ۵٬۰۰۰٬۰۰۰" value={form.purchasePrice} onChange={e => setForm({ ...form, purchasePrice: e.target.value })} />
            </Field>
          </>
        )}

        <Field label="یادداشت">
            <Textarea placeholder="..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </Field>

        <ErrorBox>{err}</ErrorBox>
      </Modal>
  );
}
