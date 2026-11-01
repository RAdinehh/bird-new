# ERROR-HANDLING.md

> استاندارد مدیریت خطا | جلسه ۱۴۰۵/۱۱/۰۱

## ۴ لایه خطا

| # | نوع | روش | مثال |
|---|---|---|---|
| ۱ | Field validation | Field error={showError('x')} | «مبلغ را وارد کنید» زیر فیلد |
| ۲ | Business error | ErrorBox | «موجودی کافی نیست» |
| ۳ | Prerequisite | toastMsg.error() | «اول مخاطب بسازید» |
| ۴ | System error | toastMsg.error() | خطای network |
| ✅ | Success | toastMsg.saved() | «ذخیره شد» |

## الگو A — Field Validation

    const { errors: vErrors } = useValidation(schema, data);
    const { showError, markTouched, attemptSave } = useFormErrors(vErrors);

    const handleSave = () => {
      attemptSave();
      if (Object.keys(vErrors).length > 0) return;
      // save
    };

    Field error={showError('amount')} onTouch={() => markTouched('amount')}

## الگو B — Business Error

    const [err, setErr] = useState('');
    if (duplicate) { setErr('نام تکراری'); return; }
    {err && ErrorBox(err)}

## الگو C — Prerequisite

    if (contacts.length === 0) { toastMsg.error('اول مخاطب بسازید'); return; }

## الگو D — System Error

    try { ... } catch (e) { toastMsg.error(e?.message || 'خطای غیرمنتظره'); }

## پیام‌های استاندارد (MSG helper)

مرجع: src/shr/validation/errorMessages.ts

| کاربرد | MSG |
|---|---|
| فیلد خالی | MSG.required('نام') |
| انتخاب | MSG.select('شریک') |
| عدد مثبت | MSG.positiveNumber('تعداد') |
| عدد منفی | MSG.nonNegativeNumber('قیمت') |

**ممنوع:** متن دستی مثل «شریک اجباری است» → باید MSG.select('شریک') باشه

## Anti-Patterns

| اشتباه | درست |
|---|---|
| toastMsg.error('مبلغ را وارد کنید') | Field error={showError('amount')} |
| ErrorBox با vErrors.amount | Field error={showError('amount')} |
| setErr('شریک اجباری است') | setErr(MSG.select('شریک')) |

## چک‌لیست commit

- [ ] هیچ toastMsg.error برای validation؟
- [ ] هر setErr یک ErrorBox دارد؟
- [ ] هر Field از showError('x') می‌خونه؟
- [ ] attemptSave() قبل از return؟
- [ ] onTouch={() => markTouched('x')} روی Fieldها؟
- [ ] متن‌ها از MSG (نه دستی)؟

## تاریخچه هماهنگ‌سازی

| تاریخ | تغییر | commit |
|---|---|---|
| ۱۴۰۵/۱۱/۰۱ | حذف toast.validation از Deal/MultiPay | 91441d2c |
| ۱۴۰۵/۱۱/۰۱ | GroupsPage → setErr+ErrorBox | 45d94ff5 |
| ۱۴۰۵/۱۱/۰۱ | HallEquipSection → err prop | 31322e1f |
| ۱۴۰۵/۱۱/۰۱ | DevicesPage → err prop | 35ecc896 |
| ۱۴۰۵/۱۱/۰۱ | HatchesPage → err prop | 39d4fc6f |
| ۱۴۰۵/۱۱/۰۱ | useEggEntriesForm → rowErr+MSG | c563a8f0 + 72a1fa88 |

## منابع

- NN/g: Error messages next to field
- Material 3: Text fields with supporting error text
- Fluent 2: Inline validation with delayed feedback
