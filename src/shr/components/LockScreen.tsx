/**
 * LockScreen.tsx — قفل PIN + Recovery Code
 */
import { useState, useEffect } from 'react';
import { useSet } from '../../mod/set/store';
import { toFa } from '../utils/fa';

const MAX_ATTEMPTS = 5;
const LOCK_MS = 30_000;
const RECOVERY_MAX = 3;
const RECOVERY_LOCK_MS = 5 * 60_000;

async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const security = useSet(s => s.security);

  const [pin, setPin] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [lockUntil, setLockUntil] = useState(0);
  const [shake, setShake] = useState(false);
  const [error, setError] = useState('');

  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryInput, setRecoveryInput] = useState('');
  const [recoveryAttempts, setRecoveryAttempts] = useState(0);
  const [recoveryLockUntil, setRecoveryLockUntil] = useState(0);
  const [recoveryError, setRecoveryError] = useState('');

  const [showWipe, setShowWipe] = useState(false);
  const [wipeStep, setWipeStep] = useState(0);

  const locked = Date.now() < lockUntil;
  const remainingSec = locked ? Math.ceil((lockUntil - Date.now()) / 1000) : 0;
  const recoveryLocked = Date.now() < recoveryLockUntil;
  const recoveryRemainingSec = recoveryLocked ? Math.ceil((recoveryLockUntil - Date.now()) / 1000) : 0;

  useEffect(() => {
    if (pin.length !== 4 || locked) return;
    if (pin === security.pin) { onUnlock(); return; }
    setShake(true);
    setTimeout(() => setShake(false), 500);
    const next = attempts + 1;
    if (next >= MAX_ATTEMPTS) {
      setLockUntil(Date.now() + LOCK_MS);
      setAttempts(0);
      setError('۵ بار اشتباه - ۳۰ ثانیه صبر کنید');
    } else {
      setAttempts(next);
      setError('رمز اشتباه - ' + toFa(MAX_ATTEMPTS - next) + ' تلاش مانده');
    }
    setTimeout(() => setPin(''), 300);
  }, [pin, security.pin, onUnlock, attempts, locked]);

  useEffect(() => {
    const t = setInterval(() => {
      if (locked && Date.now() >= lockUntil) { setLockUntil(0); setError(''); }
      if (recoveryLocked && Date.now() >= recoveryLockUntil) { setRecoveryLockUntil(0); setRecoveryError(''); }
    }, 1000);
    return () => clearInterval(t);
  }, [locked, lockUntil, recoveryLocked, recoveryLockUntil]);

  const press = (n: string) => { if (!locked && pin.length < 4) { setPin(p => p + n); setError(''); } };
  const back = () => { if (!locked) setPin(p => p.slice(0, -1)); };

  const tryRecovery = async () => {
    if (recoveryLocked) return;
    const input = recoveryInput.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!input) return;

    const hash = await sha256(input);
    const stored = security.recoveryHash;

    if (stored && hash === stored) {
      useSet.getState().updateSection('security', { pinEnabled: false, pin: '', recoveryHash: undefined });
      onUnlock();
      return;
    }

    const next = recoveryAttempts + 1;
    if (next >= RECOVERY_MAX) {
      setRecoveryLockUntil(Date.now() + RECOVERY_LOCK_MS);
      setRecoveryAttempts(0);
      setRecoveryError('۳ بار اشتباه - ۵ دقیقه صبر کنید');
    } else {
      setRecoveryAttempts(next);
      setRecoveryError('کد اشتباه - ' + toFa(RECOVERY_MAX - next) + ' تلاش مانده');
    }
    setRecoveryInput('');
  };

  const wipeData = () => {
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('pm-'));
      keys.forEach(k => localStorage.removeItem(k));
    } catch {}
    location.reload();
  };

  const keys = ['1','2','3','4','5','6','7','8','9','','0','X'];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ fontSize: 56, marginBottom: 8 }}>🔒</div>
      <div style={{ fontSize: 'var(--fs-xl)', fontWeight: 700, marginBottom: 4 }}>مدیریت مرغداری</div>
      <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)', marginBottom: 24 }}>رمز ۴ رقمی را وارد کنید</div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, animation: shake ? 'pm-shake 0.5s' : 'none' }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ width: 16, height: 16, borderRadius: '50%', background: i < pin.length ? 'var(--accent)' : 'var(--dim)', transition: 'background 0.1s' }} />
        ))}
      </div>

      {error && <div style={{ color: 'var(--danger)', fontSize: 'var(--fs-sm)', marginBottom: 12, fontWeight: 600 }}>{error}</div>}

      {locked ? (
        <div style={{ fontSize: 'var(--fs-xl)', fontWeight: 700, color: 'var(--danger)', marginBottom: 20 }}>{toFa(remainingSec)} ثانیه</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, maxWidth: 280, width: '100%', marginBottom: 20 }}>
          {keys.map((k, i) => {
            if (k === '') return <div key={i} />;
            const isBack = k === 'X';
            return (
              <button key={i} type="button" onClick={() => isBack ? back() : press(k)} aria-label={isBack ? 'حذف' : k}
                style={{ height: 64, borderRadius: 'var(--r-lg)', background: isBack ? 'transparent' : 'var(--card)', border: isBack ? 'none' : '1px solid var(--border)', fontSize: 'var(--fs-xl)', fontWeight: 700, color: isBack ? 'var(--muted)' : 'var(--text)', cursor: 'pointer', fontFamily: 'inherit' }}>
                {isBack ? '⌫' : k}
              </button>
            );
          })}
        </div>
      )}

      <button type="button" onClick={() => { setShowRecovery(true); setRecoveryError(''); setRecoveryInput(''); }}
        style={{ background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: 'var(--fs-sm)', cursor: 'pointer', fontFamily: 'inherit' }}>
        رمز را فراموش کردم
      </button>

      {showRecovery && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 501 }}>
          <div style={{ background: 'var(--card-solid)', padding: 24, borderRadius: 'var(--r-xl)', maxWidth: 360, width: '100%' }}>
            <div style={{ fontSize: 40, textAlign: 'center', marginBottom: 12 }}>🔑</div>
            <div style={{ fontSize: 'var(--fs-md)', fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>بازیابی با کد</div>
            <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)', lineHeight: 1.7, marginBottom: 16, textAlign: 'center' }}>
              کد بازیابی ۸ کاراکتری که هنگام فعال سازی PIN ذخیره کردید را وارد کنید
            </div>

            {recoveryLocked ? (
              <div style={{ padding: 16, background: 'var(--danger-soft)', borderRadius: 'var(--r-md)', textAlign: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 700, color: 'var(--danger)' }}>
                  {toFa(recoveryRemainingSec)} ثانیه
                </div>
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--danger)', marginTop: 4 }}>تا رفع قفل صبر کنید</div>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  value={recoveryInput}
                  onChange={e => setRecoveryInput(e.target.value.toUpperCase())}
                  placeholder="XXXX-XXXX"
                  autoComplete="off"
                  style={{ width: '100%', height: 46, padding: '0 12px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', color: 'var(--text)', fontFamily: 'monospace', fontSize: 'var(--fs-md)', textAlign: 'center', letterSpacing: '2px', marginBottom: 12, outline: 'none', direction: 'ltr' }}
                />
                {recoveryError && <div style={{ color: 'var(--danger)', fontSize: 'var(--fs-sm)', marginBottom: 8, textAlign: 'center' }}>{recoveryError}</div>}
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <button type="button" onClick={() => setShowRecovery(false)}
                    style={{ flex: 1, padding: 10, background: 'var(--btn-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', color: 'var(--text)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                    لغو
                  </button>
                  <button type="button" onClick={tryRecovery}
                    style={{ flex: 1, padding: 10, background: 'var(--accent)', border: 'none', borderRadius: 'var(--r-md)', color: 'white', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>
                    تأیید
                  </button>
                </div>
              </>
            )}

            <button type="button" onClick={() => { setShowRecovery(false); setShowWipe(true); setWipeStep(0); }}
              style={{ width: '100%', padding: 10, background: 'transparent', border: '1px solid var(--danger)', borderRadius: 'var(--r-md)', color: 'var(--danger)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'var(--fs-sm)', fontWeight: 600 }}>
              کد را ندارم
            </button>
          </div>
        </div>
      )}

      {showWipe && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 502 }}>
          <div style={{ background: 'var(--card-solid)', padding: 24, borderRadius: 'var(--r-xl)', maxWidth: 360, width: '100%', border: '2px solid var(--danger)' }}>
            <div style={{ fontSize: 44, textAlign: 'center', marginBottom: 12 }}>⚠️</div>
            <div style={{ fontSize: 'var(--fs-md)', fontWeight: 700, marginBottom: 12, textAlign: 'center', color: 'var(--danger)' }}>
              پاک کردن همه داده ها
            </div>

            {wipeStep === 0 && (
              <>
                <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.9, marginBottom: 16, textAlign: 'center' }}>
                  <b style={{ color: 'var(--danger)' }}>تمام داده ها</b> پاک می شوند:
                  <br/>
                  گله ها، معاملات، مخاطبین، تنظیمات و PIN.
                  <br/><br/>
                  این عمل <b>قابل بازگشت نیست</b>.
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => setShowWipe(false)}
                    style={{ flex: 1, padding: 10, background: 'var(--btn-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', color: 'var(--text)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                    لغو
                  </button>
                  <button type="button" onClick={() => setWipeStep(1)}
                    style={{ flex: 1, padding: 10, background: 'var(--danger)', border: 'none', borderRadius: 'var(--r-md)', color: 'white', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>
                    ادامه
                  </button>
                </div>
              </>
            )}

            {wipeStep === 1 && (
              <>
                <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.9, marginBottom: 16, textAlign: 'center' }}>
                  آخرین هشدار: بعد از این کار نمی توانید برگردی.
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => setShowWipe(false)}
                    style={{ flex: 1, padding: 10, background: 'var(--btn-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', color: 'var(--text)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                    لغو
                  </button>
                  <button type="button" onClick={wipeData}
                    style={{ flex: 1, padding: 10, background: 'var(--danger)', border: 'none', borderRadius: 'var(--r-md)', color: 'white', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>
                    پاک کن
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes pm-shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
      `}</style>
    </div>
  );
}
