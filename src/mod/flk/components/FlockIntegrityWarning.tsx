/**
 * FlockIntegrityWarning.tsx — هشدار سلامت داده گله
 *
 * ۲ حالت:
 *   1. Bug: male + female + unknown !== currentCount → قرمز + دکمه اصلاح
 *   2. Partial split: male/female > 0 ولی unknown > 0 → آبی (اطلاع)
 */
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
            ⚠️ نر ({toFa(String(m))}) + ماده ({toFa(String(f))}) = {toFa(String(mf))} بیشتر از تعداد فعلی ({toFa(String(cc))}) است
            {' '}
            — ابتدا نر یا ماده را کاهش دهید
          </>
        ) : (
          <>
            ⚠️ جمع (نر {toFa(String(m))} + ماده {toFa(String(f))} + نامشخص {toFa(String(u))}) = {toFa(String(sum))} — باید با تعداد فعلی ({toFa(String(cc))}) برابر باشد
            {canAutoFix && (
              <>
                {' '}
                <button
                  type="button"
                  onClick={() =>
                    setForm((prev: any) => ({ ...prev, unknownCount: toFa(String(fixU)) }))
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
                  [اصلاح: نامشخص → {toFa(String(fixU))}]
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
        ℹ️ این گله {toFa(String(u))} پرنده با جنسیت نامشخص دارد (از مجموع {toFa(String(cc))}).
      </div>
    );
  }

  return null;
}
