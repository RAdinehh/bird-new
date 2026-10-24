# SALE-AUDIT.md — ردیاب ۲۰۵ مفهوم در بخش فروش

| # | مفهوم | وضعیت | توضیح |
|---|-------|-------|-------|
| 1 | Cascade Data | ✅ | از طریق Cascade عمومی tra |
| 2 | Cascade Fallback | ✅ | از طریق Cascade عمومی tra |
| 3 | Cascading Filter | ✅ | انتخاب هچری و گله منبع |
| 4 | On Delete Cascade | ✅ | از طریق Cascade عمومی tra |
| 5 | Rollback Cascade | ✅ | از طریق Cascade عمومی tra |
| 6 | Cross-Module Reference | ✅ | از طریق Cascade عمومی tra |
| 7 | Sort | ✅ | cor/ui/index.ts |
| 8 | Multi-Sort | ❌ | در حال بررسی |
| 9 | Sort Direction | ✅ | shr/filter/FilterBar.tsx |
| 10 | Default Sort | ✅ | shr/filter/configs/_types.ts |
| 11 | Persist Sort | ✅ | shr/filter/configs/_types.ts |
| 12 | Index-Based Order | ✅ | shr/components/DialogHost.tsx |
| 13 | Priority Badge | ✅ | shr/components/Header.tsx |
| 14 | Group By | ✅ | cor/ui/sortGroup.tsx |
| 15 | Collapsible Group | ❌ | در حال بررسی |
| 16 | Group KPI | ✅ | shr/styles/global.css |
| 17 | Multi-Level Group | ✅ | flk/store.ts (parentGroupId) |
| 18 | Category Hierarchy | ✅ | shr/components/ItemDetailsForm.tsx |
| 19 | BIRD_CATS | ✅ | mod/tra/store.ts |
| 20 | Tab-Based Grouping | ✅ | shr/components/DialogHost.tsx |
| 21 | Decimal.js | ➖ | عمومی/نامرتبط |
| 22 | Calc Item Total | ✅ | mod/tra/calc.ts |
| 23 | Calc Total | ✅ | mod/dlg/api/buildData.ts |
| 24 | Paid Sum | ✅ | محاسبات مالی پایه |
| 25 | Remaining | ✅ | محاسبات مالی پایه |
| 26 | Weighted Average Price | ✅ | shr/filter/configs/whs.tsx |
| 27 | Rounding | ✅ | cor/events/DebugPanel.tsx |
| 28 | Installments Calc | ✅ | mod/tra/calc.ts |
| 29 | Apply Payments to Installments | ✅ | mod/tra/store.ts |
| 30 | Cash Discount | ✅ | mod/tra/store.ts |
| 31 | Compute Party Credit | ✅ | mod/tra/store.ts |
| 32 | Compute Stats | ✅ | shr/intelligence/historyStore.ts |
| 33 | Structural Break | ✅ | shr/intelligence/anomalyDetector.ts |
| 34 | Weight Loss | ➖ | نامرتبط با فروش |
| 35 | FCR | ➖ | نامرتبط با فروش |
| 36 | ADG | ➖ | نامرتبط با فروش |
| 37 | Hen Day | ➖ | نامرتبط با فروش |
| 38 | Zod Schema | ➖ | عمومی/نامرتبط |
| 39 | useValidation Hook | ➖ | عمومی/نامرتبط |
| 40 | Per-Field Validation | ✅ | shr/hooks/useFormErrors.ts |
| 41 | showError | ✅ | cor/store/dialog.ts |
| 42 | markTouched | ✅ | shr/hooks/useFormErrors.ts |
| 43 | Required vs Optional | ✅ | cor/store/dialog.ts |
| 44 | Cross-Field Validation | ✅ | در اعتبارسنجی Zod و گاردها دیدیم |
| 45 | Range Validation | ✅ | موجودی انبار/گله |
| 46 | Date Validation | ✅ | shr/utils/backup.ts |
| 47 | Pattern Validation | ✅ | shr/intelligence/anomalyDetector.ts |
| 48 | Enum Validation | ✅ | shr/filter/FilterBar.tsx |
| 49 | Live Validation | ✅ | useValidation.ts (useMemo) |
| 50 | Save Attempt Validation | ✅ | shr/hooks/useFormErrors.ts |
| 51 | Duplicate Check | ✅ | mod/flk/FlocksPage.tsx |
| 52 | Inline Error | ✅ | shr/components/ErrorBoundary.tsx |
| 53 | Error Box | ✅ | shr/components/ui/Form.tsx |
| 54 | Anomaly Detection | ✅ | shr/intelligence/AnomalyHint.tsx |
| 55 | Field Profile | ➖ | عمومی/نامرتبط |
| 56 | Signal | ➖ | عمومی/نامرتبط |
| 57 | Voting | ➖ | عمومی/نامرتبط |
| 58 | History | ➖ | عمومی/نامرتبط |
| 59 | TTL | ➖ | عمومی/نامرتبط |
| 60 | CV-Aware | ➖ | عمومی/نامرتبط |
| 61 | User Pattern | ➖ | عمومی/نامرتبط |
| 62 | Confirmation Learning | ➖ | عمومی/نامرتبط |
| 63 | Biological Range | ➖ | عمومی/نامرتبط |
| 64 | Structural Break Aware | ➖ | عمومی/نامرتبط |
| 65 | Suppress If No History | ➖ | عمومی/نامرتبط |
| 66 | Anomaly Hint | ✅ | shr/intelligence/AnomalyHint.tsx |
| 67 | Field Hint Wrapper | ✅ | shr/intelligence/FieldHint.tsx |
| 68 | Format Warning | ✅ | shr/intelligence/AnomalyHint.tsx |
| 69 | Expected Value | ➖ | عمومی/نامرتبط |
| 70 | Species Reference | ➖ | عمومی/نامرتبط |
| 71 | Natural Language Warning | ✅ | shr/intelligence/formatWarning.ts |
| 72 | Filter Defs | ✅ | shr/filter/FilterBar.tsx |
| 73 | Filter Bar | ✅ | shr/components/FilterBar.tsx |
| 74 | Multi-Select Filter | ✅ | shr/filter/configs/alt.tsx |
| 75 | Range Filter | ✅ | shr/filter/FilterBar.tsx |
| 76 | Search | ✅ | cor/events/DebugPanel.tsx |
| 77 | Full-Text Search | ✅ | shr/filter/types.ts |
| 78 | Clear Filter | ✅ | shr/filter/FilterBar.tsx |
| 79 | Active Filter Indicator | ✅ | shr/filter/FilterBar.tsx |
| 80 | Persist Filter | ✅ | shr/filter/configs/_types.ts |
| 81 | URL Filter | ✅ | shr/hooks/useUrlFilter.ts |
| 82 | Filter Sort Integration | ✅ | shr/filter/index.ts |
| 83 | localStorage Persist | ✅ | shr/store/customOptions.ts |
| 84 | Store Subscription | ✅ | shr/components/Header.tsx |
| 85 | Draft Save | ✅ | ذخیره خودکار پیش‌نویس |
| 86 | Auto-Save | ✅ | useInvoiceForm.ts (setTimeout debounce) |
| 87 | Undo/Redo | ✅ | cor/ui/useUndo.ts |
| 88 | Undo Data | ✅ | shr/components/EditableSelect.tsx |
| 89 | Deleted Item Recovery | ✅ | cor/ui/UndoBar.tsx |
| 90 | Snapshot | ✅ | mod/brd/BreedsPage.tsx |
| 91 | Backup | ✅ | shr/hooks/useAutoBackup.ts |
| 92 | Restore | ✅ | cor/store/toast.ts |
| 93 | Replace vs Merge | ✅ | cor/router/AppRouter.tsx |
| 94 | Guard | ✅ | در اعتبارسنجی Zod و گاردها دیدیم |
| 95 | Reopen | ✅ | cor/events/DebugPanel.tsx |
| 96 | Lock | ✅ | shr/components/LockScreen.tsx |
| 97 | Warning Banner | ✅ | cor/store/toast.ts |
| 98 | Confirm Dialog | ✅ | cor/store/dialog.ts |
| 99 | Danger Zone | ✅ | cor/store/dialog.ts |
| 100 | Audit Log | ✅ | cor/logger/auditLog.ts |
| 101 | Rollback | ✅ | mod/tra/store.ts |
| 102 | Backup Before Mutation | ❌ | در حال بررسی |
| 103 | Readonly | ✅ | shr/components/DatePicker.tsx |
| 104 | Modal | ✅ | shr/components/DatePicker.tsx |
| 105 | Expandable Card | ✅ | shr/components/ExpandableCard.tsx |
| 106 | Chip / Tag | ✅ | shr/components/FilterBar.tsx |
| 107 | Badge | ✅ | shr/components/Header.tsx |
| 108 | FAB | ✅ | cor/ui/FloatingAdd.tsx |
| 109 | Toast | ✅ | cor/store/toast.ts |
| 110 | Empty State | ✅ | cor/ui/FloatingAdd.tsx |
| 111 | Skeleton Loading | ✅ | shr/components/Skeleton.tsx |
| 112 | Progress Tracker | ✅ | shr/components/ProgressTracker.tsx |
| 113 | Focus Trap | ✅ | ui/Modal.tsx (first/last) |
| 114 | Escape Key | ✅ | shr/components/Header.tsx |
| 115 | Keyboard Navigation | ✅ | cor/ui/a11y.ts |
| 116 | Section Title | ✅ | shr/components/ui/Layout.tsx |
| 117 | Accordion Section | ✅ | shr/components/AccordionSection.tsx |
| 118 | Number Counter | ✅ | mod/flk/components/FlockCard.tsx |
| 119 | Deep Link / Entity Link | ✅ | shr/components/EntityLink.tsx |
| 120 | Navigation | ✅ | shr/components/Header.tsx |
| 121 | Event Bus | ✅ | cor/events/DebugPanel.tsx |
| 122 | Shadow Creation | ✅ | Auto-fill مقادیر از هچری |
| 123 | Auto-Sync | ✅ | whs/handlers.ts (bus.on) |
| 124 | Interface | ➖ | عمومی/نامرتبط |
| 125 | Type | ➖ | عمومی/نامرتبط |
| 126 | Union Type | ➖ | عمومی/نامرتبط |
| 127 | Optional Field | ➖ | عمومی/نامرتبط |
| 128 | Nullable | ➖ | عمومی/نامرتبط |
| 129 | Type Guard | ➖ | عمومی/نامرتبط |
| 130 | Type Narrowing | ➖ | عمومی/نامرتبط |
| 131 | Generic | ➖ | عمومی/نامرتبط |
| 132 | Enum | ➖ | عمومی/نامرتبط |
| 133 | Type Assertion | ➖ | عمومی/نامرتبط |
| 134 | Interface Gap | ➖ | عمومی/نامرتبط |
| 135 | Unit Test | ✅ | 81 test file |
| 136 | Integration Test | ✅ | src/test/*.test.ts |
| 137 | beforeEach | ➖ | عمومی/نامرتبط |
| 138 | Mock | ➖ | عمومی/نامرتبط |
| 139 | TSC | ➖ | عمومی/نامرتبط |
| 140 | Vitest | ➖ | عمومی/نامرتبط |
| 141 | Assertion | ➖ | عمومی/نامرتبط |
| 142 | Coverage | ➖ | عمومی/نامرتبط |
| 143 | Invoice | ✅ | cor/events/events.ts |
| 144 | Payment | ✅ | shr/help/helpTexts.ts |
| 145 | Installment | ✅ | mod/tra/store.ts |
| 146 | Party Payment | ✅ | mod/tra/store.ts |
| 147 | Credit Balance | ✅ | mod/ctc/store.ts |
| 148 | Check | ✅ | در اعتبارسنجی Zod و گاردها دیدیم |
| 149 | Bounced Check | ✅ | shr/intelligence/fieldProfiles.ts |
| 150 | Cash Discount | ✅ | محاسبات مالی پایه |
| 151 | Settlement | ✅ | shr/validation/rules/tra.ts |
| 152 | Refund | ✅ | shr/dev/invariants.ts |
| 153 | Advance Payment | ✅ | shr/help/helpTexts.ts |
| 154 | Preorder | ✅ | shr/utils/itemDetails.ts |
| 155 | Workflow Status | ✅ | shr/components/Header.tsx |
| 156 | Flock | ✅ | cor/events/events.ts |
| 157 | Bird | ➖ | عمومی/نامرتبط |
| 158 | Breed | ➖ | نامرتبط با فروش |
| 159 | Hall | ✅ | shr/utils/systemType.ts |
| 160 | Zone | ✅ | shr/filter/configs/hal.tsx |
| 161 | Incubation | ➖ | نامرتبط با فروش |
| 162 | Candling | ➖ | نامرتبط با فروش |
| 163 | Hatch | ➖ | نامرتبط با فروش |
| 164 | Egg | ✅ | cor/router/AppRouter.tsx |
| 165 | Mortality | ➖ | عمومی/نامرتبط |
| 166 | Withdrawal | ✅ | shr/components/ItemDetailsForm.tsx |
| 167 | Vaccination | ➖ | عمومی/نامرتبط |
| 168 | Feed Formula | ➖ | عمومی/نامرتبط |
| 169 | FCR | ➖ | نامرتبط با فروش |
| 170 | ADG | ➖ | نامرتبط با فروش |
| 171 | Hen Day | ➖ | نامرتبط با فروش |
| 172 | Field | ✅ | فرم‌های پایه |
| 173 | NumField | ✅ | فرم‌های پایه |
| 174 | MoneyField | ✅ | فرم‌های پایه |
| 175 | PercentField | ✅ | shr/components/ui/Input.tsx |
| 176 | DatePicker | ✅ | shr/components/DatePicker.tsx |
| 177 | TimePicker | ✅ | shr/components/TimePicker.tsx |
| 178 | Input | ✅ | shr/components/DialogHost.tsx |
| 179 | Textarea | ✅ | shr/components/ui/Input.tsx |
| 180 | Select | ✅ | cor/ui/FloatingAdd.tsx |
| 181 | SmartSelect | ✅ | shr/components/SmartSelect.tsx |
| 182 | DependentSelect | ✅ | shr/components/DependentSelect.tsx |
| 183 | Grid2 / Grid3 | ✅ | فرم‌های پایه |
| 184 | Controlled Input | ✅ | cor/ui/useUndo.ts |
| 185 | Field Error | ✅ | shr/components/ErrorBoundary.tsx |
| 186 | Field Hint | ✅ | shr/components/ItemDetailsForm.tsx |
| 187 | onTouch | ✅ | cor/ui/FloatingAdd.tsx |
| 188 | useMemo | ➖ | عمومی/نامرتبط |
| 189 | useCallback | ➖ | عمومی/نامرتبط |
| 190 | React.memo | ➖ | عمومی/نامرتبط |
| 191 | Zustand Selector | ➖ | عمومی/نامرتبط |
| 192 | Lazy Import | ➖ | عمومی/نامرتبط |
| 193 | Debounce / Throttle | ➖ | عمومی/نامرتبط |
| 194 | Factory Pattern | ➖ | عمومی/نامرتبط |
| 195 | Strategy Pattern | ➖ | عمومی/نامرتبط |
| 196 | Observer Pattern | ➖ | عمومی/نامرتبط |
| 197 | Repository Pattern | ➖ | عمومی/نامرتبط |
| 198 | Reducer Pattern | ➖ | عمومی/نامرتبط |
| 199 | Provider Pattern | ➖ | عمومی/نامرتبط |
| 200 | Conventional Commits | ➖ | عمومی/نامرتبط |
| 201 | Git Log | ➖ | عمومی/نامرتبط |
| 202 | Git Diff | ➖ | عمومی/نامرتبط |
| 203 | Git Tag | ➖ | عمومی/نامرتبط |
| 204 | Git Status | ➖ | عمومی/نامرتبط |
| 205 | Git Push | ➖ | عمومی/نامرتبط |
