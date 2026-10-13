import subprocess, os, re

BASE = 'src/mod/hal'

def sh(cmd):
    r = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    return r.stdout.strip()

def count(pattern, path=BASE, extra=''):
    out = sh(f'grep -rE "{pattern}" {path} {extra} --include="*.ts" --include="*.tsx" 2>/dev/null')
    return len([l for l in out.splitlines() if l.strip()])

print('='*70)
print('🔬 ممیزی عمیق hal — طبق AUDIT.md')
print('='*70)

# ═══════════════════════════════════════════════
# بخش ۱ — رنگ‌ها (توکن vs hex)
# ═══════════════════════════════════════════════
print('\n【رنگ‌ها】')
hex_lines = sh(f'grep -rnE "#[0-9a-fA-F]{{3,8}}" {BASE} --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "test\\|//"')
hex_count = len([l for l in hex_lines.splitlines() if l.strip()])
print(f'  Hex در hal: {hex_count}')
if hex_count > 0:
    print('  نمونه:')
    for l in hex_lines.splitlines()[:5]:
        print(f'    {l[:100]}')

# چک rgba بدون توکن
rgba = count('rgba\\([0-9]', BASE)
print(f'  rgba/hsl دستی: {rgba}')

# ═══════════════════════════════════════════════
# بخش ۲ — فیلدهای فرم‌ها (ورودی/خروجی)
# ═══════════════════════════════════════════════
print('\n【فیلدهای فرم‌ها】')
forms = ['HallsFormModal.tsx', 'ZoneFormModal.tsx', 'EquipmentFormModal.tsx']
for form in forms:
    path = f'{BASE}/components/{form}'
    if not os.path.exists(path):
        continue
    labels = sh(f'grep -oE "<Field label=\\"[^\\"]+\\"" {path}')
    required = len([l for l in sh(f'grep -E "<Field label.*required" {path}').splitlines() if l.strip()])
    total_fields = len([l for l in sh(f'grep -E "<Field label" {path}').splitlines() if l.strip()])
    print(f'  {form}: {total_fields} فیلد ({required} اجباری)')

# ═══════════════════════════════════════════════
# بخش ۳ — اعتبارسنجی (سه لایه)
# ═══════════════════════════════════════════════
print('\n【اعتبارسنجی】')
schemas = sh('grep -nE "createHallSchema|ZoneSchema|EquipmentSchema" src/shr/validation/rules/hal.ts')
print(f'  Schema ها: {len(schemas.splitlines())}')
# Cross-field validation
cross = count('superRefine|refine', 'src/shr/validation')
print(f'  Cross-field (superRefine): {cross}')
# requiredStr checks
required_checks = count('requiredStr|requiredId', 'src/shr/validation/rules/hal.ts')
print(f'  required checks: {required_checks}')

# ═══════════════════════════════════════════════
# بخش ۴ — آبشاری (Cascade)
# ═══════════════════════════════════════════════
print('\n【آبشاری】')
cascade_patterns = [
    ('birdId → breedId', r'birdId.*breedId.*\'\''),
    ('hallId → zoneId', r'hallId.*zoneId.*\'\''),
    ('reset فرزند', r'zoneId:\s*\'\''),
]
for name, pat in cascade_patterns:
    n = count(pat)
    print(f'  {name}: {n}')

# ═══════════════════════════════════════════════
# بخش ۵ — فیلتر و مرتب‌سازی
# ═══════════════════════════════════════════════
print('\n【فیلتر/مرتب】')
filter_lines = sh('grep -E "getHal.*Config|filterDefs|sortDefs" src/shr/filter/configs/hal.tsx')
for line in filter_lines.splitlines()[:8]:
    print(f'  {line.strip()[:90]}')

# ═══════════════════════════════════════════════
# بخش ۶ — EntityLink (اتصالات)
# ═══════════════════════════════════════════════
print('\n【EntityLink】')
entity = sh(f'grep -rhE "EntityLink type=\\"[a-z]+\\"" {BASE}')
types = set(re.findall(r'type="([a-z]+)"', entity))
print(f'  انواع استفاده‌شده: {sorted(types)}')

# ═══════════════════════════════════════════════
# بخش ۷ — محاسبات
# ═══════════════════════════════════════════════
print('\n【محاسبات】')
toEn = count('toEn\\(')
parseNum = count('parseInt|parseFloat|Number\\(')
floor = count('Math\\.floor')
round = count('Math\\.round')
print(f'  toEn: {toEn}')
print(f'  parseInt/parseFloat: {parseNum}')
print(f'  Math.floor: {floor}')
print(f'  Math.round: {round}')

# ═══════════════════════════════════════════════
# بخش ۸ — Draft (Auto-save)
# ═══════════════════════════════════════════════
print('\n【Auto-save Draft】')
drafts = sh(f'grep -rE "useFormDraft" {BASE}')
print(f'  استفاده: {len(drafts.splitlines())}')

# ═══════════════════════════════════════════════
# بخش ۹ — OverrideHint
# ═══════════════════════════════════════════════
print('\n【OverrideHint】')
override = sh(f'grep -rE "useOverride|OverrideHint" {BASE}')
print(f'  استفاده: {len(override.splitlines())}')

# ═══════════════════════════════════════════════
# بخش ۱۰ — حالت‌های Empty/Loading/Error
# ═══════════════════════════════════════════════
print('\n【حالت‌ها】')
empty = count('<Empty')
skeleton = count('<Skeleton|Skeleton\\.')
error_box = count('<ErrorBox')
print(f'  Empty: {empty}')
print(f'  Skeleton: {skeleton}')
print(f'  ErrorBox: {error_box}')

# ═══════════════════════════════════════════════
# بخش ۱۱ — accessibility
# ═══════════════════════════════════════════════
print('\n【دسترسی‌پذیری】')
aria = count('aria-label')
role_btn = count('role="button"')
tabindex = count('tabIndex')
print(f'  aria-label: {aria}')
print(f'  role="button": {role_btn}')
print(f'  tabIndex: {tabindex}')

# ═══════════════════════════════════════════════
# بخش ۱۲ — Auto-fill و منبع
# ═══════════════════════════════════════════════
print('\n【Auto-fill】')
autofrom = count('autoFrom')
markauto = count('markAuto')
clearauto = count('clearAuto')
source = count('SourceBadge')
print(f'  autoFrom: {autofrom}')
print(f'  markAuto: {markauto}')
print(f'  clearAuto: {clearauto}')
print(f'  SourceBadge: {source}')

print()
print('='*70)
