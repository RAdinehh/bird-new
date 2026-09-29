#!/bin/bash
cd ~/Bird-new

echo "═══ ۱. حذف test.txt ═══"
rm -f doc/test.txt
git rm --cached doc/test.txt 2>/dev/null

echo "═══ ۲. حذف cleanup.sh از git ═══"
git rm --cached cleanup.sh 2>/dev/null

echo "═══ ۳. تأیید ═══"
ls doc/
echo ""
echo "test.txt تو doc هست؟"
ls doc/test.txt 2>/dev/null || echo "✅ نیست"

echo ""
echo "═══ ۴. commit + push ═══"
git add -A
git commit -m "chore: remove test.txt + cleanup.sh"
git push origin main

echo ""
echo "═══ ۵. تأیید نهایی ═══"
git log --oneline -3
git status -sb | head -1
