#!/bin/bash
cd ~/Bird-new

echo "═══ ۱. پوشه‌های آرشیو ═══"
mkdir -p archive/src-baks archive/doc-baks archive/root-old

echo "═══ ۲. انتقال .bak/.save از src ═══"
find src -name "*.bak" -exec mv {} archive/src-baks/ \;
find src -name "*.save" -exec mv {} archive/src-baks/ \;

echo "═══ ۳. انتقال از doc ═══"
mv doc/PROJECT-LOG.md.save archive/doc-baks/ 2>/dev/null
mv doc/PROJECT-LOG.md.save.1 archive/doc-baks/ 2>/dev/null
mv doc/PROJECT-LOG.md.save.2 archive/doc-baks/ 2>/dev/null
mv doc/PROJECT-LOG.bak-1790546013 archive/doc-baks/ 2>/dev/null

echo "═══ ۴. فایل‌های ریشه ═══"
mv AI-PACKAGE.txt archive/root-old/ 2>/dev/null
mv project.txt archive/root-old/ 2>/dev/null
mv project-final.txt archive/root-old/ 2>/dev/null
mv unfinished.txt archive/root-old/ 2>/dev/null
mv setup.sh.save archive/root-old/ 2>/dev/null
mv setup.sh.save.1 archive/root-old/ 2>/dev/null

echo "✅ src-baks: $(ls archive/src-baks/ 2>/dev/null | wc -l)"
echo "✅ doc-baks: $(ls archive/doc-baks/ 2>/dev/null | wc -l)"
echo "✅ root-old: $(ls archive/root-old/ 2>/dev/null | wc -l)"

echo "═══ ۵. آپدیت .gitignore ═══"
cat > .gitignore << 'GITEOF'
# Dependencies
node_modules

# Build
dist
*.tsbuildinfo

# Cache
.vite
*.log

# Editor / OS
.DS_Store
*.swp
*~

# Env
.env
.env.local

# Backup files
*.bak
*.bak-*
*.save
*.save.*

# Archive
archive/
backup-*
*-backup-*

# Old files
AI-PACKAGE.txt
project.txt
project-final.txt
unfinished.txt
GITEOF
echo "✅ .gitignore آپدیت شد"

echo "═══ ۶. حذف از git ═══"
git ls-files | grep -E "\.bak|\.save" | xargs -r git rm --cached

echo "═══ ۷. commit + push ═══"
git add -A
git commit -m "chore: archive .bak/.save files + strengthen .gitignore"
git push origin main

echo ""
echo "═══ ۸. build test ═══"
npm run build 2>&1 | tail -5

echo ""
echo "🎉 پاکسازی کامل شد"
