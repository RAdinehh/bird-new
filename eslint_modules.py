"""
eslint_modules.py — ESLint --fix روی هر ماژول جدا
با چک tsc + rollback خودکار
"""
import subprocess, pathlib, os

BASE = pathlib.Path.home() / 'Bird-new'
MODULES = ['brd', 'flk', 'dlg', 'inc', 'egg', 'tra', 'whs', 'fed', 'set', 'ctc', 'alt', 'cal', 'rep', 'arc', 'doc', 'dsh']

def run_tsc():
    r = subprocess.run(['npx', 'tsc', '--noEmit'], cwd=str(BASE), capture_output=True, text=True, timeout=180)
    return r.returncode == 0

def run_eslint_fix(module_path):
    r = subprocess.run(
        ['npx', 'eslint', module_path, '--fix'],
        cwd=str(BASE), capture_output=True, text=True, timeout=120
    )
    return r.returncode

def count_issues(module_path):
    r = subprocess.run(
        ['npx', 'eslint', module_path],
        cwd=str(BASE), capture_output=True, text=True, timeout=120
    )
    # آخرین خط: "✖ N problems (X errors, Y warnings)"
    tail = r.stdout.strip().split('\n')[-1] if r.stdout else ''
    return tail

def git_has_changes(module_path):
    r = subprocess.run(['git', 'status', '-s', module_path], cwd=str(BASE), capture_output=True, text=True)
    return bool(r.stdout.strip())

# چک tsc اول
print('⏳ چک اولیه tsc...')
if not run_tsc():
    print('❌ tsc اول خطا داره — متوقف')
    exit(1)
print('✅ tsc پاک')
print()

results = []
for mod in MODULES:
    path = f'src/mod/{mod}/'
    full = BASE / path

    if not full.exists():
        continue

    # چک قبل
    before = count_issues(path)

    # اجرای fix
    run_eslint_fix(path)

    # اگه تغییر کرد؟
    if not git_has_changes(path):
        results.append((mod, 'بیتغییر', before, before))
        continue

    # چک tsc
    if run_tsc():
        after = count_issues(path)
        results.append((mod, '✅', before, after))
        print(f'✅ {mod}: OK')
    else:
        # rollback
        subprocess.run(f'git checkout HEAD -- {path}', cwd=str(BASE), shell=True)
        results.append((mod, '❌ rollback', before, before))
        print(f'❌ {mod}: rollback')

print()
print('='*70)
print('خلاصه:')
for mod, status, before, after in results:
    print(f'  {status:15s} {mod:6s}  {before[:30] if before else "N/A"}')
