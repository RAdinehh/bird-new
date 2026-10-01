# AI-HANDOFF.md — سند تحویل به AI جدید

> آخرین به‌روزرسانی: این جلسه

---

## 🎯 پروژه چیه؟

**Bird-new** — نرم‌افزار مدیریت مرغداری (PWA)
- مسیر: ~/Bird-new
- GitHub: https://github.com/RAdinehh/bird-new
- تکنولوژی: React + Vite + TypeScript + Zustand
- کاربر: مالک مرغداری (کدنویس نیست، فقط کپی/پیست می‌کنه)
- پلتفرم: Termux (Android)

---

## 🏗️ معماری

### ساختار ماژول‌ها:

src/mod/
- dsh — داشبورد
- brd — پرنده و نژاد (master data)
- hal — سالن‌ها (master data)
- ctc — مخاطبین (master data)
- whs — انبار (master data)
- fed — جیره‌نویسی (master data)
- flk — گله‌ها (consumer)
- inc — جوجه‌کشی (consumer)
- egg — تخم‌ها (consumer)
- dlg — ثبت روزانه (consumer)
- tra — معاملات (consumer)
- rep — گزارش‌ها
- alt — هشدارها
- cal — تقویم
- set — تنظیمات

### زیرساخت مشترک:

src/cor/ui/
- useUndo.ts — hook undo
- UndoBar.tsx — کامپوننت نوار undo
- a11y.ts — helper های A11y
- useConfirm.ts — confirm helper
- index.ts — export

src/cor/logger/
- logger.ts — error logger
- auditLog.ts — activity logger

src/cor/store/
- dialog.ts — showAlert / showConfirmAsync
- toast.ts — showToast
- theme.ts — wrapper روی useSet

---

## 📊 چیزهایی که در این جلسه انجام شد

### ✅ Undo/Confirm/Toast در همه ماژول‌ها
- dlg، flk، egg، whs، tra، brd، hal، fed، alt، ctc، inc
- الگو: state undoData + handler undoDelete + UndoBar
- confirm قبل از حذف
- toast بعد از save/delete

### ✅ Semantic Colors
- حذف همه --info (تغییر به accent/warn/muted)
- مطابق Material 3

### ✅ Performance (Lookup Maps)
- _birdsById، _contactsById، _devicesById، _entriesById
- _candlingsByEntry، _latestCandByEntry
- useMemo + caching

### ✅ تنظیمات غیرفعال
- printPaper — فعال شد (A4/A5 در printTemplate)
- auditLog — ساخته شد (module + UI + delete logs)
- encryption — skip (نیاز نیست)

### ✅ UI/UX
- حذف پرش فونت/تم/viewport
- autoToday همه DatePicker
- Modal z-index dynamic
- LogsTab با ۲ تب (فعالیت + خطاها)

### ✅ Screen Flash (FOUC)
- inline script در head برای اعمال تم قبل از render
- preconnect/preload برای Vazirmatn
- applyTheme قبل از ReactDOM.createRoot

---

## 📋 چیزهایی که باقی مونده

### 🔴 فاز ۱: پایه (Master Data) — ۳-۴ ساعت
- brd (پرنده/نژاد): چک + Sort + Form order
- hal (سالن/تجهیزات): چک + Sort + Form order
- ctc (مخاطبین): چک + Sort + Form order
- whs (انبار): چک + Sort + Form order
- fed (جیره): چک + Sort + Form order

### 🔴 فاز ۲: Cross-Module (وابستگی) — ۲ ساعت
- FlocksPage: از ctc نمی‌خونه (فروشنده دستی تایپ)
- DealsPage: از whs، brd نمی‌خونه
- InvoicePage: از brd، flk نمی‌خونه

### 🔴 فاز ۳: UX پایه — ۲ ساعت
- Sort در همه لیست‌ها
- Group در همه لیست‌ها
- Filter گسترش
- Pagination برای dlg (۱۰۰۰۰+ رکورد)

