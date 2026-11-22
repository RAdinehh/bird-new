/**
 * FlockIntegrityWarning.tsx — هشدار سلامت داده گله
 *
 * ۲ حالت:
 *   1. Bug: male + female + unknown !== currentCount → قرمز + دکمه اصلاح
 *   2. Partial split: male/female > 0 ولی unknown > 0 → آبی (اطلاع)
 */
import { useFormat } from '../../../shr/units/useFormat';


import { toFa } from '../../../shr/utils/fa';

interface Props {
  form: any;
  setForm: (updater: any) => void;
}

function parseN(s: any): number {
  const str = String(s || '0')
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[,٬]/g, '');
  return parseInt(str) || 0;
}

export default function FlockIntegrityWarning({ form, setForm }: Props) {
  const fmt = useFormat();
  const m = parseN(form.maleCount);
  const f = parseN(form.femaleCount);
  const u = parseN(form.unknownCount);
  const cc = parseN(form.currentCount);
  const sum = m + f + u;

  // ═══ حالت ۱: Bug — sum mismatch ═══
  if (cc > 0 && sum !== cc) {
    const mf = m + f;
    const canAutoFix = mf <= cc && mf !== sum;  // نر+ماده از cc بیشتر نباشه و جمع هم برابر نباشه
    const fixU = canAutoFix ? Math.max(0, cc - mf) : u;
    return (
      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--danger)', fontWeight: 600, lineHeight: 1.7, marginTop: 4 }}>
        {mf > cc ? (
          <>
            ⚠️ نر ({fmt.count(m)}) + ماده ({fmt.count(f)}) = {fmt.count(mf)} بیشتر از تعداد فعلی ({fmt.count(cc)}) است
            {' '}
            — ابتدا نر یا ماده را کاهش دهید
          </>
        ) : (
          <>
            ⚠️ جمع (نر {fmt.count(m)} + ماده {fmt.count(f)} + نامشخص {fmt.count(u)}) = {fmt.count(sum)} — باید با تعداد فعلی ({fmt.count(cc)}) برابر باشد
            {canAutoFix && (
              <>
                {' '}
                <button
                  type="button"
                  onClick={() =>
                    setForm((prev: any) => ({ ...prev, unknownCount: fmt.raw.digits(String(fixU), fmt.units.numberFormat) }))
                  }
                  style={{
                    background: 'none',
                    color: 'var(--danger)',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontWeight: 700,
                    fontSize: 'var(--fs-xs)',
                    textDecoration: 'underline',
                  }}
                >
                  [اصلاح: نامشخص → {fmt.count(fixU)}]
                </button>
              </>
            )}
          </>
        )}
      </div>
    );
  }

  // ═══ حالت ۲: Partial split (اطلاع) ═══
  if (m + f > 0 && u > 0) {
    return (
      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', lineHeight: 1.7, marginTop: 4 }}>
        ℹ️ این گله {fmt.count(u)} پرنده با جنسیت نامشخص دارد (از مجموع {fmt.count(cc)}).
      </div>
    );
  }

  return null;
}
