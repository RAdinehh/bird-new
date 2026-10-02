/**
 * UnitsTab.tsx — واحدها و قالب‌بندی (طرح مینیمال)
 *
 * دو کارت اصلی:
 *   ۱. واحدهای فیزیکی + ارز (با پیش‌نمایش هر خط)
 *   ۲. نمایش اعداد + تاریخ
 */
import { useSet } from '../store';
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

// ═══ نمونه‌ها برای پیش‌نمایش ═══
const SAMPLE = {
  money: 5000000,
  temp: 32,
  weight: 2500,
  volume: 5000,
  length: 12,
  area: 100,
  time: 3600,
  number: 12500000,
};

// ═══ یک ردیف واحد ═══
function UnitRow({
  icon, label, value, onChange, options, preview,
}: {
  icon: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly { v: string; l: string }[];
  preview: string;
}) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr auto auto',
      gap: 10,
      alignItems: 'center',
      padding: '10px 0',
      borderBottom: '1px solid var(--border)',
    }}>
      {/* راست: label */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        minWidth: 0,
      }}>
        <span style={{ fontSize: 18, flexShrink: 0 }} aria-hidden="true">{icon}</span>
        <span style={{
          fontSize: 'var(--fs-base)',
          fontWeight: 600,
          color: 'var(--text)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>{label}</span>
      </div>

      {/* وسط: preview */}
      <div style={{
        fontSize: 'var(--fs-sm)',
        fontWeight: 700,
        color: 'var(--accent)',
        fontVariantNumeric: 'tabular-nums',
        direction: 'rtl',
        textAlign: 'left',
        whiteSpace: 'nowrap',
        minWidth: 80,
      }}>
        {preview}
      </div>

      {/* چپ: dropdown */}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          height: 34,
          padding: '0 8px',
          background: 'var(--input-bg)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-sm)',
          color: 'var(--text)',
          fontFamily: 'inherit',
          fontSize: 'var(--fs-sm)',
          fontWeight: 600,
          cursor: 'pointer',
          minWidth: 90,
          textAlign: 'right',
        }}
      >
        {options.map(o => (
          <option key={o.v} value={o.v}>{o.l}</option>
        ))}
      </select>
    </div>
  );
}

