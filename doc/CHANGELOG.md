# CHANGELOG — تاریخچه نسخه‌ها

## [0.9.1] — ۱۴۰۵/۰۷/۰۹

### افزوده‌شده
- ✅ WarningsPage — ۴ StatBox (منقضی، تمام‌شده، نزدیک انقضا، کم موجودی)
- ✅ FilesPage — یکدست‌سازی stats با StatBox + نمایش تعداد دسته‌ها
- ✅ ReceivablesPage — ۳ StatBox (تعداد، معوق، سرسید)

### تغییر یافته
- rename `summary → stats` در ۲۱ ماژول (unified API)

---

## [0.9.0] — ۱۴۰۵/۰۷/۰۷

### افزوده‌شده
- 💾 پشتیبان خودکار (هر ۲۴ ساعت، ۵ نسخه)
- 🔄 رفرش خودکار KPI (هر ۳۰ ثانیه)
- 📊 تحلیل Pareto هزینه‌ها (۸۰/۲۰)
- 📈 Benchmark گله‌ها (فعال vs آرشیو)
- 🌿 فیلتر گیاهی در تقویم
- 💉 واکسن خودکار از قالب گله
- 📋 قالب‌های واکسن (ایران + بین‌المللی)
- ⏰ یادآور سرسید (۷/۳/۱/۰ روز)
- 🎯 OnboardingModal ۳ مرحله
- 📖 HelpBanner در ۷ ماژول کلیدی

### تغییر یافته
- Header 🔔 شمارش هوشمند (alerts + سرسید نزدیک)
- ۶ Placeholder → Redirect خودکار
- ۱۲۲ فیلد ورودی مدرن‌سازی (NumField, MoneyField, ...)
- SCHEMA.md v2.0

### رفع‌شده
- Modal autofocus (کیبورد بسته می‌شد)
- Route /ctc گم‌شده
- importهای NumField/MoneyField در ۲۵ فایل

---

## [0.8.0] — ۱۴۰۵/۰۷/۰۷

### افزوده‌شده
- ۹ کامپوننت جدید: NumField, MoneyField, PercentField, PhoneField, DigitField, Textarea, Checkbox, RadioGroup
- Header 🔔 هوشمند (alerts + سرسید نزدیک)
- OnboardingModal ۳ مرحله‌ای با انتخاب نوع فعالیت
- تنظیمات یادآور سرسید (۷/۳/۱/۰ روز)
- HelpBanner در ۷ ماژول کلیدی
- Redirect هوشمند ۶ Placeholder

### تغییر یافته
- 122 فیلد ورودی مدرن‌سازی شد
- منوی مخاطبین مستقیم به /ctc
- SCHEMA.md v2.0 (همگام با کد)

### رفع‌شده
- Modal autofocus (کیبورد بسته می‌شد)
- Route /ctc گم‌شده
- ۲۲ فایل بدون min در فیلدهای عددی

### مستندات جدید
- AUDIT-REPORT.md
- TECH-DEBT.md
- BASELINE.md
- STANDARDS.md
- COMPONENTS.md
- README.md

---

## [0.7.0] — ۱۴۰۵/۰۷/۰۷

### افزوده‌شده
- معاملات: شرایط پرداخت (نقدی/قسطی/توافقی)
- معاملات: Workflow ۴ مرحله
- معاملات: پیش‌فروش
- معاملات: سرسید + تعویق
- معاملات: تخفیف هر قلم
- معاملات: چک کامل
- معاملات: حمل قلم + فروشنده قلم
- معاملات: ItemDetailsForm
- معاملات: شماره فاکتور خودکار
- داشبورد: سرسید + چک + مالی ماه
- ReceivablesPage بازنویسی
- SmartSelect + DependentSelect
- IngredientPicker + ItemDetailsForm
- HelpBanner
- herbal.ts + chemical.ts
- 404 Route
- selectOnFocus

### تغییر یافته
- حذف کامل مالیات
- بازنویسی SalesPage (۷۲۸ → ۵۹۲)
- بازنویسی PurchasesPage (۷۵۸ → ۶۰۱)
- فرم کالا: حذف currentStock/lastPrice
- Auto-fill نام پرنده

### رفع‌شده
- ۰ alert/confirm (قبلاً ۲۲)
- undefined در InvoicePrint
- Dedupe بعد از hydrate

### حذف‌شده
- Placeholder ماژول‌ها (ادغام)
- مالیات

---

## [0.6.0] — ۱۴۰۵/۰۷/۰۵

### افزوده‌شده
- تقویم (cal)
- اسناد (doc) با IndexedDB
- ErrorBoundary + Logger
- Onboarding Banner

### رفع‌شده
- پاکسازی confirm‌ها

---

## [0.5.0] — نسخه پایه

- ۱۵ ماژول کامل
- Layout کامل
- ۱۲ کامپوننت مشترک
