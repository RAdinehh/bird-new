import { useState, useEffect } from 'react';
import { useSet } from './store';
import { Btn, Field, Grid2, Input } from '../../shr/components/ui';
import { toFa, toEn } from '../../shr/utils/fa';
import SettingsGroup from './SettingsGroup';
import { ToggleRow, LocalNumField, SubSection } from './helpers';

/** فیلد عددی با تبدیل خودکار فارسی/انگلیسی */
export default function NotificationsTab() {
  const s = useSet();
  const ch = s.channels;
  const al = s.alerts;
  const qh = s.quietHours;
  const th = s.thresholds;

  const activeChannels = [ch.inApp, ch.sound, ch.vibration].filter(Boolean).length;
  const activeAlerts = [al.critical, al.important, al.info].filter(Boolean).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>

      <SettingsGroup
        icon="📡"
        title="نحوه‌ی اعلان"
        subtitle={`${toFa(activeChannels)} کانال فعال از ۳`}
        tone="accent"
       defaultOpen>
        <SubSection label="نحوه‌ی ارسال اعلان" icon="📡" />
        <SubSection label="انواع هشدار" icon="🔔" />
        <SubSection label="چه سطحی هشدار بده" icon="🎯" />
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
      
        <SubSection label="ساعات سکوت" icon="🌙" />
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
        <SubSection label="مقادیر بحرانی" icon="⚙️" />
        <div style={{
          fontSize: 'var(--fs-xs)',
          color: 'var(--muted)',
          lineHeight: 1.7,
          padding: 'var(--pad-normal)',
          background: 'var(--input-bg)',
          borderRadius: 'var(--r-sm)'
        }}>
          وقتی این آستانه‌ها رد شوند، هشدار خودکار ایجاد می‌شود.
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
        </Grid2>

        <Grid2>
          <LocalNumField
            label="انحراف دما"
            hint="°C"
            value={th.tempDeviation}
            onChange={n => s.updateSection('thresholds', { tempDeviation: n })}
            unit="°C"
            min={0}
            max={30}
          />
          <LocalNumField
            label="انحراف رطوبت"
            hint="٪"
            value={th.humidityDeviation}
            onChange={n => s.updateSection('thresholds', { humidityDeviation: n })}
            unit="٪"
            min={0}
            max={100}
          />
        </Grid2>

        <Grid2>
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
        </Grid2>

        <Grid2>
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
            humidityDeviation: 10
          })}
        >
          🔄 بازنشانی به پیش‌فرض
        </Btn>
      
        <SubSection label="یادآور سرسید" icon="⏰" />
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', padding: '0 4px 8px', lineHeight: 1.7 }}>
            قبل از رسیدن سرسید فاکتورهای پرداخت‌نشده، هشدار نمایش داده می‌شود.
          </div>
          <Grid2>
            <ToggleRow
              label="۷ روز قبل"
              sub="یادآوری زودهنگام"
              value={(s.dueDateReminders || []).includes(7)}
              onChange={() => {
                const cur = s.dueDateReminders || [7, 3, 1];
                const next = cur.includes(7) ? cur.filter((x) => x !== 7) : [...cur, 7].sort((a: number, b: number) => b - a);
                s.update({ dueDateReminders: next });
              }}
            />
            <ToggleRow
              label="۳ روز قبل"
              sub="یادآوری میانی"
              value={(s.dueDateReminders || []).includes(3)}
              onChange={() => {
                const cur = s.dueDateReminders || [7, 3, 1];
                const next = cur.includes(3) ? cur.filter((x) => x !== 3) : [...cur, 3].sort((a: number, b: number) => b - a);
                s.update({ dueDateReminders: next });
              }}
            />
            <ToggleRow
              label="۱ روز قبل"
              sub="یادآوری نزدیک"
              value={(s.dueDateReminders || []).includes(1)}
              onChange={() => {
                const cur = s.dueDateReminders || [7, 3, 1];
                const next = cur.includes(1) ? cur.filter((x) => x !== 1) : [...cur, 1].sort((a: number, b: number) => b - a);
                s.update({ dueDateReminders: next });
              }}
            />
            <ToggleRow
              label="روز سرسید"
              sub="در روز پرداخت"
              value={(s.dueDateReminders || []).includes(0)}
              onChange={() => {
                const cur = s.dueDateReminders || [7, 3, 1];
                const next = cur.includes(0) ? cur.filter((x) => x !== 0) : [...cur, 0].sort((a: number, b: number) => b - a);
                s.update({ dueDateReminders: next });
              }}
            />
          </Grid2>
        </SettingsGroup>

    </div>
  );
}
