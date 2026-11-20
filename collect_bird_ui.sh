#!/data/data/com.termux/files/usr/bin/bash
OUT="$HOME/bird_ui_context.txt"
: > "$OUT"

echo "=== STYLES & FONTS ===" >> "$OUT"
find src public index.html -maxdepth 4 \( -name "*.css" -o -name "*.scss" -o -name "*.html" \) 2>/dev/null | sort >> "$OUT"
grep -rnE --exclude-dir={node_modules,dist,build,.git} "@font-face|font-family|--[a-zA-Z0-9_-]+" src index.html 2>/dev/null | head -n 120 >> "$OUT"

echo "" >> "$OUT"
echo "=== NUMBER & PERCENT HELPERS ===" >> "$OUT"
grep -rnE --exclude-dir={node_modules,dist,build,.git} "fa-IR|toLocaleString|toFixed|percent|Percent|format" src 2>/dev/null | head -n 100 >> "$OUT"

echo "" >> "$OUT"
echo "=== MODALS, SELECTS & PDF/FILE HANDLERS ===" >> "$OUT"
grep -rnE --exclude-dir={node_modules,dist,build,.git} "Modal|Select|print\(|pdf|Pdf|PDF|download|export|open" src 2>/dev/null | head -n 120 >> "$OUT"

echo "" >> "$OUT"
echo "=== TOP OF FlockComparisonPanel.tsx ===" >> "$OUT"
head -n 130 src/mod/arc/FlockComparisonPanel.tsx 2>/dev/null >> "$OUT"

echo "SAVED_TO: $OUT (lines: $(wc -l < "$OUT"))"
