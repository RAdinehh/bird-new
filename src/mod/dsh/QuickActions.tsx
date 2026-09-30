// QuickActions.tsx - بخش 9: دسترسی سریع
import { useNavigate } from 'react-router-dom';
import { SectionTitle } from '../../shr/components/ui';

function QuickAction({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-md)',
        padding: '8px 6px',
        textAlign: 'center',
        cursor: 'pointer'
      }}
    >
      <div style={{ fontSize: 'var(--fs-xl)' }}>{icon}</div>
      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text)', marginTop: 4, fontWeight: 600 }}>
        {label}
      </div>
    </div>
  );
}

export default function QuickActions() {
  const nav = useNavigate();
  return (
    <>
            <SectionTitle>⚡ دسترسی سریع</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
              <QuickAction icon="📋" label="ثبت روزانه" onClick={() => nav('/dlg')} />
              <QuickAction icon="🥚" label="جوجه‌کشی" onClick={() => nav('/inc')} />
              <QuickAction icon="🛒" label="معاملات" onClick={() => nav('/tra')} />
              <QuickAction icon="🥚" label="تخم" onClick={() => nav('/egg')} />
              <QuickAction icon="🌾" label="جیره" onClick={() => nav('/fed')} />
              <QuickAction icon="📊" label="گزارش" onClick={() => nav('/rep')} />
            </div>
    </>
  );
}