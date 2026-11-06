# 🎨 DESIGN-CONSISTENCY — قاعده طلایی طراحی

> **قانون آهنین:** قبل از هر UI جدید (Modal، Accordion، Error، Badge، Field)، این چک‌لیست اجرا شود.

---

## 🧱 ۱. کامپوننت‌های پایه (L10 — قفل‌شده)

**هرگز از صفر نساز:**

| کامپوننت | مسیر | برای |
|---|---|---|
| Modal | `shr/components/ui/Modal.tsx` | همه modalها |
| Field | `shr/components/ui` | wrapper فیلد با label/error/hint |
| Input | `shr/components/ui/Input.tsx` | همه inputها |
| MoneyField, NumField, PercentField | از `shr/components/ui` | فیلدهای تخصصی |
| Select, SmartSelect, DependentSelect | از `shr/components/ui` | انتخاب‌ها |
| DatePicker | `shr/components/DatePicker.tsx` | تاریخ |
| Btn, BtnRow | `shr/components/ui` | دکمه‌ها |
| ExpandableCard | `shr/components/ExpandableCard.tsx` | کارت‌های بازشو |
| HelpIcon | `shr/components/ui/HelpIcon.tsx` | علامت سؤال |
| ErrorBox | `shr/components/ui/ErrorBox.tsx` | خطای فرم |
| toastMsg | `cor/store/toast.ts` | پیام موفق/خطا |
| showConfirmAsync | `cor/store/dialog.ts` | کانفرم |

**قانون:** اگر کامپوننت مشابه وجود دارد → استفاده کن. اگر ندارد → **اول بپرس، بعد بساز**.

---

## 🎨 ۲. رنگ‌ها

| متغیر | استفاده |
|---|---|
| `var(--accent)` | مثبت، موفق |
| `var(--danger)` | منفی، خطا، تلفات |
| `var(--warn)` | هشدار |
| `var(--info)` | اطلاعاتی |
| `var(--muted)` | label، متن کم‌رنگ |
| `var(--dim)` | متن خیلی کم‌رنگ |
| `var(--text)` | متن اصلی |
| `var(--border)` | border |
| `var(--input-bg)` | پس‌زمینه فیلد |
| `var(--card)` | کارت |
| `var(--accent-soft)` | accent ملایم |
| `var(--danger-soft)` | danger ملایم |

**هرگز رنگ hex مستقیم استفاده نکن** — همیشه از var.

---

## 📐 ۳. سایز و فونت

| متغیر | استفاده |
|---|---|
| `var(--fs-2xs)` | متن ریز خیلی کم‌اهمیت |
| `var(--fs-xs)` | label، متن فرعی |
| `var(--fs-sm)` | متن معمولی |
| `var(--fs-base)` | عنوان کوچک |
| `var(--fs-md)` | عدد بزرگ |
| `var(--fs-lg)` | عنوان |
| `var(--pad-tight)` | padding فیلد |
| `var(--pad-normal)` | padding معمولی |
| `var(--sp-1)` | فاصله بین عناصر |
| `var(--sp-2)` | فاصله بیشتر |
| `var(--sp-3)` | فاصله بخش |
| `var(--r-sm)` | radius فیلد |
| `var(--r-md)` | radius modal |
| `var(--r-lg)` | radius کارت |

**fontWeight:** ۶۰۰ label، ۷۰۰ عنوان، ۸۰۰ فقط عدد highlight.

---

## 🏗️ ۴. چیدمان

### Modal
```
<Modal open onClose title size footer>
  content
</Modal>
```
- `size`: `sm` | `md` | `lg`
- `footer`: `<BtnRow>` با دکمه‌ها
- هرگز `<div>` جایگزین `<Modal>` نساز

### Card section
```tsx
<div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>📊 عنوان</div>
<RowGrid>
  <Row l="label" v="value" />
</RowGrid>
```

### Row (استاندارد)
```tsx
<Row l="label" v={<value/>} accent />
```
- **هرگز `<div style={{display:'flex', justifyContent:'space-between'}}>` نساز**

---

## 📊 ۵. Accordion

- Accordion جدید = `<ExpandableCard>` موجود (نه اختراع)
- پیش‌فرض: **بسته**
- آیکون چرخشی: `transform: rotate(180deg)` با `transition`

