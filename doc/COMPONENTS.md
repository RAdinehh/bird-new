# COMPONENTS.md — API کامپوننت‌های مشترک

نسخه 1.0 | تاریخ ۱۴۰۵/۰۷/۰۷ | مرجع STANDARDS.md

هدف: مستندسازی API کامپوننت‌های ui.tsx و shr/components/

---

## ui.tsx — کامپوننت‌های پایه

### Btn

Props: variant, size, full, loading, icon
variants: primary | ghost | danger | outline
مثال: Btn variant=primary full → ذخیره

### BtnRow

Props: children
دو دکمه با فاصله افقی در یک ردیف

### Input

Props: unit, error, warn, mode, showWords, min, max, autoClamp
- mode: text | number
- formatNumWhileTyping وقتی number
- Enter → فیلد بعدی (EnterNavigation)
- autoClamp → محدود در تایپ
- Blur clamp → محدود پس از خروج
- showWords → عدد به حروف (>= 100000)

### Select

Props: children (option‌ها)
استایل یکسان با Input
بدون error/warn (در TECH-DEBT)

### Field

Props: label, required, hint, children
label + required star + hint + children

### Grid2 / Grid3

Props: children
شبکه ۲ ستونه / ۳ ستونه
minmax(0,1fr) برای جلوگیری از سرریز

### Card

Props: accent, onClick, children, style
نوار رنگی 4px سمت راست
accent: accent | warn | dim | purple
وضعیت: 0 بار استفاده (در TECH-DEBT برای Refactor)

### Tag

Props: tone, children
11 tone: green | amber | red | blue | gray | purple | accent | warn | danger | info | dim

### Empty

Props: icon, title, desc, action, tone
tone: accent | warn | info | danger
role=status + aria-hidden برای آیکون

### Modal

Props: open, onClose, title, children, footer, size, preventClose
- size: sm(320) | md(480) | lg(640)
- Esc + focus trap + autoFocus
- prefers-reduced-motion پشتیبانی
- aria-modal + aria-labelledby

### PageContainer

Props: children
ظرف اصلی با padding و gap

### Chip

Props: active, onClick, children, tone
aria-pressed برای دسترس‌پذیری
tone: accent | warn | danger | info | purple

---

## shr/components/ — کامپوننت‌های تخصصی

### ExpandableCard

کارت بازشو با انیمیشن grid-template-rows
کاربرد: همه لیست‌ها (طبق STANDARDS)
25 بار استفاده

### DatePicker / TimePicker

انتخاب تاریخ/ساعت با تقویم شمسی

### SmartSelect

انتخاب‌گر هوشمند با جستجو
برای لیست‌های بیش از ۸ آیتم

### DependentSelect

فیلد وابسته (مثل breedId ← birdId)
انیمیشن 0fr→1fr با delay 80ms

### ProgressTracker / MiniProgress

نمایش پیشرفت با حلقه ۳۸px

### Charts

BarChart / DualBarChart / LineChart / PieChart
gradient یکتا، dur-* توکن‌ها

### DialogHost

مدیریت alert/confirm سراسری
showAlert + showConfirm

### Header / BottomNav / MenuDrawer

Layout اصلی
Header: ☰ 🔔 🌙/☀️ ❓
BottomNav: ۵ تب اصلی

### ErrorBoundary / ErrorFallback

مدیریت خطای React
onReset / onReload / onGoHome

### HelpBanner / HelpModal / ShortcutsModal

راهنما برای کاربر
Shortcuts: Ctrl+H, ?, Ctrl+1..9, Ctrl+F, Esc

### ItemDetailsForm

فیلدهای اختصاصی هر دسته کالا
دارو (۳ نوع)، پرنده، تخم، تجهیزات

---

## کامپوننت‌های در انتظار ساخت (فاز ۰.۹)

NumField | MoneyField | Textarea | Checkbox | Radio | PhoneField | PercentField

پایان · v1.0 · ۱۴۰۵/۰۷/۰۷
