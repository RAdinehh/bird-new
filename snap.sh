#!/data/data/com.termux/files/usr/bin/bash
# snap.sh — نمایش سریع فایل‌های پروژه
# Usage:
#   ./snap.sh list            → لیست ماژول‌ها
#   ./snap.sh stores          → همه store.ts
#   ./snap.sh rules           → همه validation rules
#   ./snap.sh dlg             → کل ماژول dlg
#   ./snap.sh dlg/store       → فایل خاص
#   ./snap.sh ui              → ui.tsx

Q="$1"

case "$Q" in
  list)
    echo "ماژول‌ها:"
    ls src/mod/
    ;;
  stores)
    for f in src/mod/*/store.ts; do
      echo ""
      echo "===== $f ====="
      cat "$f"
    done
    ;;
  rules)
    for f in src/shr/validation/rules/*.ts; do
      echo ""
      echo "===== $f ====="
      cat "$f"
    done
    ;;
  ui)
    echo "===== src/shr/components/ui.tsx ====="
    cat src/shr/components/ui.tsx
    ;;
  "")
    echo "Usage:"
    echo "  ./snap.sh list           لیست ماژول‌ها"
    echo "  ./snap.sh stores         همه store.ts"
    echo "  ./snap.sh rules          همه validation rules"
    echo "  ./snap.sh dlg            کل ماژول dlg"
    echo "  ./snap.sh dlg/store      فایل خاص"
    echo "  ./snap.sh ui             ui.tsx"
    ;;
  */*)
    FILE=$(find src -type f \( -name "*.ts" -o -name "*.tsx" \) 2>/dev/null | grep -i "$Q" | head -1)
    if [ -z "$FILE" ]; then
      echo "پیدا نشد: $Q"
      exit 1
    fi
    echo "===== $FILE ====="
    cat "$FILE"
    ;;
  *)
    DIR="src/mod/$Q"
    if [ ! -d "$DIR" ]; then
      echo "ماژول پیدا نشد: $Q"
      echo "لیست:"
      ls src/mod/
      exit 1
    fi
    for f in $(find "$DIR" -type f | sort); do
      echo ""
      echo "===== $f ====="
      cat "$f"
    done
    ;;
esac
