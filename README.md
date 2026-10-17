# 🐔 Bird-new — مدیریت مرغداری

PWA جامع مدیریت مزرعه طیور — آفلاین، فارسی، RTL

## 📖 مستندات

| سند | نقش |
|---|---|
| [HANDOFF](docs/HANDOFF.md) | وضعیت فعلی + برنامه |
| [ARCHITECTURE](docs/ARCHITECTURE.md) | نقشه فایل‌ها + وابستگی |
| [FOUNDATION](docs/FOUNDATION.md) | قوانین آهنین (۱۳ بخش) |
| [FOUNDATION-PATTERNS](docs/FOUNDATION-PATTERNS.md) | الگوهای تفکر (۲۸ بخش) |
| [EVENT-BUS](docs/EVENT-BUS.md) | قرارداد Event Bus |
| [AI-RULES](docs/AI-RULES.md) | قوانین کار AI |
| [STANDARDS](docs/STANDARDS.md) | UI/UX + A11y |
| [STATUS](docs/STATUS.md) | تاریخچه + Roadmap |
| [AUDIT](docs/AUDIT.md) | چک‌لیست ۷ محوره |
| [TYPE-REGISTRY](docs/TYPE-REGISTRY.md) | جدول تایپ‌ها |
| [UX-FORM-RULES](docs/UX-FORM-RULES.md) | ۷۰ دستور UX فرم |

## 🚀 شروع سریع

~~~
npm install
npm run dev -- --host 0.0.0.0 --port 3000
~~~

## 🧪 تست

~~~
npm test -- --run       # ۱۰۶۸ تست
npx tsc --noEmit        # چک تایپ (۰ خطا)
npm run build           # build
~~~

## 📱 APK

هر `git push` → APK جدید در [Actions](https://github.com/RAdinehh/bird-new/actions)

## 📊 وضعیت (جلسه ۱۲)

- **۱۸ ماژول** · **۳۲۰+ فایل** TS/TSX
- **tsc: ۰ خطا** ✅
- **تست: ۱۰۶۸ pass** ✅
- **۱۴ Zustand Store** persist
- **Event Bus: ۲/۱۸ فعال** ⚠️
- **any: ~۷۱۰ مورد** ⚠️
- **۱۷ فایل > ۴۰۰ خط** ⚠️

## 🎯 ماژول‌ها

`set` · `brd` · `hal` · `flk` · `dlg` · `inc` · `egg` · `fed` · `whs` · `tra` · `ctc` · `alt` · `cal` · `rep` · `dsh` · `doc` · `arc`

## 🏛️ استانداردها

- Apple Human Interface Guidelines
- Material Design 3
- WCAG 2.1 AA
- ISO/IEC 25010
- INSO (ایران)

---

**هدف:** نرم‌افزار سطح اپل/گوگل برای مدیریت مرغداری. 🚀
