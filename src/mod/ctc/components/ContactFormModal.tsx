/**
 * ContactFormModal — فرم افزودن/ویرایش مخاطب
 */
import { Btn, BtnRow, DigitField, Field, Grid2, Input, Modal, PhoneField, Textarea, ErrorBox } from '../../../shr/components/ui';
import { ROLE_LABEL, CUSTOMER_TYPES, type Role } from '../store';

interface F {
  id?: string; name: string; phone: string; phone2: string; email: string;
  address: string; city: string; nationalId: string; roles: Role[]; notes: string;
  customerType: string; customerTypes: string[]; trustScore: string; defaultDiscount: string;
  supplierTypes: string[]; position: string; startDate: string; salaryType: string; salaryAmount: string; insurance: boolean;

  creditLimit?: number | null;}

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

          <Field label="یادداشت">
            <Textarea placeholder="..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
          </Field>
          <ErrorBox>{err}</ErrorBox>
        </Modal>
  );
}