---

## ⚠️ ۶. Validation / Error

| حالت | کجا | ابزار |
|---|---|---|
| Validation فرم | فقط بعد از `saveAttempted` | `<Field error={showError('f')}>` + `useFormErrors` |
| Warning inline | همیشه | `<FieldHint>` |
| Error عملیاتی | بعد از save | `<ErrorBox>` یا `toastMsg.error` |

### L4
**`showAlert` ممنوع → `showToast` / `showConfirmAsync`**

---

## 🎯 ۷. Badge

| مورد | رنگ |
|---|---|
| موفق | `var(--accent)` |
| انتظار | `var(--warn)` |
| خطا/تلفات | `var(--danger)` |
| اطلاعاتی | `var(--info)` |
| غیرفعال | `var(--muted)` |

---

## 🔢 ۸. اعداد (فارسی + جداکننده)

- نمایش: `toFa()` یا `formatNumWhileTyping()`
- input: `<Input mode="number">` (خودکار جداکننده)
- درصد: `toFa(pct) + '٪'`
- مبلغ: `toFa(n.toLocaleString('fa-IR')) + ' ت'`
- وزن: `(g/1000).toFixed(2)` → فارسی

**هرگز لاتین نمایش نده.**

---

## 🧭 ۹. ترتیب استاندارد در FlockCard

```
۱. 📅 تاریخ‌ها
۲. 💰 هزینه‌ها
۳. 📊 وضعیت / 📈 درآمد
۴. 📊 ارزش روز
۵. 📦 مصرف انبار
۶. 📝 یادداشت
```

### Modal footer
- راست: **انصراف** (outline)
- چپ: **تأیید** (primary)

---

## 🌍 ۱۰. RTL

- همه `dir="rtl"`
- اعداد در `<input>` با `dir="ltr"` اگر لازم
- `textAlign: 'right'` (پیش‌فرض)

---

## 📱 ۱۱. Responsive

- دکمه ≥ ۳۲px ارتفاع (لمس)
- فاصله ≥ ۶px بین دکمه‌ها
- فیلد ≥ ۳۸px
- `flex-wrap` در headerهای شلوغ

---

## ✅ ۱۲. CHECKLIST قبل از هر UI

- [ ] از `<Modal>` / `<Field>` / `<Row>` / `<Btn>` استفاده (نه اختراع)
- [ ] رنگ‌ها `var(--...)` (نه hex)
- [ ] فونت `var(--fs-...)`
- [ ] padding/margin `var(--pad-...)` / `var(--sp-...)`
- [ ] اعداد فارسی (`toFa`)
- [ ] جداکننده هزارگان (خودکار)
- [ ] واحد درست (`ت` / `تومان` / `ت/ک`)
- [ ] label از `<Field label>`
- [ ] validation بعد از `saveAttempted`
- [ ] `toastMsg` نه `showAlert`
- [ ] RTL درست
- [ ] تست در `build` (port 4173)

**اگر یکی رعایت نشد → rollback.**

---

## 🚨 ۱۳. ضدالگوها

| ❌ ممنوع | ✅ استفاده کن |
|---|---|
| `<div flex space-between>` | `<Row>` |
| `<div background:'#dc2626'>` | `var(--danger)` |
| `<input type="text">` دستی | `<Input>` / `<MoneyField>` |
| `showAlert` | `toastMsg` |
| `setErr('')` در Zod fail | `setErr(errs.join(' • '))` |
| `padding: 12` | `var(--pad-normal)` |
| `1.60` لاتین | `toFa('1.60')` |
| Modal دستی | `<Modal>` |
| Accordion دستی | `<ExpandableCard>` |
| `Math.max(0, ...)` silent | `throw` (invariant) |

---

## 📋 ۱۴. تعهد

هر patch که UI جدید دارد:
1. Checklist ذهنی
2. کامپوننت مشابه → استفاده
3. اگر نیست → **اول بپرس، بعد بساز**
4. commit message: «UI: consistent with existing patterns»

---

## 🎯 ۱۵. ارجاع

این سند در `docs/ROADMAP-SEXING.md` لینک شده.
هر AI بعدی، **قبل از هر UI جدید**، این را می‌خواند.
