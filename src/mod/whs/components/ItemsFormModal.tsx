/**
 * ItemsFormModal — فرم افزودن/ویرایش قلم انبار
 */
import { useFormat } from '../../../shr/units/useFormat';

import { toEn } from '../../../shr/utils/fa';
import { Btn, BtnRow, ErrorBox, Field, Grid2, Grid3, Input, Modal, MoneyField, NumField, SectionTitle, Select, Textarea } from '../../../shr/components/ui';
import DatePicker from '../../../shr/components/DatePicker';
import SmartSelect from '../../../shr/components/SmartSelect';
import { toFa } from '../../../shr/utils/fa';
import { FieldHint } from '../../../shr/intelligence';
import { CATEGORY_DEFAULTS, UNIT_LABEL, CATEGORY_ICON, CATEGORY_LABEL, type ItemUnit, type ItemCategory } from '../store';
import { ToggleChip } from '../../../shr/components/itemFormHelpers';
import { VET_METHOD_OPTIONS } from '../../../shr/constants/vetMethods';
import HerbalForm from '../../../shr/components/HerbalForm';

export interface ItemsFormModalProps {
  open: boolean;
  setOpen: (v: boolean) => void;
  form: any;
  setForm: any;
  vErrors: Record<string, string>;
  showError?: (field: string) => string | undefined;
  markTouched?: (field: string) => void;
  err: string;
  suppliers: any[];
  halls: any[];
  currentStockForEdit: number;
  save: () => void;
}

