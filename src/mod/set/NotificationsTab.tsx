import { useState, useEffect } from 'react';
import { useSet } from './store';
import { Btn, Field, Grid2, Input } from '../../shr/components/ui';
import { toFa, toEn } from '../../shr/utils/fa';
import SettingsGroup from './SettingsGroup';

function ToggleRow({ label, sub, value, onChange, disabled }: any) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 12px',
      background: 'var(--input-bg)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-md)',
      gap: 10,
      opacity: disabled ? 0.6 : 1
    }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 'var(--fs-base)', fontWeight: 600 }}>{label}</div>
        {sub ? <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 2 }}>{sub}</div> : null}
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={disabled ? undefined : onChange}
        style={{
          width: 44, height: 24,
          borderRadius: 12,
          background: value ? 'var(--accent)' : 'var(--dim)',
          position: 'relative',
          border: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          padding: 0,
          flexShrink: 0,
          transition: 'background .2s'
        }}
      >
        <span style={{
          position: 'absolute',
          top: 2,
          right: value ? 22 : 2,
          width: 20, height: 20,
          borderRadius: '50%',
          background: '#fff',
          transition: 'right .2s',
          boxShadow: '0 1px 3px rgba(0,0,0,.2)'
        }} />
      </button>
    </div>
  );
}

/** فیلد عددی با تبدیل خودکار فارسی/انگلیسی */
function NumField({ label, hint, value, onChange, unit, min, max }: {
  label: string;
  hint?: string;
  value: number;
  onChange: (n: number) => void;
  unit?: string;
  min?: number;
  max?: number;
}) {
  const [local, setLocal] = useState(toFa(String(value)));

  useEffect(() => {
    setLocal(toFa(String(value)));
  }, [value]);

  const handleChange = (raw: string) => {
    setLocal(raw);
    const en = toEn(raw).replace(/[^0-9.-]/g, '');
    if (en === '') { onChange(0); return; }
    let n = parseFloat(en);
    if (isNaN(n)) return;
    if (min !== undefined && n < min) n = min;
    if (max !== undefined && n > max) n = max;
    onChange(n);
  };

  return (
    <Field label={label} hint={hint}>
      <Input
        mode="text"
        value={local}
        onChange={e => handleChange(e.target.value)}
        unit={unit}
        inputMode="numeric"
      />
    </Field>
  );
}

