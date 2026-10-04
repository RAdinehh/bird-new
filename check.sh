#!/data/data/com.termux/files/usr/bin/bash
# check.sh — چک سریع + نمایش خطاها با context

echo "━━━ TSC ━━━"
TSC_OUT=$(npx tsc --noEmit 2>&1)
if [ -z "$TSC_OUT" ]; then
  echo "✅ tsc تمیز"
else
  echo "$TSC_OUT"
  echo ""
  echo "━━━ خطوط خطا ━━━"
  # برای هر خطا، خط مربوطه رو نشون بده
  echo "$TSC_OUT" | grep -oP 'src/[^(]+\(\d+,\d+\)' | sort -u | while read -r loc; do
    FILE=$(echo "$loc" | grep -oP '^src/[^(]+')
    LINE=$(echo "$loc" | grep -oP '\(\K\d+')
    if [ -f "$FILE" ]; then
      echo "--- $FILE خط $LINE ---"
      START=$((LINE - 3))
      [ $START -lt 1 ] && START=1
      END=$((LINE + 3))
      sed -n "${START},${END}p" "$FILE" | nl -ba -v$START
      echo ""
    fi
  done
fi

echo ""
echo "━━━ BUILD ━━━"
BUILD_OUT=$(npm run build 2>&1 | tail -3)
echo "$BUILD_OUT"
