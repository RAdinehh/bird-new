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
    const diff = cc - sum;
    const fixU = Math.max(0, u + diff);
    return (
      <div
        style={{
          padding: '8px 12px',
          background: 'var(--danger-soft)',
          border: '1px solid var(--danger)',
          borderRadius: 'var(--r-md)',
          fontSize: 'var(--fs-xs)',
          color: 'var(--danger)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
          marginBottom: 8,
        }}
      >
        <span style={{ flex: 1, minWidth: 200 }}>
          ⚠️ جمع (نر {toFa(String(m))} + ماده {toFa(String(f))} + نامشخص {toFa(String(u))}) = {toFa(String(sum))} — باید با تعداد فعلی ({toFa(String(cc))}) برابر باشد
        </span>
        <button
          type="button"
          onClick={() =>
            setForm((prev: any) => ({ ...prev, unknownCount: toFa(String(fixU)) }))
          }
          style={{
            background: 'var(--danger)',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            padding: '3px 10px',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontWeight: 700,
            fontSize: 'var(--fs-xs)',
          }}
        >
          اصلاح خودکار (نامشخص: {toFa(String(fixU))})
        </button>
      </div>
    );
  }

  // ═══ حالت ۲: Partial split (اطلاع) ═══
  if (m + f > 0 && u > 0) {
    return (
      <div
        style={{
          padding: '8px 12px',
          background: 'var(--accent-soft)',
          border: '1px solid var(--accent-border)',
          borderRadius: 'var(--r-md)',
          fontSize: 'var(--fs-xs)',
          color: 'var(--accent)',
          marginBottom: 8,
          lineHeight: 1.7,
        }}
      >
        ℹ️ این گله {toFa(String(u))} پرنده با جنسیت نامشخص دارد (از مجموع {toFa(String(cc))}). می‌توانید جنسیت را در فیلدهای نر/ماده/نامشخص مشخص کنید.
      </div>
    );
  }

  return null;
}
