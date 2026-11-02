/**
 * ContactFormModal — فرم افزودن/ویرایش مخاطب
 */
import { Btn, BtnRow, DigitField, Field, Grid2, Input, Modal, PhoneField, Select, Textarea, ErrorBox } from '../../../shr/components/ui';
import { ROLE_LABEL, CUSTOMER_TYPES, BANKS_BY_GROUP, isBankCode, findBankByShabaCode, type Role, type Gender, type BankAccount } from '../store';

const GENDER_OPTIONS: { value: Gender; label: string; icon: string }[] = [
  { value: 'unspecified', label: 'بی‌طرف', icon: '—' },
  { value: 'male', label: 'مرد', icon: '♂️' },
  { value: 'female', label: 'زن', icon: '♀️' },
];

interface F {
  id?: string; name: string; phone: string; phone2: string; email: string;
  address: string; city: string; nationalId: string; roles: Role[]; notes: string;
  customerType: string; customerTypes: string[]; trustScore: string; defaultDiscount: string;
  supplierTypes: string[]; position: string; startDate: string; salaryType: string; salaryAmount: string; insurance: boolean;

  creditLimit?: number | null;
  gender?: Gender;
  bankAccount?: BankAccount;
}

interface Props {
  open: boolean;
  setOpen: (v: boolean) => void;
  form: F;
  setForm: React.Dispatch<React.SetStateAction<F>>;
  err: string;
  onSave: () => void;
}

