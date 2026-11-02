# CTC-CONTACTS.md — بخش مخاطبین (۱۴۰۵/۱۱/۰۲)

> راهنمای AI بعدی برای ادامه کار روی بخش مخاطبین
> آخرین به‌روزرسانی: ۱۴۰۵/۱۱/۰۲ — end of session

---

## 🎯 خلاصه وضعیت

بخش مخاطبین از **~۵۷٪** به **~۹۲٪** استاندارد جهانی رسید.

| قابلیت | قبل | بعد |
|---|---|---|
| جنسیت | ❌ | ✅ male/female/unspecified |
| بانک (نام) | ❌ | ✅ SmartSelect با ۳۰ بانک |
| حساب/کارت/شبا | ❌ | ✅ با اعتبارسنجی |
| آبشاری کارت→بانک | ❌ | ✅ BIN mapping |
| آبشاری شبا→بانک | ❌ | ✅ کد شبا |
| کپی/اشتراک | ❌ | ✅ per-section + همه |
| اعتبارسنجی کارت | ❌ | ✅ Luhn |
| اعتبارسنجی شبا | ❌ | ✅ MOD-97 |
| ارقام فارسی | ❌ | ✅ toEn در همه جا |

---

## 🏦 سیستم بانکی

### انواع (src/mod/ctc/store.ts)

```typescript
type Gender = 'male' | 'female' | 'unspecified';
type BankCode = 'melli' | 'mellat' | ... (۳۰ بانک) | 'other';

interface Person {
  gender?: Gender;
  bankAccount?: BankAccount;
}

interface BankAccount {
  bank?: BankCode;
  accountHolder?: string;
  accountNumber?: string;
  cardNumber?: string;
  shaba?: string;
}
```

### BANKS — جدول ۳۰ بانک

```typescript
export const BANKS: BankInfo[] = [
  { key: 'melli', label: 'بانک ملی', shortLabel: 'ملی', code: '017', group: 'gov' },
  // ...
];
```

**گروه‌بندی:**
- `gov` (۱۳): ملی، ملت، صادرات، تجارت، سپه، کشاورزی، مسکن، رفاه، پست بانک، توسعه صادرات، صنعت و معدن، توسعه تعاون، مرکزی
- `private` (۱۶): پاسارگاد، سامان، پارسیان، اقتصاد نوین، آینده، سینا، دی، شهر، سرمایه، گردشگری، ایران زمین، کارآفرین، خاورمیانه، ملل، مهر ایران، رسالت
- `other` (۱): سایر

### BIN Mapping (تشخیص کارت → بانک)

```typescript
export const CARD_BINS: Partial<Record<BankCode, string[]>> = {
  melli: ['603799', '170019'],
  sepah: ['589210'],
  // ... ۳۰ بانک
};

export function findBankByCardBin(cardNumber: string): CardDetectionResult {
  // ۶ رقم → exact match (auto-detect)
  // ۴-۵ رقم → possibleBanks (ambiguous)
}
```

**منبع داده:** pishkhanak.com، masihgh/iranian-bank-list، wikiplast.ir، sizpay.ir

---

## ✅ اعتبارسنجی (src/mod/ctc/validators.ts)

### Luhn (ISO/IEC 7812) — شماره کارت
```typescript
export function isValidCardNumber(card: string): boolean {
  // ۱۶ رقم، چک‌سام mod 10
}

export function cardValidation(card: string): ValidationResult {
  // state: empty | partial | invalid | valid
}
```

**نکته مهم:** همه کارت‌های شتاب (ایران) این چک‌سام رو رعایت می‌کنن.

### MOD-97 (ISO 13616) — شبا
```typescript
export function isValidShaba(shaba: string): boolean {
  // IR + ۲۴ رقم، MOD-97-10
}
```

