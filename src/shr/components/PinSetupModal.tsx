/**
 * PinSetupModal.tsx — ویزارد راه‌اندازی PIN
 */
import { useState } from 'react';
import { useSet } from '../../mod/set/store';
import { toFa } from '../utils/fa';

async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateRecovery(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  const arr = new Uint8Array(8);
  crypto.getRandomValues(arr);
  for (let i = 0; i < 8; i++) {
    code += chars[arr[i] % chars.length];
    if (i === 3) code += '-';
  }
  return code;
}

export default function PinSetupModal({ open, onClose, onDone }: {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const [step, setStep] = useState<'pin' | 'confirm' | 'recovery' | 'done'>('pin');
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const reset = () => {
    setStep('pin'); setPin(''); setConfirm(''); setRecoveryCode(''); setError(''); setSaving(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const nextFromPin = () => {
    if (pin.length !== 4) { setError('PIN باید ۴ رقم باشه'); return; }
    if (!/^[0-9]{4}$/.test(pin)) { setError('فقط عدد'); return; }
    setError(''); setStep('confirm');
  };

  const nextFromConfirm = () => {
    if (confirm !== pin) { setError('تکرار PIN مطابق نیست'); return; }
    setError(''); setRecoveryCode(generateRecovery()); setStep('recovery');
  };

  const finishSetup = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const hash = await sha256(recoveryCode.replace(/-/g, ''));
      useSet.getState().updateSection('security', {
        pinEnabled: true,
        pin,
        recoveryHash: hash,
      });
      setStep('done');
      setTimeout(() => { reset(); onDone(); }, 1500);
    } catch {
      setError('خطا در ذخیره');
      setSaving(false);
    }
  };

  const keys = ['1','2','3','4','5','6','7','8','9','','0','X'];
  const current = step === 'pin' ? pin : confirm;
  const setCurrent = step === 'pin' ? setPin : setConfirm;
  const press = (n: string) => { if (current.length < 4) { setCurrent(current + n); setError(''); } };
  const back = () => { setCurrent(current.slice(0, -1)); };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'var(--overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'var(--card-solid)', borderRadius: 'var(--r-xl)', width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700 }}>
            {step === 'pin' && 'مرحله ۱ از ۳ — انتخاب رمز'}
            {step === 'confirm' && 'مرحله ۲ از ۳ — تکرار رمز'}
            {step === 'recovery' && 'مرحله ۳ از ۳ — کد بازیابی'}
            {step === 'done' && '✅ انجام شد'}
          </div>
          <button onClick={handleClose} aria-label="بستن"
            style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 18, padding: 4, fontFamily: 'inherit' }}>
            ✕
          </button>
        </div>

        <div style={{ padding: '20px 20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>

          {step === 'pin' && (
            <>
              <div style={{ fontSize: 40 }}>🔐</div>
              <div style={{ fontSize: 'var(--fs-md)', fontWeight: 700 }}>رمز ۴ رقمی انتخاب کن</div>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>هر بار ورود، این رمز پرسیده می‌شود</div>
            </>
          )}

          {step === 'confirm' && (
            <>
              <div style={{ fontSize: 40 }}>🔁</div>
              <div style={{ fontSize: 'var(--fs-md)', fontWeight: 700 }}>تکرار کن</div>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>برای اطمینان، دوباره وارد کن</div>
            </>
          )}

          {step === 'recovery' && (
            <>
              <div style={{ fontSize: 40 }}>🔑</div>
              <div style={{ fontSize: 'var(--fs-md)', fontWeight: 700 }}>کد بازیابی</div>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', textAlign: 'center', lineHeight: 1.7 }}>
                این کد رو <b style={{ color: 'var(--danger)' }}>جای امن</b> ذخیره کن (کاغذ یا عکس).
                <br/>
                فقط با این کد می‌تونی اگه رمز رو فراموش کردی برگردی.
              </div>
              <div style={{
                padding: '14px 18px', background: 'var(--accent-soft)',
                border: '2px dashed var(--accent)', borderRadius: 'var(--r-md)',
                fontFamily: 'monospace', fontSize: 'var(--fs-lg)', fontWeight: 700,
                letterSpacing: '3px', color: 'var(--accent)', direction: 'ltr',
              }}>
                {recoveryCode}
              </div>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--danger)', textAlign: 'center' }}>
                ⚠️ اگه این کد رو گم کنی، فقط می‌تونی داده‌ها رو پاک کنی
              </div>
            </>
          )}

          {step === 'done' && (
            <>
              <div style={{ fontSize: 56 }}>✅</div>
              <div style={{ fontSize: 'var(--fs-md)', fontWeight: 700, color: 'var(--accent)' }}>قفل فعال شد</div>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>از این به بعد هنگام ورود، رمز پرسیده می‌شود</div>
            </>
          )}

          {error && (
            <div style={{ color: 'var(--danger)', fontSize: 'var(--fs-sm)', fontWeight: 600 }}>{error}</div>
          )}

          {(step === 'pin' || step === 'confirm') && (
            <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
              {[0,1,2,3].map(i => (
                <div key={i} style={{
                  width: 14, height: 14, borderRadius: '50%',
                  background: i < current.length ? 'var(--accent)' : 'var(--dim)',
                  transition: 'background 0.1s',
                }} />
              ))}
            </div>
          )}
        </div>

        {(step === 'pin' || step === 'confirm') && (
          <div style={{ padding: '8px 20px 20px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {keys.map((k, i) => {
              if (k === '') return <div key={i} />;
              const isBack = k === 'X';
              return (
                <button key={i} type="button" onClick={() => isBack ? back() : press(k)}
                  aria-label={isBack ? 'حذف' : k}
                  style={{
                    height: 52, borderRadius: 'var(--r-md)',
                    background: isBack ? 'transparent' : 'var(--input-bg)',
                    border: isBack ? 'none' : '1px solid var(--border)',
                    fontSize: 'var(--fs-lg)', fontWeight: 700,
                    color: isBack ? 'var(--muted)' : 'var(--text)',
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                  {isBack ? '⌫' : k}
                </button>
              );
            })}
          </div>
        )}

        {step === 'recovery' && (
          <div style={{ padding: '8px 20px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button type="button" onClick={() => {
              try { navigator.clipboard.writeText(recoveryCode); } catch {}
            }}
              style={{ padding: 10, background: 'var(--btn-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', color: 'var(--text)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: 'var(--fs-sm)' }}>
              📋 کپی کد
            </button>
            <button type="button" onClick={finishSetup} disabled={saving}
              style={{ padding: 12, background: 'var(--accent)', border: 'none', borderRadius: 'var(--r-md)', color: 'white', cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 'var(--fs-base)', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'در حال ذخیره...' : '✅ ذخیره کردم، فعال کن'}
            </button>
          </div>
        )}

        {step === 'pin' && pin.length === 4 && (
          <div style={{ padding: '0 20px 20px' }}>
            <button type="button" onClick={nextFromPin}
              style={{ width: '100%', padding: 12, background: 'var(--accent)', border: 'none', borderRadius: 'var(--r-md)', color: 'white', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>
              ادامه
            </button>
          </div>
        )}

        {step === 'confirm' && confirm.length === 4 && (
          <div style={{ padding: '0 20px 20px' }}>
            <button type="button" onClick={nextFromConfirm}
              style={{ width: '100%', padding: 12, background: 'var(--accent)', border: 'none', borderRadius: 'var(--r-md)', color: 'white', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>
              ادامه
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
