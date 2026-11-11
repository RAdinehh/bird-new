# UI Patterns Registry — مرجع سریع الگوها

> هر AI در شروع جلسه این را بخواند. قبل از هر UI، این‌جا را چک کند.

## Page (وقتی هیچ داده‌ای نیست)
- کامپوننت: `<Empty icon title desc action />`
- الگو: `brd/BirdsPage.tsx:243`, `hal/HallsPage.tsx:346`
- action: همیشه `openNew()` محلی — **NEVER `navigate()`**

## Modal (فرم باز)
- ❌ `<Empty>` استفاده نکن (برای صفحه طراحی شده)
- ❌ `navigate()` استفاده نکن (فرم می‌بنده، داده گم می‌شه)
- ✅ hint: جعبهٔ `warn-soft` + ⚠️
- ✅ راهنما: جعبهٔ `input-bg` + 💡

## Card (نمایش ردیفی)
- بازشو: `<ExpandableCard>`
- عملیات: `<CardActions>` (تا ۶ + بیشتر)
- بج: `<Tag tone="...">`

## Form Validation
- ستاره: `required` روی `<Field>`
- خطا: `showError()` + `markTouched()`
- Placeholder: راهنما در `placeholder`

## Empty State داخل فرم (نه Page)
- جعبهٔ کوچیک با `input-bg` یا `warn-soft`
- بدون دکمهٔ navigate
- دکمهٔ «افزودن» فقط اگه لیست گزینه موجود باشه
