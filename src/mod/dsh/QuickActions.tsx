// QuickActions.tsx - بخش 9: دسترسی سریع
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SectionTitle } from './cards';
import { OptionIcon } from '../../shr/components/OptionIcon';

function QuickAction({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <div
      role="button"
      tabIndex={0}
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
      <OptionIcon icon={icon} size={22} />
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
      <SectionTitle icon="stats">دسترسی سریع</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
        <QuickAction icon="chicken" label="پرنده و نژاد" onClick={() => nav('/brd')} />
        <QuickAction icon="hall" label="سالن‌ها" onClick={() => nav('/hal')} />
        <QuickAction icon="flock" label="گله‌ها" onClick={() => nav('/flk')} />
        <QuickAction icon="inventory" label="انبار" onClick={() => nav('/whs')} />
        <QuickAction icon="daily_log" label="ثبت روزانه" onClick={() => nav('/dlg')} />
        <QuickAction icon="cash" label="معاملات" onClick={() => nav('/tra')} />
      </div>
    </>
  );
}