### 🟡 فاز ۴: Navigate & Return — ۱.۵ ساعت
- کامپوننت QuickCreateLink
- کاربر از فرم A → ماژول B → ذخیره → برگرده به A با انتخاب اعمال شده
- رفتار لغو: برگرده به فرم اصلی بدون انتخاب

### 🟡 فاز ۵: Polish — بعد
- Bulk Actions
- Tag/Label
- Custom Views
- Export پیشرفته
- Global Search

---

## 📐 استانداردها و اسناد

### doc/UI-RULES.md
- ۸ اصل بنیادین
- Typography/Spacing/Color tokens

### doc/MODULE-AUDIT.md — چک‌لیست ۷ فاز
- فاز ۱: Functionality (۱۵)
- فاز ۲: UX (۲۰)
- فاز ۳: UI (۲۰)
- فاز ۴: A11y (۱۵)
- فاز ۵: Performance (۱۰)
- فاز ۶: Integration (۱۰)
- فاز ۷: Senior Review (۱۰)
- قبولی: ۹۰+

### doc/FORM-RULES.md — ۳۰ قاعده فرم

### doc/MAZULE-ANALYSIS.md — تحلیل ۱۴ ماژول

---

## 🎨 قواعد کلیدی (که باید حفظ شن)

### ۱. Undo Pattern:

const [undoData, setUndoData] = useState<{ item: any } | null>(null);

const undoDelete = () => {
  const item = undoData;
  if (!item) return;
  try {
    addXxx(item.item);
    showToast('بازگردانی شد', 'success', 2000);
  } catch (err) {
    showToast('بازگردانی ناموفق', 'error', 2000);
  }
  setUndoData(null);
};

### ۲. Color Semantics:
- --accent: برند، در حال انجام، موفق
- --warn: توجه، نزدیک بحران
- --danger: خطر، خطا، حذف
- --muted: خنثی، راهنما
- --info: ممنوع (به‌جاش accent/muted)
- --purple: خاص، جشن

### ۳. Touch Target:
- همه interactive ≥ ۴۴px

### ۴. RTL:
- right: 6 (نه left)
- dir=ltr روی اعداد

### ۵. Form Order:
- Transactional: منبع → طرف → زمان → محتوا → مالی → یادداشت
- Entity: هویت → مشخصات → مکان → ترکیب → تاریخ → مالی → یادداشت

---

## 🔧 قواعد کار با Termux

### قاعده ۱: قبل از تغییر، git tag
git tag -f before-<name>

### قاعده ۲: اسکریپت پایتون
- python3 << 'PYEOF' (نه -c)
- backup در حافظه
- rollback خودکار اگه build fail

### قاعده ۳: تست
npm run build 2>&1 | tail -5

### قاعده ۴: commit
git add -A && git commit -m '...' && git push

---

## ⚠️ مشکلات شناخته‌شده Termux

### ۱. /tmp وجود نداره
- از ~/ استفاده کن

### ۲. heredoc طولانی
- با cat > file << 'EOF' یا پایتون

### ۳. ! تو bash
- history expansion → از فایل استفاده کن

### ۴. Vite cache
- pkill -f vite && npm run dev

### ۵. PWA cache
- کاربر hard refresh کنه

---

## 🎯 ترتیب کار (تصمیم Senior)

از پایه به شاخه:

1. Master Data (brd، hal، ctc، whs، fed)
2. Cross-Module (FlocksPage، DealsPage، ...)
3. UX پایه (Sort، Group، Filter)
4. UX پیشرفته (Navigate & Return)
5. Polish (Bulk، Tag، Views)

دلیل: اگه پایه خراب باشه، همه چیز خرابه.

---

## 🎯 نکته نهایی

کاربر کدنویس نیست. فقط کپی/پیست می‌کنه.

پس:
- اسکریپت‌ها کامل و بدون خطا باشن
- rollback خودکار داشته باشن
- گزارش واضح بدن

قاعده طلایی: پیش‌نمایش بده، تأیید بگیر، اجرا کن.

این سند زنده‌ست. با هر تغییر مهم، به‌روزش کن.
