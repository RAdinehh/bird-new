/**
 * UnitsTab.tsx — تب «واحدها و قالب‌بندی»
 *
 * همه واحدهای نمایشی از اینجا تنظیم میشن.
 * پیش‌نمایش زنده زیر هر بخش.
 */
import { useSet } from '../store';
import { Field, Select, NumField } from '../../../shr/components/ui';
import SettingsGroup from '../SettingsGroup';
import { useFormat } from '../../../shr/units/useFormat';
import {
  UNIT_LABELS,
  type CurrencyUnit, type TempUnit, type WeightUnit, type VolumeUnit,
  type LengthUnit, type AreaUnit, type TimeUnit,
  type NumberFormat, type ThousandSep, type DateFormat,
} from '../../../shr/units/types';

const SEP_OPTIONS: ThousandSep[] = ['fa', 'en', 'space', 'dot', 'none'];
const DEC_OPTIONS = [0, 1, 2, 3, 4];

export default function UnitsTab() {
  const units = useSet(s => s.units);
  const update = (patch: Partial<typeof units>) => {
    useSet.setState({ units: { ...units, ...patch } });
  };
  const fmt = useFormat();

  // نمونه‌ها برای پیش‌نمایش
  const sampleMoney = 5000000; // ۵ میلیون تومان
  const sampleTemp = 32;        // ۳۲ درجه سلسیوس
  const sampleWeight = 2500;    // ۲۵۰۰ گرم
  const sampleVolume = 5000;    // ۵۰۰۰ میلی‌لیتر
  const sampleLength = 12;      // ۱۲ سانتی‌متر
  const sampleArea = 100;       // ۱۰۰ مترمربع
  const sampleTime = 3600;      // ۱ ساعت
  const sampleNumber = 12500000;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>

      {/* ═══ 💰 ارز ═══ */}
      <SettingsGroup icon="💰" title="ارز" subtitle="واحد پول و نرخ دلار" tone="accent">
        <Field label="واحد پول">
          <Select
            value={units.currency}
            onChange={e => update({ currency: e.target.value as CurrencyUnit })}
          >
            {(['toman', 'rial', 'usd'] as const).map(k => (
              <option key={k} value={k}>{UNIT_LABELS.currency[k]}</option>
            ))}
          </Select>
        </Field>

        {units.currency === 'usd' && (
          <Field label="نرخ دلار (تومان)" hint="هر روز از سایت‌های معتبر به‌روز کن">
            <NumField
              value={String(units.usdRate)}
              onChange={e => {
                const n = Number(e.target.value);
                if (!isNaN(n) && n > 0) update({ usdRate: n });
              }}
              unit="تومان"
              min={1}
            />
          </Field>
        )}

        <PreviewBox>
          {fmt.money(sampleMoney)}
        </PreviewBox>
      </SettingsGroup>

      {/* ═══ 🌡 دما ═══ */}
      <SettingsGroup icon="🌡" title="دما" subtitle="سلسیوس / فارنهایت" tone="warn">
        <Field label="واحد">
          <Select
            value={units.temperature}
            onChange={e => update({ temperature: e.target.value as TempUnit })}
          >
            {(['c', 'f'] as const).map(k => (
              <option key={k} value={k}>{UNIT_LABELS.temperature[k]}</option>
            ))}
          </Select>
        </Field>
        <PreviewBox>{fmt.temp(sampleTemp)}</PreviewBox>
      </SettingsGroup>

      {/* ═══ ⚖️ وزن ═══ */}
      <SettingsGroup icon="⚖️" title="وزن" subtitle="واحد وزن" tone="info">
        <Field label="واحد">
          <Select
            value={units.weight}
            onChange={e => update({ weight: e.target.value as WeightUnit })}
          >
            {(['mg', 'g', 'kg', 'ton'] as const).map(k => (
              <option key={k} value={k}>{UNIT_LABELS.weight[k]}</option>
            ))}
          </Select>
        </Field>
        <PreviewBox>{fmt.weight(sampleWeight)}</PreviewBox>
      </SettingsGroup>

      {/* ═══ 💧 حجم ═══ */}
      <SettingsGroup icon="💧" title="حجم" subtitle="واحد حجم (دارو، آب)" tone="info">
        <Field label="واحد">
          <Select
            value={units.volume}
            onChange={e => update({ volume: e.target.value as VolumeUnit })}
          >
            {(['cc', 'ml', 'L'] as const).map(k => (
              <option key={k} value={k}>{UNIT_LABELS.volume[k]}</option>
            ))}
          </Select>
        </Field>
        <PreviewBox>{fmt.volume(sampleVolume)}</PreviewBox>
      </SettingsGroup>

      {/* ═══ 📏 طول ═══ */}
      <SettingsGroup icon="📏" title="طول" subtitle="فاصله، ابعاد" tone="info">
        <Field label="واحد">
          <Select
            value={units.length}
            onChange={e => update({ length: e.target.value as LengthUnit })}
          >
            {(['mm', 'cm', 'm', 'km'] as const).map(k => (
              <option key={k} value={k}>{UNIT_LABELS.length[k]}</option>
            ))}
          </Select>
        </Field>
        <PreviewBox>{fmt.length(sampleLength)}</PreviewBox>
      </SettingsGroup>

      {/* ═══ 📐 مساحت ═══ */}
      <SettingsGroup icon="📐" title="مساحت" subtitle="مترمربع، هکتار" tone="info">
        <Field label="واحد">
          <Select
            value={units.area}
            onChange={e => update({ area: e.target.value as AreaUnit })}
          >
            {(['m2', 'ha'] as const).map(k => (
              <option key={k} value={k}>{UNIT_LABELS.area[k]}</option>
            ))}
          </Select>
        </Field>
        <PreviewBox>{fmt.area(sampleArea)}</PreviewBox>
      </SettingsGroup>

      {/* ═══ ⏱ زمان ═══ */}
      <SettingsGroup icon="⏱" title="زمان" subtitle="دقیقه، ساعت، روز" tone="info">
        <Field label="واحد">
          <Select
            value={units.time}
            onChange={e => update({ time: e.target.value as TimeUnit })}
          >
            {(['min', 'h', 'day'] as const).map(k => (
              <option key={k} value={k}>{UNIT_LABELS.time[k]}</option>
            ))}
          </Select>
        </Field>
        <PreviewBox>{fmt.time(sampleTime)}</PreviewBox>
      </SettingsGroup>

      {/* ═══ 🔢 نمایش اعداد ═══ */}
      <SettingsGroup icon="🔢" title="نمایش اعداد" subtitle="فرمت، اعشار، جداکننده" tone="purple">
        <Field label="فرمت اعداد">
          <Select
            value={units.numberFormat}
            onChange={e => update({ numberFormat: e.target.value as NumberFormat })}
          >
            {(['fa', 'en'] as const).map(k => (
              <option key={k} value={k}>{UNIT_LABELS.numberFormat[k]}</option>
            ))}
          </Select>
        </Field>

        <Field label="تعداد اعشار">
          <Select
            value={String(units.decimals)}
            onChange={e => update({ decimals: Number(e.target.value) })}
          >
            {DEC_OPTIONS.map(n => (
              <option key={n} value={n}>{n} رقم</option>
            ))}
          </Select>
        </Field>

        <Field label="جداکننده هزار">
          <Select
            value={units.thousandSep}
            onChange={e => update({ thousandSep: e.target.value as ThousandSep })}
          >
            {SEP_OPTIONS.map(k => (
              <option key={k} value={k}>{UNIT_LABELS.thousandSep[k]}</option>
            ))}
          </Select>
        </Field>

        <PreviewBox>{fmt.int(sampleNumber)}</PreviewBox>
      </SettingsGroup>

      {/* ═══ 📅 تاریخ ═══ */}
      <SettingsGroup icon="📅" title="تاریخ" subtitle="تقویم" tone="info">
        <Field label="تقویم">
          <Select
            value={units.dateFormat}
            onChange={e => update({ dateFormat: e.target.value as DateFormat })}
          >
            {(['jalali', 'gregorian'] as const).map(k => (
              <option key={k} value={k}>{UNIT_LABELS.dateFormat[k]}</option>
            ))}
          </Select>
        </Field>
      </SettingsGroup>

    </div>
  );
}

// ═══ پیش‌نمایش ═══
function PreviewBox({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      padding: '10px 14px',
      background: 'var(--accent-soft)',
      border: '1px solid var(--accent-border)',
      borderRadius: 'var(--r-md)',
      textAlign: 'center',
      fontSize: 'var(--fs-md)',
      fontWeight: 700,
      color: 'var(--accent)',
      fontVariantNumeric: 'tabular-nums',
      direction: 'rtl',
    }}>
      {children}
    </div>
  );
}