export default function NotificationsTab() {
  const s = useSet();
  const ch = s.channels;
  const al = s.alerts;
  const qh = s.quietHours;
  const th = s.thresholds;

  const activeChannels = [ch.inApp, ch.sound, ch.vibration, ch.sms, ch.email, ch.telegram].filter(Boolean).length;
  const activeAlerts = [al.critical, al.important, al.info].filter(Boolean).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>

      <SettingsGroup
        icon="📡"
        title="کانال‌های اعلان"
        subtitle={`${toFa(activeChannels)} کانال فعال از ۶`}
        tone="accent"
      >
        <ToggleRow
          label="درون‌برنامه (Toast)"
          sub="همیشه فعال"
          value={ch.inApp}
          onChange={() => s.updateSection('channels', { inApp: !ch.inApp })}
          disabled
        />
        <ToggleRow
          label="صدا"
          sub="برای هشدارهای بحرانی"
          value={ch.sound}
          onChange={() => s.updateSection('channels', { sound: !ch.sound })}
        />
        <ToggleRow
          label="ویبره"
          sub="در گوشی‌های پشتیبان"
          value={ch.vibration}
          onChange={() => s.updateSection('channels', { vibration: !ch.vibration })}
        />
        <ToggleRow
          label="پیامک"
          sub="در نسخه‌های بعدی"
          value={ch.sms}
          onChange={() => s.updateSection('channels', { sms: !ch.sms })}
        />
        <ToggleRow
          label="ایمیل"
          sub="در نسخه‌های بعدی"
          value={ch.email}
          onChange={() => s.updateSection('channels', { email: !ch.email })}
        />
        <ToggleRow
          label="تلگرام"
          sub="در نسخه‌های بعدی"
          value={ch.telegram}
          onChange={() => s.updateSection('channels', { telegram: !ch.telegram })}
        />
      </SettingsGroup>

      <SettingsGroup
        icon="🔔"
        title="انواع هشدار"
        subtitle={`${toFa(activeAlerts)} از ۳ نوع فعال`}
        tone="warn"
      >
        <ToggleRow
          label="🔴 بحرانی"
          sub="دما، تلفات بالا، آتش"
          value={al.critical}
          onChange={() => s.updateSection('alerts', { critical: !al.critical })}
        />
        <ToggleRow
          label="🟡 مهم"
          sub="واکسن، موجودی، سرسید"
          value={al.important}
          onChange={() => s.updateSection('alerts', { important: !al.important })}
        />
        <ToggleRow
          label="🔵 اطلاعاتی"
          sub="پایان بچ، یادآورها"
          value={al.info}
          onChange={() => s.updateSection('alerts', { info: !al.info })}
        />
      </SettingsGroup>

      <SettingsGroup
        icon="🌙"
        title="ساعات سکوت"
        subtitle={qh.enabled ? `${toFa(qh.from)} تا ${toFa(qh.to)}` : 'غیرفعال'}
        tone="purple"
      >
        <ToggleRow
          label="فعال"
          sub="در این ساعات اعلان نیاید"
          value={qh.enabled}
          onChange={() => s.updateSection('quietHours', { enabled: !qh.enabled })}
        />
        {qh.enabled ? (
          <>
            <Grid2>
              <Field label="از ساعت">
                <Input
                  value={qh.from}
                  onChange={e => s.updateSection('quietHours', { from: e.target.value })}
                  placeholder="22:00"
                  dir="ltr"
                />
              </Field>
              <Field label="تا ساعت">
                <Input
                  value={qh.to}
                  onChange={e => s.updateSection('quietHours', { to: e.target.value })}
                  placeholder="07:00"
                  dir="ltr"
                />
              </Field>
            </Grid2>
            <ToggleRow
              label="پنجشنبه و جمعه"
              sub="ساعات سکوت در آخر هفته هم"
              value={qh.weekends}
              onChange={() => s.updateSection('quietHours', { weekends: !qh.weekends })}
            />
          </>
        ) : null}
      </SettingsGroup>

      <SettingsGroup
        icon="📊"
        title="آستانه‌های هشدار"
        subtitle={`افت ${toFa(th.eggDropPercent)}٪ · تلفات ${toFa(th.mortalityPerThousand)} در هزار`}
        tone="danger"
      >
        <div style={{
          fontSize: 'var(--fs-xs)',
          color: 'var(--muted)',
          lineHeight: 1.7,
          padding: '8px 10px',
          background: 'var(--input-bg)',
          borderRadius: 'var(--r-sm)'
        }}>
          وقتی این آستانه‌ها رد شوند، هشدار خودکار ایجاد می‌شود.
        </div>

        <NumField
          label="افت تخم‌گذاری بیش از"
          hint="درصد افت نسبت به میانگین"
          value={th.eggDropPercent}
          onChange={n => s.updateSection('thresholds', { eggDropPercent: n })}
          unit="٪"
          min={0}
          max={100}
        />

        <NumField
          label="تلفات بیش از"
          hint="در هزار پرنده"
          value={th.mortalityPerThousand}
          onChange={n => s.updateSection('thresholds', { mortalityPerThousand: n })}
          unit="در هزار"
          min={0}
          max={1000}
        />

        <NumField
          label="انحراف دما بیش از"
          hint="درجه سلسیوس"
          value={th.tempDeviation}
          onChange={n => s.updateSection('thresholds', { tempDeviation: n })}
          unit="°C"
          min={0}
          max={30}
        />

        <NumField
          label="انحراف رطوبت بیش از"
          hint="درصد"
          value={th.humidityDeviation}
          onChange={n => s.updateSection('thresholds', { humidityDeviation: n })}
          unit="٪"
          min={0}
          max={100}
        />

        <Btn
          size="sm"
          full
          onClick={() => s.updateSection('thresholds', {
            eggDropPercent: 10,
            mortalityPerThousand: 5,
            tempDeviation: 2,
            humidityDeviation: 10
          })}
        >
          🔄 بازنشانی به پیش‌فرض
        </Btn>
      </SettingsGroup>

      <div style={{
        padding: '12px 14px',
        background: 'var(--info-soft)',
        border: '1px solid var(--info)',
        borderRadius: 'var(--r-md)',
        fontSize: 'var(--fs-xs)',
        color: 'var(--info)',
        lineHeight: 1.7,
        textAlign: 'center'
      }}>
        💡 اعلان‌ها فعلاً درون‌برنامه هستند. پیامک، ایمیل و تلگرام در نسخه‌های بعدی.
      </div>
    </div>
  );
}
