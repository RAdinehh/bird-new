# Bird-new

PWA مدیریت مرغداری برای پرورش نژادهای بومی و تجاری ایران.

## نصب و اجرا

git clone https://github.com/RAdinehh/bird-new.git
cd bird-new
npm install
npm run dev -- --host 0.0.0.0 --port 3000

## دستورات

npm run dev       — اجرا روی localhost:3000
npm test          — تست
npx tsc --noEmit  — چک تایپ
npm run build     — build production

## مستندات

وضعیت پروژه و نقشه راه: docs/STATUS.md

## Stack

- React 18 و TypeScript
- Vite و PWA
- Zustand برای state
- Zod برای validation
- date-fns-jalali برای تاریخ شمسی
- Vitest برای تست

## لایسنس

Private