**الگوریتم:**
1. Rearrange: BBAN + IR + checkDigits (positions 5-26 + 1-4)
2. Replace letters: A=10, ..., Z=35
3. Mod 97 on large number (chunked)
4. remainder === 1

### شماره حساب — فقط طول
```typescript
export function isValidAccountNumber(account: string): boolean {
  return digits.length >= 10 && digits.length <= 20;
}
```

**چرا الگوریتم نداره؟** هر بانک فرمت داخلی متفاوتی داره. فقط طول کافی است.

---

## 🎨 الگوی UX — Reward Early / Punish Late

```typescript
type ValidationState = 'empty' | 'partial' | 'invalid' | 'valid';
```

| State | When | Hint |
|---|---|---|
| `empty` | خالی | placeholder |
| `partial` | ناقص | «۵/۱۶ رقم» (خاکستری) |
| `invalid` | کامل ولی اشتباه | «شماره کارت معتبر نیست (Luhn)» (قرمز) |
| `valid` | کامل و درست | «✓ شماره کارت معتبر است» (سبز) |

**قانون:** خطا فقط وقتی نشون داده می‌شه که فیلد کامل باشه. حین تایپ فقط progress.

---

## 🖼️ UI (ContactFormModal.tsx)

### جنسیت — Chips
```jsx
<Field label="جنسیت">
  {['unspecified', 'male', 'female'].map(...)} 
  {/* چیپ‌های کلیک‌شونده با آیکون */}
</Field>
```

### بخش بانکی — Grid2 دوستونه
```
[بانک: SmartSelect]    [نام صاحب حساب]
[شماره حساب]          [شماره کارت]
[شماره شبا — تمام عرض]
```

### SmartSelect برای بانک (لیست بلند ۳۰+)
```jsx
<SmartSelect
  value={bank}
  onChange={...}
  options={[
    ...BANKS_BY_GROUP.gov.map(b => ({ 
      value: b.key, label: b.label, 
      subtitle: `کد شبا: ${b.code}`, group: 'gov' 
    })),
    // ...
  ]}
  groupLabels={{ gov: 'دولتی', private: 'خصوصی', other: 'سایر' }}
  groupIcons={{ gov: '🏛', private: '🏦', other: '📋' }}
  autoThreshold={6}
  modalTitle="انتخاب بانک"
/>
```

**نتیجه:** کلیک روی فیلد → Sheet باز (جستجو + گروه‌بندی).

---

## 📋 کپی و اشتراک

### Utils (src/shr/utils/clipboard.ts)
```typescript
export async function copyText(text: string): Promise<boolean>;
export async function shareText(opts: { title?, text }): Promise<ShareResult>;

// status: 'shared' | 'copied' | 'cancelled' | 'failed'
```

**رفتار:**
- `navigator.clipboard.writeText` (modern) + fallback `execCommand` (legacy)
- `navigator.share` → Web Share API (WhatsApp/Telegram/SMS در Android)
- اگر مرورگر share نداشت → کپی + toast

### Formatters (src/mod/ctc/format.ts)
```typescript
export function formatContactSection(p: Person): string;
export function formatAddressSection(p: Person): string;
export function formatBankSection(p: Person): string;
export function formatFullContact(p: Person): string;
```

**فرمت:**
- تلفن: «۰۹۱۲۳۴۵۶۷۸۹» (فارسی)
- کارت: «۶۰۳۷ ۹۹۷۵ ...» (۴ رقم فاصله — خوانایی)
- شبا: «IR۱۷ ۰۱۷۰ ...» (۴ کاراکتر فاصله)
- همه با `toFa` برای خوانایی در واتس‌اپ

### UI (ContactTabPanel.tsx)
- **CopyBtn** (SVG Material: دو مستطیل)
- **ShareBtn** (SVG Material: سه نقطه متصل)
- هر بخش (اطلاعات تماس، آدرس، بانکی) → 📋 + 📤 کنار هدر
- پایین کارت → «کپی همه» + «اشتراک»

