import { useState } from 'react';
import { useSet } from './store';
import { Field, Grid2, Grid3, Input, NumField, PhoneField, DigitField, Select } from '../../shr/components/ui';
import { toFa } from '../../shr/utils/fa';
import SettingsGroup from './SettingsGroup';
import { ToggleRow } from './helpers';

export default function ProfileTab() {
  const { user, farm, bank, units, defaults, security, updateSection } = useSet();

  const U = (k: string, label: string, opts: [string, string][]) => (
    <Field label={label}>
      <Select value={(units as any)[k]} onChange={e => updateSection('units', { [k]: e.target.value } as any)}>
        {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </Select>
    </Field>
  );

  const userSummary = user.name || 'نام وارد نشده';
  const farmSummary = farm.name || 'نام مرغداری وارد نشده';
  const bankSummary = bank.bankName ? `بانک ${bank.bankName}` : 'اطلاعات بانکی خالی';
  const unitSummary = units.currency === 'toman' ? 'تومان · متر · کیلوگرم' : 'ریال · متر · کیلوگرم';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>

      <SettingsGroup icon="👤" title="پروفایل کاربر" subtitle={userSummary} defaultOpen={!user.name} tone="accent">
        <Field label="نام و نام خانوادگی">
          <Input value={user.name} onChange={e => updateSection('user', { name: e.target.value })} placeholder="نام شما" />
        </Field>
        <Grid2>
          <Field label="شماره تماس">
            <PhoneField value={user.phone} onChange={e => updateSection('user', { phone: e.target.value })} placeholder="۰۹..." />
          </Field>
          <Field label="ایمیل">
            <Input placeholder="example@domain.com" value={user.email} onChange={e => updateSection('user', { email: e.target.value })} dir="ltr" />
          </Field>
        </Grid2>
        <Field label="نقش">
          <Select value={user.role} onChange={e => updateSection('user', { role: e.target.value })}>
            <option value="owner">مالک</option>
            <option value="manager">مدیر</option>
            <option value="worker">کارگر</option>
          </Select>
        </Field>
      </SettingsGroup>

      <SettingsGroup icon="🏠" title="اطلاعات مرغداری" subtitle={farmSummary} defaultOpen={!farm.name} tone="info">
        <Field label="نام مرغداری">
          <Input value={farm.name} onChange={e => updateSection('farm', { name: e.target.value })} placeholder="مثلاً: مرغداری سبز دشت" />
        </Field>
        <Grid2>
          <Field label="نوع مرغداری">
            <Select value={farm.type} onChange={e => updateSection('farm', { type: e.target.value })}>
              <option value="layer">تخم‌گذار</option>
              <option value="broiler">گوشتی</option>
              <option value="breeder">مادر</option>
              <option value="hatchery">جوجه‌کشی</option>
              <option value="mixed">مخلوط</option>
            </Select>
          </Field>
          <Field label="شماره پروانه">
            <Input placeholder="مثلاً: ۰۰۱" value={farm.licenseNo} onChange={e => updateSection('farm', { licenseNo: e.target.value })} dir="ltr" />
          </Field>
        </Grid2>
        <Grid3>
          <Field label="استان">
            <Input value={farm.province} onChange={e => updateSection('farm', { province: e.target.value })} />
          </Field>
          <Field label="شهر">
            <Input value={farm.city} onChange={e => updateSection('farm', { city: e.target.value })} />
          </Field>
          <Field label="کد پستی">
            <DigitField placeholder="۱۲۳۴۵۶۷۸۹۰" maxLength={10} value={farm.postalCode} onChange={e => updateSection('farm', { postalCode: e.target.value })} />
          </Field>
        </Grid3>
        <Field label="آدرس">
          <Input value={farm.address} onChange={e => updateSection('farm', { address: e.target.value })} placeholder="آدرس کامل" />
        </Field>
        <Grid2>
          <Field label="تلفن ثابت">
            <PhoneField value={farm.phone} onChange={e => updateSection('farm', { phone: e.target.value })} />
          </Field>
          <Field label="تاریخ تأسیس">
            <Input value={farm.establishedAt} onChange={e => updateSection('farm', { establishedAt: e.target.value })} placeholder="۱۴۰۰/۰۱/۰۱" />
          </Field>
        </Grid2>
      </SettingsGroup>

      <SettingsGroup icon="🏦" title="اطلاعات بانکی" subtitle={bankSummary} tone="purple">
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', lineHeight: 1.7, padding: 'var(--pad-normal)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>
          این اطلاعات در فاکتورهای چاپی نمایش داده می‌شود
        </div>
        <Field label="نام بانک">
          <Input value={bank.bankName} onChange={e => updateSection('bank', { bankName: e.target.value })} placeholder="مثلاً: ملت" />
        </Field>
        <Field label="شماره کارت">
          <DigitField maxLength={16} value={bank.cardNo} onChange={e => updateSection('bank', { cardNo: e.target.value })} placeholder="۶۰۳۷..." />
        </Field>
        <Field label="شماره شبا">
          <Input value={bank.sheba} onChange={e => updateSection('bank', { sheba: e.target.value })} dir="ltr" placeholder="IR..." />
        </Field>
        <Field label="صاحب حساب">
          <Input placeholder="مثلاً: علی رضایی" value={bank.accountHolder} onChange={e => updateSection('bank', { accountHolder: e.target.value })} />
        </Field>
      </SettingsGroup>

      <SettingsGroup icon="📏" title="استانداردها و واحدها" subtitle={unitSummary} tone="warn">
        <Grid2>
          {U('currency', 'واحد پول', [['toman', 'تومان'], ['rial', 'ریال']])}
          {U('length', 'واحد طول', [['m', 'متر'], ['cm', 'سانتی‌متر']])}
        </Grid2>
        <Grid2>
          {U('weight', 'واحد وزن', [['g', 'گرم'], ['kg', 'کیلوگرم'], ['t', 'تن']])}
          {U('volume', 'واحد حجم', [['ml', 'میلی‌لیتر'], ['L', 'لیتر']])}
        </Grid2>
        <Grid2>
          {U('temperature', 'واحد دما', [['c', 'سلسیوس'], ['f', 'فارنهایت']])}
          {U('area', 'واحد مساحت', [['m2', 'متر مربع'], ['ha', 'هکتار']])}
        </Grid2>
        <Grid2>
          {U('dateFormat', 'فرمت تاریخ', [['jalali', 'شمسی'], ['gregorian', 'میلادی']])}
          {U('numberFormat', 'فرمت عدد', [['fa', 'فارسی (۱۲۳)'], ['en', 'لاتین (123)']])}
        </Grid2>
        <Grid2>
          {U('thousandSep', 'جداکننده هزار', [['،', '،'], [',', ','], ['.', '.']])}
          {U('decimals', 'دقت اعشار', [['0', '۰ رقم'], ['1', '۱ رقم'], ['2', '۲ رقم'], ['3', '۳ رقم']])}
        </Grid2>
      </SettingsGroup>

      <SettingsGroup icon="🐔" title="پیش‌فرض‌های کشاورزی" subtitle={`Setter ${toFa(defaults.setterTemp)}° · Hatcher ${toFa(defaults.hatcherTemp)}°`} tone="accent">
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', lineHeight: 1.7, padding: 'var(--pad-normal)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>
          این مقادیر در فرم‌های جدید پیش‌فرض می‌شوند
        </div>
        <Grid2>
          <Field label="نوع پرنده پیش‌فرض">
            <Input value={defaults.birdType} onChange={e => updateSection('defaults', { birdType: e.target.value })} placeholder="مرغ" />
          </Field>
          <Field label="اندازه‌ی گله">
            <NumField value={defaults.flockSize} onChange={e => updateSection('defaults', { flockSize: e.target.value })} min={0} unit="پرنده" />
          </Field>
        </Grid2>
        <Field label="طول دوره‌ی جوجه‌کشی">
          <NumField placeholder="مثلاً: ۳" value={defaults.hatchDays} onChange={e => updateSection('defaults', { hatchDays: e.target.value })} unit="روز" min={1} />
        </Field>
        <Grid2>
          <Field label="دمای Setter"><NumField value={defaults.setterTemp} onChange={e => updateSection('defaults', { setterTemp: e.target.value })} unit="°C" min={-10} /></Field>
          <Field label="دمای Hatcher"><NumField value={defaults.hatcherTemp} onChange={e => updateSection('defaults', { hatcherTemp: e.target.value })} unit="°C" min={-10} /></Field>
        </Grid2>
        <Grid2>
          <Field label="رطوبت Setter"><NumField value={defaults.setterHumidity} onChange={e => updateSection('defaults', { setterHumidity: e.target.value })} unit="٪" min={-10} /></Field>
          <Field label="رطوبت Hatcher"><NumField value={defaults.hatcherHumidity} onChange={e => updateSection('defaults', { hatcherHumidity: e.target.value })} unit="٪" min={0} /></Field>
        </Grid2>
        <Field label="روز شروع Lock-down">
          <NumField placeholder="مثلاً: ۷" value={defaults.lockdownDay} onChange={e => updateSection('defaults', { lockdownDay: e.target.value })} unit="روز" min={0} />
        </Field>
      </SettingsGroup>

      <SettingsGroup icon="🔒" title="امنیت" subtitle={security.pinEnabled ? 'قفل با PIN فعال' : 'قفل غیرفعال'} tone="danger">
        <ToggleRow
          label="قفل با PIN"
          sub="در ورود، رمز خواسته شود"
          value={security.pinEnabled}
          onChange={() => updateSection('security', { pinEnabled: !security.pinEnabled })}
        />
        {security.pinEnabled ? (
          <>
            <Field label="PIN چهاررقمی">
              <NumField
                value={security.pin}
                onChange={e => updateSection('security', { pin: e.target.value.replace(/[^0-9۰-۹]/g, '').slice(0, 4) })}
                placeholder="••••"
                type="password" min={0} />
            </Field>
            <Field label="قفل خودکار پس از">
              <Select value={String(security.autoLockMin)} onChange={e => updateSection('security', { autoLockMin: parseInt(e.target.value) })}>
                <option value="1">۱ دقیقه</option>
                <option value="5">۵ دقیقه</option>
                <option value="15">۱۵ دقیقه</option>
                <option value="30">۳۰ دقیقه</option>
                <option value="60">۱ ساعت</option>
                <option value="0">غیرفعال</option>
              </Select>
            </Field>
          </>
        ) : null}
      </SettingsGroup>

    </div>
  );
}