export default function ContactFormModal({ open, setOpen, form, setForm, err, onSave }: Props) {
  const toggleRole = (r: Role) => setForm(f => ({ ...f, roles: f.roles.includes(r) ? f.roles.filter(x => x !== r) : [...f.roles, r] }));

  return (
      <Modal open={open} onClose={() => setOpen(false)} title={form.id ? 'ویرایش مخاطب' : 'افزودن مخاطب'}
          footer={<BtnRow><Btn variant="primary" onClick={onSave}>ذخیره</Btn><Btn onClick={() => setOpen(false)}>لغو</Btn></BtnRow>}>
          <Field label="نقش‌ها" required hint="یک شخص می‌تواند چند نقش داشته باشد">
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(['customer', 'supplier', 'worker'] as Role[]).map(r => (
                <button key={r} onClick={() => toggleRole(r)} style={{
                  padding: '6px 12px', fontSize: 'var(--fs-sm)',
                  background: form.roles.includes(r) ? 'var(--accent-soft)' : 'var(--btn-bg)',
                  border: `1px solid ${form.roles.includes(r) ? 'var(--accent-border)' : 'var(--border)'}`,
                  borderRadius: 'var(--r-sm)', color: form.roles.includes(r) ? 'var(--accent)' : 'var(--muted)',
                  fontWeight: form.roles.includes(r) ? 600 : 500, cursor: 'pointer', fontFamily: 'inherit'
                }}>{ROLE_LABEL[r]}</button>
              ))}
            </div>
          </Field>

          {form.roles.includes('customer') && (
            <Field label="نوع مشتری" hint="می‌تواند چند مورد باشد">
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {CUSTOMER_TYPES.map(([v, l]) => (
                  <button key={v} type="button"
                    onClick={() => {
                      setForm(f => ({
                        ...f,
                        customerTypes: f.customerTypes.includes(v)
                          ? f.customerTypes.filter(x => x !== v)
                          : [...f.customerTypes, v]
                      }));
                    }}
                    style={{
                      padding: '6px 12px', fontSize: 'var(--fs-sm)',
                      background: form.customerTypes.includes(v) ? 'var(--accent-soft)' : 'var(--btn-bg)',
                      border: `1px solid ${form.customerTypes.includes(v) ? 'var(--accent-border)' : 'var(--border)'}`,
                      borderRadius: 'var(--r-sm)',
                      color: form.customerTypes.includes(v) ? 'var(--accent)' : 'var(--muted)',
                      fontWeight: form.customerTypes.includes(v) ? 600 : 500,
                      cursor: 'pointer', fontFamily: 'inherit'
                    }}>
                    {l}
                  </button>
                ))}
              </div>
            </Field>
          )}
          <Grid2>
            <Field label="نام" required><Input placeholder="..." value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></Field>
            <Field label="تلفن"><PhoneField placeholder="۰۹..." value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></Field>
            {(form.roles || []).includes('customer') && (
              <Field label="سقف اعتبار (تومان)" hint="۰ یا خالی = بدون سقف — فروش بیش از این مبلغ مسدود می‌شود">
                <Input
                  mode="number"
                  placeholder="مثلاً ۵۰٬۰۰۰٬۰۰۰"
                  value={form.creditLimit != null && form.creditLimit > 0 ? String(form.creditLimit) : ''}
                  onChange={e => {
                    const v = parseInt(String(e.target.value).replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[,،]/g, '')) || 0;
                    setForm({ ...form, creditLimit: v > 0 ? v : null });
                  }}
                  unit="تومان"
                />
              </Field>
            )}
          </Grid2>
          <Grid2>
            <Field label="کد ملی"><DigitField maxLength={10} placeholder="..." value={form.nationalId} onChange={e => setForm({...form, nationalId: e.target.value})} /></Field>
            <Field label="آدرس"><Input placeholder="..." value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></Field>
          </Grid2>

          <Field label="جنسیت" hint="برای پیام‌های محترمانه (یادآوری، صورت‌حساب)">
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {GENDER_OPTIONS.map(opt => {
                const active = (form.gender || 'unspecified') === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm({ ...form, gender: opt.value })}
                    style={{
                      padding: '6px 12px', fontSize: 'var(--fs-sm)',
                      background: active ? 'var(--accent-soft)' : 'var(--btn-bg)',
                      border: `1px solid ${active ? 'var(--accent-border)' : 'var(--border)'}`,
                      borderRadius: 'var(--r-sm)',
                      color: active ? 'var(--accent)' : 'var(--muted)',
                      fontWeight: active ? 600 : 500,
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    {opt.icon} {opt.label}
                  </button>
                );
              })}
            </div>
          </Field>

          <div style={{ paddingTop: 8, marginTop: 4, borderTop: '1px dashed var(--border)', fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)', letterSpacing: '.3px' }}>🏦 اطلاعات بانکی (اختیاری)</div>

          <Grid2>
            <Field label="بانک">
              <Select
                value={form.bankAccount?.bank || ''}
                onChange={e => {
                  const v = e.target.value;
                  if (v === '') {
                    setForm(f => ({ ...f, bankAccount: { ...f.bankAccount, bank: undefined } }));
                  } else if (isBankCode(v)) {
                    setForm(f => ({ ...f, bankAccount: { ...f.bankAccount, bank: v } }));
                  }
                }}
              >
                <option value="">— انتخاب —</option>
                <optgroup label="🏛 دولتی">
                  {BANKS_BY_GROUP.gov.map(b => (
                    <option key={b.key} value={b.key}>{b.label}</option>
                  ))}
                </optgroup>
                <optgroup label="🏦 خصوصی">
                  {BANKS_BY_GROUP.private.map(b => (
                    <option key={b.key} value={b.key}>{b.label}</option>
                  ))}
                </optgroup>
                <optgroup label="📋 سایر">
                  {BANKS_BY_GROUP.other.map(b => (
                    <option key={b.key} value={b.key}>{b.label}</option>
                  ))}
                </optgroup>
              </Select>
            </Field>
            <Field label="نام صاحب حساب" hint="اگر با نام مخاطب فرق دارد">
              <Input
                placeholder="..."
                value={form.bankAccount?.accountHolder || ''}
                onChange={e => setForm(f => ({ ...f, bankAccount: { ...f.bankAccount, accountHolder: e.target.value } }))}
              />
            </Field>
          </Grid2>

          <Grid2>
            <Field label="شماره حساب">
              <Input
                dir="ltr"
                inputMode="numeric"
                maxLength={20}
                placeholder="۱۰-۲۰ رقم"
                value={form.bankAccount?.accountNumber || ''}
                onChange={e => {
                  const v = e.target.value.replace(/\D/g, '').slice(0, 20);
                  setForm(f => ({ ...f, bankAccount: { ...f.bankAccount, accountNumber: v } }));
                }}
              />
            </Field>
            <Field label="شماره کارت" hint="۱۶ رقم">
              <Input
                dir="ltr"
                inputMode="numeric"
                maxLength={16}
                placeholder="۶۰۳۷..."
                value={form.bankAccount?.cardNumber || ''}
                onChange={e => {
                  const v = e.target.value.replace(/\D/g, '').slice(0, 16);
                  setForm(f => ({ ...f, bankAccount: { ...f.bankAccount, cardNumber: v } }));
                }}
              />
            </Field>
          </Grid2>

          <Field
            label="شماره شبا"
            hint={
              form.bankAccount?.bank
                ? `بانک تشخیص‌داده‌شده: ${BANKS_BY_GROUP.gov.concat(BANKS_BY_GROUP.private, BANKS_BY_GROUP.other).find(b => b.key === form.bankAccount?.bank)?.label || '—'}`
                : 'IR + ۲۴ رقم — با ورود، بانک خودکار تشخیص داده می‌شود'
            }
          >
            <Input
              dir="ltr"
              maxLength={26}
              placeholder="IR..."
              value={form.bankAccount?.shaba || ''}
              onChange={e => {
                const raw = e.target.value.toUpperCase();
                const v = raw.replace(/[^IR0-9]/g, '').slice(0, 26);
                const digits = v.replace(/\D/g, '');
                let detectedBank = form.bankAccount?.bank;
                if (digits.length >= 5) {
                  const bankCode = digits.slice(2, 5);
                  const found = findBankByShabaCode(bankCode);
                  if (found) detectedBank = found.key;
                }
                setForm(f => ({ ...f, bankAccount: { ...f.bankAccount, shaba: v, bank: detectedBank } }));
              }}
            />
          </Field>

          <Field label="یادداشت">
            <Textarea placeholder="..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
          </Field>
          <ErrorBox>{err}</ErrorBox>
        </Modal>
  );
}
