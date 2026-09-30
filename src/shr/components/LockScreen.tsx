/**
 * LockScreen.tsx — صفحه قفل با PIN
 */
import { useState, useEffect } from 'react';
import { useSet } from '../../mod/set/store';
import { toFa } from '../utils/fa';

const MAX_ATTEMPTS = 5;
const LOCK_MS = 30_000;

export default function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const security = useSet(s => s.security);
  const farmName = useSet(s => s.farm?.name) || '';

  const [pin, setPin] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [lockUntil, setLockUntil] = useState(0);
  const [shake, setShake] = useState(false);
  const [error, setError] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [forgotInput, setForgotInput] = useState('');

  const locked = Date.now() < lockUntil;
  const remainingSec = locked ? Math.ceil((lockUntil - Date.now()) / 1000) : 0;

  useEffect(() => {
    if (pin.length !== 4 || locked) return;
    if (pin === security.pin) {
      onUnlock();
      return;
    }
    setShake(true);
    setTimeout(() => setShake(false), 500);
    const next = attempts + 1;
    if (next >= MAX_ATTEMPTS) {
      setLockUntil(Date.now() + LOCK_MS);
      setAttempts(0);
      setError(`۵ بار اشتباه — ۳۰ ثانیه صبر کنید`);
    } else {
      setAttempts(next);
      setError(`رمز اشتباه · ${toFa(MAX_ATTEMPTS - next)} تلاش مانده`);
    }
    setTimeout(() => setPin(''), 300);
  }, [pin, security.pin, onUnlock, attempts, locked]);

  useEffect(() => {
    if (!locked) return;
    const t = setInterval(() => {
      if (Date.now() >= lockUntil) { setLockUntil(0); setError(''); }
    }, 1000);
    return () => clearInterval(t);
  }, [locked, lockUntil]);

  const press = (n: string) => { if (!locked && pin.length < 4) { setPin(p => p + n); setError(''); } };
  const back = () => { if (!locked) setPin(p => p.slice(0, -1)); };

  const resetPin = () => {
    const input = forgotInput.trim();
    if (!input) return;
    if (!farmName || input === farmName) {
      useSet.getState().updateSection('security', { pinEnabled: false, pin: '' });
      onUnlock();
    } else {
      setError('نام مرغداری درست نیست');
      setForgotInput('');
    }
  };

  const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{ fontSize: 56, marginBottom: 8 }}>🔒</div>
      <div style={{ fontSize: 'var(--fs-xl)', fontWeight: 700, marginBottom: 4 }}>مدیریت مرغداری</div>
      <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)', marginBottom: 24 }}>
        رمز ۴ رقمی را وارد کنید
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, animation: shake ? 'pm-shake 0.5s' : 'none' }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{
            width: 16, height: 16, borderRadius: '50%',
            background: i < pin.length ? 'var(--accent)' : 'var(--dim)',
            transition: 'background 0.1s',
          }} />
        ))}
      </div>

      {error && (
        <div style={{ color: 'var(--danger)', fontSize: 'var(--fs-sm)', marginBottom: 12, fontWeight: 600 }}>
          {error}
        </div>
      )}

      {locked ? (
        <div style={{ fontSize: 'var(--fs-xl)', fontWeight: 700, color: 'var(--danger)', marginBottom: 20 }}>
          {toFa(remainingSec)} ثانیه
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, maxWidth: 280, width: '100%', marginBottom: 20 }}>
          {keys.map((k, i) => {
            if (k === '') return <div key={i} />;
            const isBack = k === '⌫';
            return (
              <button
                key={i}
                type="button"
                onClick={() => isBack ? back() : press(k)}
                aria-label={isBack ? 'حذف' : k}
                style={{
                  height: 64, borderRadius: 'var(--r-lg)',
                  background: isBack ? 'transparent' : 'var(--card)',
                  border: isBack ? 'none' : '1px solid var(--border)',
                  fontSize: 'var(--fs-xl)', fontWeight: 700,
                  color: isBack ? 'var(--muted)' : 'var(--text)',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {k}
              </button>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowForgot(true)}
        style={{ background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: 'var(--fs-sm)', cursor: 'pointer', fontFamily: 'inherit' }}
      >
        رمز را فراموش کردم
      </button>

      {showForgot && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 501 }}>
          <div style={{ background: 'var(--card-solid)', padding: 24, borderRadius: 'var(--r-xl)', maxWidth: 340, width: '100%' }}>
            <div style={{ fontSize: 40, textAlign: 'center', marginBottom: 12 }}>🔑</div>
            <div style={{ fontSize: 'var(--fs-md)', fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>
              بازنشانی رمز
            </div>
            <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)', lineHeight: 1.7, marginBottom: 16, textAlign: 'center' }}>
              برای امنیت، نام مرغداری خود را وارد کنید
            </div>
            <input
              type="text"
              value={forgotInput}
              onChange={e => setForgotInput(e.target.value)}
              placeholder="نام مرغداری..."
              style={{
                width: '100%', height: 42, padding: '0 12px',
                background: 'var(--input-bg)', border: '1px solid var(--border)',
                borderRadius: 'var(--r-md)', color: 'var(--text)',
                fontFamily: 'inherit', fontSize: 'var(--fs-base)',
                marginBottom: 12, outline: 'none',
              }}
            />
            {error && <div style={{ color: 'var(--danger)', fontSize: 'var(--fs-sm)', marginBottom: 8 }}>{error}</div>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => { setShowForgot(false); setError(''); setForgotInput(''); }}
                style={{ flex: 1, padding: 10, background: 'var(--btn-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', color: 'var(--text)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
              >
                لغو
              </button>
              <button
                type="button"
                onClick={resetPin}
                style={{ flex: 1, padding: 10, background: 'var(--accent)', border: 'none', borderRadius: 'var(--r-md)', color: 'white', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}
              >
                بازنشانی
              </button>
            </div>
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
