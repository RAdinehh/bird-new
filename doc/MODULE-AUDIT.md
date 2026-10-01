# MODULE-AUDIT.md — استاندارد Google/Apple برای هر ماژول

> قاعده قبولی: هر ماژول تا نمره 90+ نگیره قفل نمیشه.

## معیار نمره‌دهی (100 نمره)

| فاز | وزن | قبولی |
|------|:---:|:---:|
| فاز 1 — Functionality | 15 | >= 13 |
| فاز 2 — UX | 20 | >= 18 |
| فاز 3 — UI | 20 | >= 18 |
| فاز 4 — Accessibility | 15 | >= 13 |
| فاز 5 — Performance | 10 | >= 9 |
| فاز 6 — Integration | 10 | >= 9 |
| فاز 7 — Senior Review | 10 | >= 9 |
| مجموع | 100 | >= 90 |

مرجع: Google Material 3 + Apple HIG + WCAG 2.1 + NN/g

## 4 اصل UX پایه

1. Progressive Disclosure
2. Semantic Color System
3. Touch Target Standard (>= 44px)
4. Graceful Degradation

## فاز 1 — Functionality (15)
- [ ] CRUD کامل
- [ ] Save/Load درست
- [ ] Validation
- [ ] Undo destructive
- [ ] Data persistence
- [ ] Edge cases
- [ ] Error handling

## فاز 2 — UX (20)
- [ ] Progressive Disclosure
- [ ] Graceful Degradation
- [ ] Inline Validation
- [ ] Empty/Error/Loading States
- [ ] Dismissable Tips
- [ ] State Persistence
- [ ] Read-only != Disabled
- [ ] Undo
- [ ] Consistency

## فاز 3 — UI (20)
- [ ] Semantic Colors فقط
- [ ] Touch Targets >= 44px
- [ ] RTL-Aware
- [ ] Spacing tokens
- [ ] Typography tokens
- [ ] Visual hierarchy

## فاز 4 — Accessibility (15)
- [ ] aria-label icon-only
- [ ] Focus trap + Esc
- [ ] Keyboard nav
- [ ] WCAG AA contrast
- [ ] Reduced motion
- [ ] Screen reader

## فاز 5 — Performance (10)
- [ ] No N+1
- [ ] useMemo/useCallback
- [ ] Cache heavy data
- [ ] Correct reactivity
- [ ] Lazy loading

## فاز 6 — Integration (10)
- [ ] Cross-module links
- [ ] Context passing
- [ ] Profile integration
- [ ] AutoFill
- [ ] Parent undo
- [ ] Navigation payload

## فاز 7 — Senior Review (10)

### Edge Case (2)
- [ ] 0 / منفی / 999999
- [ ] کاراکتر خاص
- [ ] تاریخ نامعتبر
- [ ] null/undefined
- [ ] Duplicate

### Loading & Async (1)
- [ ] Skeleton
- [ ] Error state
- [ ] Retry

### User Control (1)
- [ ] Undo
- [ ] Confirmation
- [ ] Esc

### Empty & Error (1)
- [ ] Empty informative
- [ ] Error actionable
- [ ] Success toast

### Data Integrity (1)
- [ ] Auto-save draft
- [ ] Validation
- [ ] Cascade delete

### Cognitive Load (1)
- [ ] فرم <= 7 فیلد
- [ ] Helper text
- [ ] Progressive

### Consistency (1)
- [ ] Spacing tokens
- [ ] Color semantics
- [ ] Button styles

### Polish (1)
- [ ] بدون alert()
- [ ] بدون hardcoded
- [ ] بدون TODO

### Performance Perception (0.5)
- [ ] Instant feedback
- [ ] No layout shift
- [ ] No flash

### Graceful Failure (0.5)
- [ ] Fallback
- [ ] Recover

## نمره‌دهی

| نمره | رتبه |
|:---:|---|
| 95-100 | Google/Apple Quality |
| 90-94 | Production Ready |
| 80-89 | Needs polish |
| 70-79 | Needs work |
| <70 | Not ready |

## قاعده طلایی

1. انتخاب ماژول
2. Audit 7 فاز
3. Fix تا نمره >= 90
4. قفل
5. ماژول بعدی