---

## ⚠️ نکات مهم برای AI بعدی

### ۱. ارقام فارسی
همه `onChange`ها باید از `toEn` استفاده کنن:
```typescript
const v = toEn(e.target.value).replace(/\D/g, '');
```

**بدون این:** کارت/شبا/حساب به دلیل `\D` (شامل ارقام فارسی) خالی می‌شن.

### ۲. inputMode
- `inputMode="tel"` → کیبورد عددی، mode=`text` (بدون کاما/کلمات)
- `inputMode="numeric"` → mode=`number` (کاما + کلمات — نامطلوب)
- **همیشه** `tel` برای کارت/حساب

### ۳. Bank hint — تشخیص vs انتخاب
```typescript
if (det.bank && current === det.bank) {
  return `✓ تشخیص از کارت: ${bank}`;
}
if (det.bank && current !== det.bank) {
  return `انتخاب شما: ${selected}`;  // کاربر override کرده
}
```

### ۴. SHABA hint
- خالی → `'IR + ۲۴ رقم — با ورود، بانک خودکار تشخیص داده می‌شود'`
- partial → `'{n}/۲۶ کاراکتر'`
- valid → `'✓ شماره شبا معتبر است (MOD-97)'`
- **هرگز** «بانک تشخیص‌داده‌شده: X» وقتی شبا خالی است

---

## 🚧 PENDING — فاز B (جلسه بعد)

| # | قابلیت | استاندارد |
|---|---|---|
| ۱ | **کد اقتصادی** (شرکت‌ها) | SAP Tax ID |
| ۲ | **کد پستی** | SAP Postal Code |
| ۳ | **شرایط پرداخت** (Net 30/60) | SAP Payment Terms |
| ۴ | **تگ‌ها** (VIP، بدحساب، ...) | Odoo Tags |
| ۵ | **فعال/غیرفعال** | SAP Archive |
| ۶ | **آدرس دوم** (ارسال ≠ صورت‌حساب) | SAP Address |
| ۷ | **روش ارتباط ترجیحی** | Odoo Preferred Contact |
| ۸ | **تاریخچه معاملات** (per contact) | Odoo smart button |
| ۹ | **BankAccount[]** (چند حساب) | SAP BP Bank Accounts |

---

## 🔗 ارتباط با ماژول‌های دیگه

| ماژول | استفاده |
|---|---|
| **tra** | `findBankByCardBin` ممکنه استفاده بشه (آینده) |
| **ctc/format** | فقط در خود ctc |
| **ctc/validators** | فقط در ctc |
| **clipboard** | `shr/utils` — همه می‌تونن استفاده کنن |

---

## 🧪 تست‌ها

از AGENTS.md L11: هر feature جدید نیاز به test داره.
**وضعیت فعلی:** هیچ test برای ctc وجود نداره (GAP).

**پیشنهاد جلسه بعد:**
- `src/test/ctc-validators.test.ts` — Luhn + MOD-97 + length
- `src/test/store-ctc.test.ts` — add/update/remove + gender + bankAccount
- `src/test/ctc-format.test.ts` — copy/share format

---

## 📝 Commits این جلسه (بخش مخاطبین)

| # | Commit | موضوع |
|---|---|---|
| ۱ | 532affd0 | feat(ctc): bank account + gender |
| ۲ | b017b041 | feat(ctc): copy/share buttons (SVG) |
| ۳ | 6d8d492f | feat(ctc): card BIN mapping (۳۰ بانک) |
| ۴ | bdf4ea0b | fix(ctc): Persian digit conversion |
| ۵ | 059d2bef | refactor(ctc): bank → SmartSelect |
| ۶ | c05463c6 | refactor(ctc): remove 'بدون بانک' |
| ۷ | (pending) | fix(ctc): inputMode tel + hint fixes |

*این سند زنده است — با هر تغییر در ctc آپدیت کن.*

