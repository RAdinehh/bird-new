/**
 * FlockDealSection.tsx — مدل بهره‌برداری (مالکیت، شراکت، امانی، اجاره)
 */
import { Field, Grid2, MoneyField, NumField, Select } from '../../../shr/components/ui';
import { toFa, toEn } from '../../../shr/utils/fa';
import { useCtc } from '../../ctc/store';
import { useTra } from '../../tra/store';
import type { F } from '../types-flocks';
import { HELP } from '../../../shr/help/helpTexts';

interface Props {
  form: F;
  setForm: (updater: F | ((prev: F) => F)) => void;
}

const DEAL_TYPE_LABEL: Record<string, string> = {
  own: '🏠 مالکیت کامل (خودم)',
  partnership: '🤝 شراکتی',
  consignment: '📦 امانی',
  rent: '📋 اجاره‌ای',
};

const DIVIDER = {
  paddingTop: 8,
  fontSize: 'var(--fs-base)',
  fontWeight: 700,
  color: 'var(--text)',
  letterSpacing: '.3px',
  borderTop: '1px dashed var(--border)',
} as const;

const DISABLED_FIELD = {
  height: 38,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: '0 12px',
  background: 'var(--input-bg)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--r-md)',
  fontSize: 'var(--fs-base)',
  fontWeight: 700,
  color: 'var(--muted)',
} as const;

export default function FlockDealSection({ form, setForm }: Props) {
  const contacts = useCtc((s: { contacts: Array<{ id: string; name: string }> }) => s.contacts) || [];
  const deals = useTra((s: { deals: Array<{ id: string; type: string; date: string }> }) => s.deals) || [];

  const partnerShare = parseInt(toEn(form.partnerShare || '')) || 0;
  const myShare = Math.max(0, 100 - partnerShare);

  const relevantDeals = deals.filter((d) => {
    if (form.dealType === 'partnership') return d.type === 'partnership';
    if (form.dealType === 'consignment') return d.type === 'consignment';
    return false;
  });

  return (
    <>
      <div style={DIVIDER}>💼 مدل بهره‌برداری</div>

      <Field label="نوع مالکیت" help={HELP.flk.ownership.type}>
        <Select value={form.dealType || 'own'} onChange={e => setForm({ ...form, dealType: e.target.value })}>
          {Object.entries(DEAL_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
      </Field>

      {form.dealType === 'partnership' && (
        <>
          <Field label="شریک" required help={HELP.flk.ownership.partner}>
            <Select value={form.partnerId || ''} onChange={e => setForm({ ...form, partnerId: e.target.value })}>
              <option value="">— انتخاب —</option>
              {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          <Grid2>
            <Field label="سهم شریک" help={HELP.flk.ownership.partnerShare}>
              <NumField value={form.partnerShare || ''} onChange={e => setForm({ ...form, partnerShare: e.target.value })} unit="٪" min={0} max={100} />
            </Field>
            <Field label="سهم من" hint="خودکار">
              <div style={DISABLED_FIELD}>{toFa(String(myShare))}٪</div>
            </Field>
          </Grid2>
        </>
      )}

      {form.dealType === 'consignment' && (
        <Field label="امانت‌دهنده" required help={HELP.flk.ownership.consignor}>
          <Select value={form.consignorId || ''} onChange={e => setForm({ ...form, consignorId: e.target.value })}>
            <option value="">— انتخاب —</option>
            {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
      )}

      {form.dealType === 'rent' && (
        <>
          <Field label="موجر (اجاره‌دهنده)" required help={HELP.flk.ownership.lessor}>
            <Select value={form.lessorId || ''} onChange={e => setForm({ ...form, lessorId: e.target.value })}>
              <option value="">— انتخاب —</option>
              {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          <Grid2>
            <Field label="مبلغ اجاره" required help={HELP.flk.ownership.rentAmount}>
              <MoneyField value={form.rentAmount || ''} onChange={e => setForm({ ...form, rentAmount: e.target.value })} />
            </Field>
            <Field label="دوره" help={HELP.flk.ownership.rentPeriod}>
              <Select value={form.rentPeriod || 'monthly'} onChange={e => setForm({ ...form, rentPeriod: e.target.value })}>
                <option value="monthly">ماهانه</option>
                <option value="season">فصلی</option>
                <option value="total">کل دوره</option>
              </Select>
            </Field>
          </Grid2>
        </>
      )}

      {relevantDeals.length > 0 && (
        <Field label="لینک به قرارداد (اختیاری)" hint="قرارداد مالی موجود در tra">
          <Select value={form.dealId || ''} onChange={e => setForm({ ...form, dealId: e.target.value })}>
            <option value="">— بدون لینک —</option>
            {relevantDeals.map(d => <option key={d.id} value={d.id}>#{d.id.slice(0, 6)} · {d.date || ''}</option>)}
          </Select>
        </Field>
      )}
    </>
  );
}