export default function ItemsFormModal(props: ItemsFormModalProps) {
  const fmt = useFormat();
  const { open, setOpen, form, setForm, vErrors, showError, markTouched, err, suppliers, halls, currentStockForEdit, save } = props;
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
          <Field label="نام قلم" required error={showError?.('name')} onTouch={() => markTouched?.('name')}>
            <Input placeholder="نام" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
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
            />
          </Field>
        </Grid2>

        <Grid2>
          <Field label="دسته" required error={showError?.('category')} onTouch={() => markTouched?.('category')}>
            <SmartSelect
              value={form.category}
              modalTitle="دسته‌بندی کالا"
              options={(Object.keys(CATEGORY_LABEL) as ItemCategory[]).map(c => {
                const catIcons: Record<string, string> = {
                  egg: 'egg', feed: 'feed', medicine: 'meds', vaccine: 'vet_injection',
                  herbal: 'herbal', equipment: 'equipment', consumable: 'inventory',
                  manure: 'manure', broken: 'broken_egg'
                };
                return { value: c, label: CATEGORY_LABEL[c], icon: catIcons[c] || (CATEGORY_ICON as any)[c] || 'inventory' };
              })}
              onChange={v => {
                const newCat = v as ItemCategory;
                const def = CATEGORY_DEFAULTS[newCat];
                setForm((f: any) => ({
                  ...f,
                  category: newCat,
                  unit: def.unit,
                  storage: def.storage,
                  expireDate: def.needsExpiry ? f.expireDate : '',
                  withdrawalDays: def.needsWithdrawal ? f.withdrawalDays : '',
                }));
              }}
            />
          </Field>
          <Field label="واحد" error={showError?.('unit')} onTouch={() => markTouched?.('unit')}>
            <SmartSelect
              value={form.unit}
              modalTitle="واحد اندازه‌گیری"
              options={(Object.keys(UNIT_LABEL) as ItemUnit[]).filter(u => u !== 'L').map(u => {
                const unitIcons: Record<string, string> = {
                  kg: 'kg', g: 'scale', ton: 'platform_scale', l: 'liquid', ml: 'liquid',
                  pcs: 'pcs', pack: 'pack', bag: 'bag', vial: 'vial', dose: 'dose'
                };
                return { value: u, label: UNIT_LABEL[u], icon: unitIcons[u] || 'scale' };
              })}
              onChange={v => setForm({ ...form, unit: v as ItemUnit })}
            />
          </Field>
        </Grid2>

        <Field label="واحدهای فرعی" hint="تعریف واحد فرعی و ضریب تبدیل به واحد پایه">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(form.subUnits || []).map((su: any, idx: number) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingBottom: 8, borderBottom: '1px dashed var(--border)' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <Input placeholder="نام" value={su.name} onChange={e => {
                      const newSubs = (form.subUnits || []).map((s: any, i: number) => i === idx ? { ...s, name: e.target.value } : s);
                      setForm({ ...form, subUnits: newSubs });
                    }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <NumField placeholder="معادل" value={String(su.factor || '')} onChange={e => {
                      const newSubs = (form.subUnits || []).map((s: any, i: number) => i === idx ? { ...s, factor: parseFloat(toEn(e.target.value)) || 0 } : s);
                      setForm({ ...form, subUnits: newSubs });
                    }} unit={(UNIT_LABEL as any)[form.unit]} min={0} />
                  </div>
                  <Btn variant="danger-outline" onClick={() => {
                    const newSubs = (form.subUnits || []).filter((_: any, i: number) => i !== idx);
                    setForm({ ...form, subUnits: newSubs });
                  }}>✕</Btn>
                </div>
                {/* کادر هوشمند پیش‌نمایش */}
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent)', fontWeight: 600 }}>
                  💡 ۱ {su.name || 'واحد فرعی'} = {su.factor || '؟'} {(UNIT_LABEL as any)[form.unit] || ''}
                </div>
              </div>
            ))}
            <Btn onClick={() => setForm({ ...form, subUnits: [...(form.subUnits || []), { name: '', factor: 0 }] })}>
              + افزودن واحد فرعی
            </Btn>
          </div>
        </Field>

        {!form.id ? (
          <>
            <Grid2>
              <Field label="موجودی اولیه" hint="فقط هنگام ایجاد" error={showError?.('currentStock')} onTouch={() => markTouched?.('currentStock')}>
                <NumField placeholder="۰" value={form.initialStock} onChange={e => setForm({ ...form, initialStock: e.target.value })} unit={(UNIT_LABEL as any)[form.unit]} min={0} />
              </Field>
              <Field label="حداقل موجودی" hint="هشدار کمبود" error={showError?.('minStock')} onTouch={() => markTouched?.('minStock')}>
                <NumField placeholder="۰" unit={(UNIT_LABEL as any)[form.unit] || 'عدد'} value={form.minStock} onChange={e => setForm({ ...form, minStock: e.target.value })} min={0} />
              </Field>
            </Grid2>
            <Field label="قیمت اولیه" hint="اختیاری — برای محاسبه قیمت میانگین" error={showError?.('lastPrice')} onTouch={() => markTouched?.('lastPrice')}>
              <MoneyField placeholder="۰" value={form.initialPrice} onChange={e => setForm({ ...form, initialPrice: e.target.value })} />
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
                <span>{fmt.num(currentStockForEdit)}</span>
                <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 500 }}>
                  {(UNIT_LABEL as any)[form.unit] || 'عدد'}
                </span>
              </div>
            </Field>
            <Field label="حداقل موجودی" hint="هشدار کمبود" error={showError?.('minStock')} onTouch={() => markTouched?.('minStock')}>
              <NumField placeholder="۰" unit={(UNIT_LABEL as any)[form.unit] || 'عدد'} value={form.minStock} onChange={e => setForm({ ...form, minStock: e.target.value })} min={0} />
            </Field>
          </Grid2>
        )}

        {!!extras && (
          <>
            <SectionTitle>{extras.title}</SectionTitle>
            {extras.needsExpiry && (
              <Grid2>
                <Field label="تاریخ انقضا" error={showError?.('expireDate')} onTouch={() => markTouched?.('expireDate')}>
                  <DatePicker value={form.expireDate} onChange={v => setForm({ ...form, expireDate: v })}  autoToday />
                </Field>
              </Grid2>
            )}
            {(extras.needsWithdrawal || extras.needsStorage) && (
              <Grid2>
                {extras.needsWithdrawal && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}>
                    <Field label="دوره منع مصرف" error={showError?.('withdrawalDays')} onTouch={() => markTouched?.('withdrawalDays')}>
                    <NumField placeholder="۰" value={form.withdrawalDays} onChange={e => setForm({ ...form, withdrawalDays: e.target.value })} unit="روز" min={0} />
                  </Field>
                    {!showError?.('withdrawalDays') && <FieldHint fieldPath="whs.withdrawalDays" value={form.withdrawalDays} />}
                  </div>
                )}
                {extras.needsStorage && (
                  <Field label="نگهداری" error={showError?.('storage')} onTouch={() => markTouched?.('storage')}>
                    <SmartSelect
                      value={form.storage}
                      modalTitle="شرایط نگهداری"
                      options={[
                        { value: 'room', label: 'دمای اتاق', icon: 'climate' },
                        { value: 'fridge', label: 'یخچال (۲-۸°)', icon: '🧊' },
                        { value: 'freezer', label: 'فریزر', icon: '❄️' },
                      ]}
                      onChange={v => setForm({ ...form, storage: v })}
                    />
                  </Field>
                )}
              </Grid2>
            )}
            {isMedicine && (
              <>
                <SectionTitle>💊 اطلاعات مصرف</SectionTitle>
                <Field label="نوع مصرف">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {VET_METHOD_OPTIONS.map(o => (
                      <ToggleChip
                        key={o.value}
                        label={o.label}
                        active={(form.usageTypes || []).includes(o.value)}
                        onClick={() => {
                          const arr: string[] = form.usageTypes || [];
                          const next = arr.includes(o.value) ? arr.filter((v: string) => v !== o.value) : [...arr, o.value];
                          setForm({ ...form, usageTypes: next });
                        }}
                      />
                    ))}
                  </div>
                </Field>

                {(form.usageTypes || []).some((t: string) => t === 'oral' || t === 'injection') && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}>
                    <Field label="دوز هر پرنده" hint="ml" error={showError?.('dosePerBird')} onTouch={() => markTouched?.('dosePerBird')}>
                      <NumField placeholder="۰.۵" value={form.dosePerBird} onChange={e => setForm({ ...form, dosePerBird: e.target.value })} unit="ml" min={0} />
                    </Field>
                    {!showError?.('dosePerBird') && <FieldHint fieldPath="whs.dosePerBird" value={form.dosePerBird} />}
                  </div>
                )}

                {(form.usageTypes || []).includes('water') && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}>
                    <Field label="دوز در لیتر آب" hint="ml/L" error={showError?.('dosePerLiter')} onTouch={() => markTouched?.('dosePerLiter')}>
                      <NumField placeholder="۰.۵" value={form.dosePerLiter || ''} onChange={e => setForm({ ...form, dosePerLiter: e.target.value })} unit="ml/L" min={0} />
                    </Field>
                    {!showError?.('dosePerLiter') && <FieldHint fieldPath="whs.dosePerLiter" value={form.dosePerLiter || ''} />}
                  </div>
                )}

                {(form.usageTypes || []).includes('feed') && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}>
                    <Field label="دوز در کیلو دان" hint="ml/kg" error={showError?.('dosePerKgFeed')} onTouch={() => markTouched?.('dosePerKgFeed')}>
                      <NumField placeholder="۰.۵" value={form.dosePerKgFeed} onChange={e => setForm({ ...form, dosePerKgFeed: e.target.value })} unit="ml/kg" min={0} />
                    </Field>
                  </div>
                )}

                <Field label="تاریخ تولید" hint="اختیاری">
                  <DatePicker value={form.productionDate} onChange={v => setForm({ ...form, productionDate: v })} />
                </Field>
              </>
            )}
          </>
        )}

        {form.category === 'herbal' && (
        <div style={{ marginTop: 12, marginBottom: 12 }}>
          <SectionTitle>🌿 اطلاعات گیاهی (طب سنتی)</SectionTitle>
          <HerbalForm item={form} updateItem={(patch: any) => setForm({ ...form, ...patch })} />
        </div>
      )}

      {form.category === 'feed' && (
          <>
            <SectionTitle>🧪 ترکیبات تغذیه‌ای</SectionTitle>
            <Grid2>
              <Field label="نوع دان">
                <SmartSelect
                  value={form.feedType || ''}
                  placeholder="— انتخاب —"
                  modalTitle="نوع دان"
                  options={[
                    { value: 'starter', label: 'آغازین (Starter)', icon: '🐣' },
                    { value: 'grower', label: 'میانی (Grower)', icon: '🐥' },
                    { value: 'finisher', label: 'پایانی (Finisher)', icon: 'chicken' },
                  ]}
                  onChange={v => setForm({ ...form, feedType: v })}
                />
              </Field>
              <Field label="برند">
                <Input value={form.brand || ''} onChange={e => setForm({ ...form, brand: e.target.value })} placeholder="برند" />
              </Field>
            </Grid2>
            <Grid2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}>
                <Field label="درصد پروتئین">
                <NumField value={form.protein || ''} onChange={e => setForm({ ...form, protein: e.target.value })} unit="٪" min={0} max={100} />
              </Field>
                <FieldHint fieldPath="feed.protein" value={form.protein} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}>
                <Field label="انرژی (Kcal)">
                <NumField value={form.energy || ''} onChange={e => setForm({ ...form, energy: e.target.value })} unit="Kcal" min={0} />
              </Field>
                <FieldHint fieldPath="feed.energy" value={form.energy} />
              </div>
            </Grid2>
            <Grid2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}>
                <Field label="چربی">
                <NumField value={form.fat || ''} onChange={e => setForm({ ...form, fat: e.target.value })} unit="٪" min={0} />
              </Field>
                <FieldHint fieldPath="feed.fat" value={form.fat} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}>
                <Field label="فیبر">
                <NumField value={form.fiber || ''} onChange={e => setForm({ ...form, fiber: e.target.value })} unit="٪" min={0} />
              </Field>
                <FieldHint fieldPath="feed.fiber" value={form.fiber} />
              </div>
            </Grid2>
            <Grid2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}>
                <Field label="کلسیم">
                <NumField value={form.calcium || ''} onChange={e => setForm({ ...form, calcium: e.target.value })} unit="٪" min={0} />
              </Field>
                <FieldHint fieldPath="feed.calcium" value={form.calcium} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}>
                <Field label="فسفر">
                <NumField value={form.phosphorus || ''} onChange={e => setForm({ ...form, phosphorus: e.target.value })} unit="٪" min={0} />
              </Field>
                <FieldHint fieldPath="feed.phosphorus" value={form.phosphorus} />
              </div>
            </Grid2>
            <Grid2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}>
                <Field label="متیونین">
                <NumField value={form.methionine || ''} onChange={e => setForm({ ...form, methionine: e.target.value })} unit="٪" min={0} />
              </Field>
                <FieldHint fieldPath="feed.methionine" value={form.methionine} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}>
                <Field label="لیزین">
                <NumField value={form.lysine || ''} onChange={e => setForm({ ...form, lysine: e.target.value })} unit="٪" min={0} />
              </Field>
                <FieldHint fieldPath="feed.lysine" value={form.lysine} />
              </div>
            </Grid2>
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
                <SmartSelect
                  value={form.hallId}
                  placeholder="— بدون سالن —"
                  modalTitle="انتخاب سالن استقرار"
                  options={halls.map((h) => ({ value: String(h.id), label: String(h.name), icon: 'hall' }))}
                  onChange={(val: string) => setForm({ ...form, hallId: val })}
                />
              </Field>
              <Field label="وضعیت">
                <SmartSelect
                  value={form.equipmentStatus}
                  modalTitle="وضعیت تجهیز"
                  options={[
                    { value: 'active', label: 'فعال', icon: '✅' },
                    { value: 'repair', label: 'در تعمیر', icon: 'hand_tools' },
                    { value: 'scrapped', label: 'اسقاط', icon: '❌' },
                  ]}
                  onChange={v => setForm({ ...form, equipmentStatus: v })}
                />
              </Field>
            </Grid2>
            <Field label="قیمت خرید (کل)">
              <MoneyField placeholder="۰" value={form.purchasePrice} onChange={e => setForm({ ...form, purchasePrice: e.target.value })} />
            </Field>
          </>
        )}

        <Field label="یادداشت" error={showError?.('notes')} onTouch={() => markTouched?.('notes')}>
            <Textarea placeholder="توضیحات" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </Field>

        {err && <ErrorBox>{err}</ErrorBox>}
      </Modal>
  );
}
