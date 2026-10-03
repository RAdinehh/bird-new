import { useSet } from './store';
import { Btn, Field, Grid2, Input } from '../../shr/components/ui';
import { toFa } from '../../shr/utils/fa';
import SettingsGroup from './SettingsGroup';
import { ToggleRow, LocalNumField } from './helpers';

export default function NotificationsTab() {
  const s = useSet();
  const al = s.alerts;
  const qh = s.quietHours;
  const th = s.thresholds;

  const activeAlerts = [al.critical, al.important, al.info].filter(Boolean).length;
  const activeReminders = (s.dueDateReminders || []).length;

  const updateReminder = (days: number) => {
    const cur = s.dueDateReminders || [7, 3, 1];
    const next = cur.includes(days)
      ? cur.filter(x => x !== days)
      : [...cur, days].sort((a, b) => b - a);
    s.update({ dueDateReminders: next });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>

      {/* ═══ ۱. سطوح هشدار ═══ */}
      <SettingsGroup
        icon="📡"
        title="سطوح هشدار"
        subtitle={`${toFa(activeAlerts)} از ۳ سطح فعال`}
        tone="accent"
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

      {/* ═══ ۲. ساعات سکوت ═══ */}
      <SettingsGroup
        icon="🌙"
        title="ساعات سکوت"
        subtitle={qh.enabled ? `${qh.from} تا ${qh.to}` : 'غیرفعال'}
        tone="purple"
      >
        <ToggleRow
          label="فعال"
          sub="در این ساعات اعلان غیر‌بحرانی نیاید"
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
              sub="در آخر هفته هم اعمال شود"
              value={qh.weekends}
              onChange={() => s.updateSection('quietHours', { weekends: !qh.weekends })}
            />
          </>
        ) : null}
      </SettingsGroup>

      {/* ═══ ۳. یادآور سرسید ═══ */}
      <SettingsGroup
        icon="⏰"
        title="یادآور سرسید"
        subtitle={`${toFa(activeReminders)} یادآور فعال`}
        tone="warn"
      >
        <div style={{
          fontSize: 'var(--fs-xs)',
          color: 'var(--muted)',
          lineHeight: 1.7,
          padding: '8px 10px',
          background: 'var(--input-bg)',
          borderRadius: 'var(--r-sm)',
        }}>
          قبل از رسیدن سرسید فاکتورهای پرداخت‌نشده
        </div>
        <Grid2>
          <ToggleRow
            label="۷ روز قبل"
            value={(s.dueDateReminders || []).includes(7)}
            onChange={() => updateReminder(7)}
          />
          <ToggleRow
            label="۳ روز قبل"
            value={(s.dueDateReminders || []).includes(3)}
            onChange={() => updateReminder(3)}
          />
          <ToggleRow
            label="۱ روز قبل"
            value={(s.dueDateReminders || []).includes(1)}
            onChange={() => updateReminder(1)}
          />
          <ToggleRow
            label="روز سرسید"
            value={(s.dueDateReminders || []).includes(0)}
            onChange={() => updateReminder(0)}
          />
        </Grid2>
      </SettingsGroup>

      {/* ═══ ۴. آستانه‌های هشدار ═══ */}
      <SettingsGroup
        icon="📊"
        title="آستانه‌های هشدار"
        subtitle={`افت ${toFa(th.eggDropPercent)}٪ · تلفات ${toFa(th.mortalityPerThousand)}/هزار`}
        tone="danger"
      >
        <div style={{
          fontSize: 'var(--fs-xs)',
          color: 'var(--muted)',
          lineHeight: 1.7,
          padding: '8px 10px',
          background: 'var(--input-bg)',
          borderRadius: 'var(--r-sm)',
        }}>
          وقتی این آستانه‌ها رد شوند، هشدار خودکار ایجاد می‌شود
        </div>

        <Grid2>
          <LocalNumField
            label="افت تخم بیش از"
            hint="٪ نسبت به میانگین"
            value={th.eggDropPercent}
            onChange={n => s.updateSection('thresholds', { eggDropPercent: n })}
            unit="٪"
            min={0}
            max={100}
          />
          <LocalNumField
            label="تلفات بیش از"
            hint="در هزار پرنده"
            value={th.mortalityPerThousand}
            onChange={n => s.updateSection('thresholds', { mortalityPerThousand: n })}
            unit="در هزار"
            min={0}
            max={1000}
          />
          <LocalNumField
            label="انحراف دما"
            hint="بالاتر از هدف"
            value={th.tempDeviation}
            onChange={n => s.updateSection('thresholds', { tempDeviation: n })}
            unit="°C"
            min={0}
            max={30}
          />
          <LocalNumField
            label="انحراف رطوبت"
            hint="بالاتر از هدف"
            value={th.humidityDeviation}
            onChange={n => s.updateSection('thresholds', { humidityDeviation: n })}
            unit="٪"
            min={0}
            max={100}
          />
          <LocalNumField
            label="حداقل آب/دان"
            hint="هشدار اگر کمتر"
            value={th.waterFeedMin ?? 1.6}
            onChange={n => s.updateSection('thresholds', { waterFeedMin: n })}
            unit=""
            min={0}
            max={10}
          />
          <LocalNumField
            label="حداکثر آب/دان"
            hint="هشدار اگر بیشتر"
            value={th.waterFeedMax ?? 2.2}
            onChange={n => s.updateSection('thresholds', { waterFeedMax: n })}
            unit=""
            min={0}
            max={10}
          />
          <LocalNumField
            label="دمای بحرانی بالا"
            hint="هشدار فوری"
            value={th.criticalTempHigh ?? 32}
            onChange={n => s.updateSection('thresholds', { criticalTempHigh: n })}
            unit="°C"
            min={0}
            max={60}
          />
          <LocalNumField
            label="دمای بحرانی پایین"
            hint="هشدار فوری"
            value={th.criticalTempLow ?? 18}
            onChange={n => s.updateSection('thresholds', { criticalTempLow: n })}
            unit="°C"
            min={-10}
            max={40}
          />
        </Grid2>

        <Btn
          size="sm"
          full
          onClick={() => s.updateSection('thresholds', {
            eggDropPercent: 10,
            mortalityPerThousand: 5,
            tempDeviation: 2,
            humidityDeviation: 10,
            waterFeedMin: 1.6,
            waterFeedMax: 2.2,
            criticalTempHigh: 32,
            criticalTempLow: 18,
          })}
        >
          🔄 بازنشانی به پیش‌فرض
        </Btn>
      </SettingsGroup>

    </div>
  );
}
