# FORM-RULES.md — 30 قاعده فرم‌سازی

## 1. ترتیب فیلدها
- کلیدی‌ترین انتخاب اول
- زمان بعد از منبع
- محتوا بعد از زمان
- مالی بعد از محتوا
- یادداشت آخر

## 2. Auto-fill
- تاریخ: امروز | ساعت: الان
- واحد: پیش‌فرض
- محاسباتی خودکار

## 3. Save Behavior
- فرم خالی + بستن = هشدار
- نیمه‌پر = Draft auto-save
- ویرایش = لغو تغییرات اگه بست
- بعد save = بازگشت + toast

## 4. Field States
- Empty/Filled/Auto/ReadOnly/Error/Warn/Disabled

## 5. Validation
- Inline، بعد blur، پیام واضح

## 6. Auto-save Draft
- هر 30s در localStorage

## 7. State Persistence
- tab، filter، scroll حفظ

## 8. Keyboard
- Tab، Enter، Esc

## 9. Progressive Disclosure
- Conditional fields

## 10. Feedback
- < 100ms click، Loading > 300ms

## 11. Undo
- 5-10s برای destructive

## 12. Empty State
- پیام + دکمه افزودن

## 13. State Persist
- expanded، scroll

## 14. Terminology
- یه کلمه یه معنی

## 15. Data Integrity
- Cascade delete

## 16. Draft vs Committed
- مستقل، پاک بعد 24h

## 17. A11y
- aria-label، focus trap، Esc

## 18. Touch Targets
- >= 44px

## 19. RTL
- position: right

## 20. Perf Perception
- No flash، No shift

## 21. Semantic Colors
- accent/warn/danger/muted

## 22. Graceful Degradation
- try/catch، fallback

## 23. Error Recovery
- Retry، پیام واضح

## 24. Loading States
- Skeleton، spinner

## 25. Confirmation
- برای حذف مهم

## 26. Naming
- فعل + مفعول

## 27. Mobile-First
- 1-column فرم

## 28. Consistency
- tokens، colors

## 29. Cognitive Load
- <= 7 فیلد

## 30. Polish
- بدون alert/console.log/TODO