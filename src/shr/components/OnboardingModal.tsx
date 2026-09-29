import { useState } from 'react';
import { Btn } from './ui';

const TYPES = [
  { id: 'layer', label: 'تخم‌گذار', icon: '🥚' },
  { id: 'broiler', label: 'گوشتی', icon: '🍗' },
  { id: 'breeder', label: 'مادر', icon: '🐣' },
  { id: 'hatchery', label: 'جوجه‌کشی', icon: '🥚' },
];

export default function OnboardingModal({ onClose, onFinish }: { onClose: () => void; onFinish: (t: string) => void }) {
  const [step, setStep] = useState(0);
  const [ft, setFt] = useState('layer');
  const total = 3;

  const titles = ['خوش آمدید', 'نوع فعالیت', 'آماده شروع'];
  const bodies = [
    'این نرم‌افزار برای مدیریت کامل مرغداری طراحی شده. همه چیز آفلاین کار می‌کند.',
    'بر اساس انتخاب شما، تنظیمات پیش‌فرض شخصی‌سازی می‌شود.',
    'پیشنهاد: از تعریف پرنده و سالن شروع کنید. دکمه «؟» در هر صفحه راهنما دارد.',
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'var(--overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'var(--card-solid)', border: '1px solid var(--border)', borderRadius: 'var(--r-2xl)', width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700 }}>مرحله {step + 1} از {total}</div>
          <button onClick={onClose} aria-label="بستن" style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 18, padding: 4 }}>✕</button>
        </div>
        <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
          <div style={{ fontSize: 56, width: 100, height: 100, background: 'var(--accent-soft)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{step === 0 ? '👋' : step === 1 ? '🐔' : '✨'}</div>
          <div style={{ fontSize: 'var(--fs-xl)', fontWeight: 700, textAlign: 'center' }}>{titles[step]}</div>
          <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)', textAlign: 'center', lineHeight: 1.9 }}>{bodies[step]}</div>
          {step === 1 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, width: '100%' }}>
              {TYPES.map(t => (
                <button key={t.id} onClick={() => setFt(t.id)} style={{ padding: '10px', background: ft === t.id ? 'var(--accent-soft)' : 'var(--input-bg)', border: '1.5px solid ' + (ft === t.id ? 'var(--accent-border)' : 'var(--border)'), borderRadius: 'var(--r-md)', cursor: 'pointer', fontFamily: 'inherit', color: ft === t.id ? 'var(--accent)' : 'var(--text)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 20 }}>{t.icon}</span>
                  <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 700 }}>{t.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', padding: '4px 20px' }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ width: i === step ? 20 : 8, height: 8, borderRadius: 4, background: i === step ? 'var(--accent)' : 'var(--dim)' }} />
          ))}
        </div>
        <div style={{ padding: '16px 20px 20px', display: 'flex', gap: 8, borderTop: '1px solid var(--border)' }}>
          {step > 0 && <Btn onClick={() => setStep(s => s - 1)} style={{ flex: 1 }}>قبلی</Btn>}
          {step < 2 ? <Btn variant="primary" onClick={() => setStep(s => s + 1)} style={{ flex: 1 }}>بعدی</Btn> : <Btn variant="primary" onClick={() => onFinish(ft)} style={{ flex: 1 }}>شروع کار</Btn>}
        </div>
      </div>
    </div>
  );
}
