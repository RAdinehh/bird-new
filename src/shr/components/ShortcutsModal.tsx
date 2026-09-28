import { useUI } from '../../cor/store/ui';
import { Btn, Modal } from './ui';

const SHORTCUTS: { group: string; items: [string, string][] }[] = [
  {
    group: 'عمومی',
    items: [
      ['Ctrl + H', 'باز کردن راهنما'],
      ['?', 'لیست میان‌برها'],
      ['Esc', 'بستن پنجره'],
      ['Ctrl + F', 'جستجو در صفحه']
    ]
  },
  {
    group: 'ناوبری سریع',
    items: [
      ['Ctrl + 1', 'داشبورد'],
      ['Ctrl + 2', 'پرنده‌ها'],
      ['Ctrl + 3', 'سالن‌ها'],
      ['Ctrl + 4', 'گله‌ها'],
      ['Ctrl + 5', 'جوجه‌کشی'],
      ['Ctrl + 6', 'ثبت روزانه'],
      ['Ctrl + 7', 'انبار'],
      ['Ctrl + 8', 'گزارش‌ها'],
      ['Ctrl + 9', 'تنظیمات']
    ]
  }
];

export default function ShortcutsModal() {
  const { shortcutsOpen, closeShortcuts } = useUI();

  return (
    <Modal
      open={shortcutsOpen}
      onClose={closeShortcuts}
      title="⌨ میان‌برهای کیبورد"
      footer={<Btn variant="primary" full onClick={closeShortcuts}>فهمیدم</Btn>}
    >
      {SHORTCUTS.map(sec => (
        <div key={sec.group}>
          <div style={{
            fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--muted)',
            padding: '4px 0 8px'
          }}>{sec.group}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {sec.items.map(([key, label]) => (
              <div key={key} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 12px',
                background: 'var(--input-bg)',
                borderRadius: 'var(--r-sm)'
              }}>
                <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text)' }}>{label}</span>
                <span style={{
                  fontFamily: 'monospace',
                  fontSize: 'var(--fs-xs)',
                  background: 'var(--btn-bg)',
                  border: '1px solid var(--border)',
                  padding: '3px 8px',
                  borderRadius: 6,
                  color: 'var(--accent)',
                  fontWeight: 700,
                  direction: 'ltr'
                }}>{key}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </Modal>
  );
}