export default function UnitsTab() {
  const units = useSet(s => s.units);
  const update = (patch: Partial<typeof units>) => {
    useSet.setState({ units: { ...units, ...patch } });
  };
  const fmt = useFormat();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>

      {/* ═══ کارت ۱: واحدهای اندازه‌گیری ═══ */}
      <SettingsGroup icon="📐" title="واحدهای اندازه‌گیری" subtitle="با پیش‌نمایش زنده" tone="accent">

        <UnitRow
          icon="💰" label="ارز"
          value={units.currency}
          onChange={v => update({ currency: v as CurrencyUnit })}
          options={[
            { v: 'toman', l: 'تومان' },
            { v: 'rial', l: 'ریال' },
            { v: 'usd', l: 'دلار' },
          ]}
          preview={fmt.money(SAMPLE.money)}
        />

        {units.currency === 'usd' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: 10,
            alignItems: 'center',
            padding: '10px 0',
            borderBottom: '1px solid var(--border)',
            background: 'var(--accent-soft)',
            marginTop: -1,
            paddingRight: 10,
            paddingLeft: 10,
            borderRadius: 'var(--r-sm)',
          }}>
            <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--accent)' }}>
              نرخ دلار (تومان)
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={fmt.int(units.usdRate)}
              onChange={e => {
                const cleaned = String(e.target.value)
                  .replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
                  .replace(/[^\d]/g, '');
                const n = Number(cleaned);
                if (!isNaN(n) && n > 0) update({ usdRate: n });
              }}
              style={{
                width: 100,
                height: 34,
                padding: '0 8px',
                background: 'var(--card)',
                border: '1px solid var(--accent-border)',
                borderRadius: 'var(--r-sm)',
                color: 'var(--accent)',
                fontFamily: 'inherit',
                fontSize: 'var(--fs-sm)',
                fontWeight: 700,
                textAlign: 'center',
                direction: 'rtl',
                fontVariantNumeric: 'tabular-nums',
              }}
            />
          </div>
        )}

        <UnitRow
          icon="🌡" label="دما"
          value={units.temperature}
          onChange={v => update({ temperature: v as TempUnit })}
          options={[
            { v: 'c', l: 'سلسیوس' },
            { v: 'f', l: 'فارنهایت' },
          ]}
          preview={fmt.temp(SAMPLE.temp)}
        />

        <UnitRow
          icon="⚖️" label="وزن"
          value={units.weight}
          onChange={v => update({ weight: v as WeightUnit })}
          options={[
            { v: 'mg', l: 'میلی‌گرم' },
            { v: 'g', l: 'گرم' },
            { v: 'kg', l: 'کیلوگرم' },
            { v: 'ton', l: 'تن' },
          ]}
          preview={fmt.weight(SAMPLE.weight)}
        />

        <UnitRow
          icon="💧" label="حجم"
          value={units.volume}
          onChange={v => update({ volume: v as VolumeUnit })}
          options={[
            { v: 'cc', l: 'سی‌سی' },
            { v: 'ml', l: 'میلی‌لیتر' },
            { v: 'L', l: 'لیتر' },
          ]}
          preview={fmt.volume(SAMPLE.volume)}
        />

        <UnitRow
          icon="📏" label="طول"
          value={units.length}
          onChange={v => update({ length: v as LengthUnit })}
          options={[
            { v: 'mm', l: 'میلی‌متر' },
            { v: 'cm', l: 'سانتی‌متر' },
            { v: 'm', l: 'متر' },
            { v: 'km', l: 'کیلومتر' },
          ]}
          preview={fmt.length(SAMPLE.length)}
        />

        <UnitRow
          icon="📐" label="مساحت"
          value={units.area}
          onChange={v => update({ area: v as AreaUnit })}
          options={[
            { v: 'm2', l: 'مترمربع' },
            { v: 'ha', l: 'هکتار' },
          ]}
          preview={fmt.area(SAMPLE.area)}
        />

        <UnitRow
          icon="⏱" label="زمان"
          value={units.time}
          onChange={v => update({ time: v as TimeUnit })}
          options={[
            { v: 's', l: 'ثانیه' },
            { v: 'min', l: 'دقیقه' },
            { v: 'h', l: 'ساعت' },
            { v: 'day', l: 'روز' },
          ]}
          preview={fmt.time(SAMPLE.time)}
        />

      </SettingsGroup>

      {/* ═══ کارت ۲: نمایش اعداد و تاریخ ═══ */}
      <SettingsGroup icon="🔢" title="نمایش اعداد و تاریخ" subtitle="فرمت سراسری کل نرم‌افزار" tone="purple">

        <UnitRow
          icon="🔤" label="فرمت اعداد"
          value={units.numberFormat}
          onChange={v => update({ numberFormat: v as NumberFormat })}
          options={[
            { v: 'fa', l: 'فارسی' },
            { v: 'en', l: 'انگلیسی' },
          ]}
          preview={fmt.int(SAMPLE.number)}
        />

        <UnitRow
          icon="🔢" label="تعداد اعشار"
          value={String(units.decimals)}
          onChange={v => update({ decimals: Number(v) })}
          options={DEC_OPTIONS.map(n => ({ v: String(n), l: `${n} رقم` }))}
          preview={fmt.num(1234.5678)}
        />

        <UnitRow
          icon="⌨️" label="جداکننده هزار"
          value={units.thousandSep}
          onChange={v => update({ thousandSep: v as ThousandSep })}
          options={SEP_OPTIONS.map(k => ({ v: k, l: UNIT_LABELS.thousandSep[k] }))}
          preview={fmt.int(SAMPLE.number)}
        />

        <UnitRow
          icon="📅" label="تقویم"
          value={units.dateFormat}
          onChange={v => update({ dateFormat: v as DateFormat })}
          options={[
            { v: 'jalali', l: 'شمسی' },
            { v: 'gregorian', l: 'میلادی' },
          ]}
          preview={units.dateFormat === 'jalali' ? '۱۴۰۴/۰۷/۱۲' : '2025/10/04'}
        />

      </SettingsGroup>

    </div>
  );
}
