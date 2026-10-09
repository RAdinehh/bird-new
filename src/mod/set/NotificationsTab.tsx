import { useSet } from './store';
import { Btn, Field, Grid2, Input } from '../../shr/components/ui';
import TimePicker from '../../shr/components/TimePicker';
import { toFa } from '../../shr/utils/fa';
import SettingsGroup from './SettingsGroup';
import { ToggleRow, LocalNumField } from './helpers';

export default function NotificationsTab() {
  const s = useSet();
  const al = s.alerts;
  const qh = s.quietHours;

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
                <TimePicker
                  value={qh.from}
                  onChange={v => s.updateSection('quietHours', { from: v })}
                  placeholder="انتخاب ساعت"
                />
              </Field>
              <Field label="تا ساعت">
                <TimePicker
                  value={qh.to}
                  onChange={v => s.updateSection('quietHours', { to: v })}
                  placeholder="انتخاب ساعت"
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


    </div>
  );
}
