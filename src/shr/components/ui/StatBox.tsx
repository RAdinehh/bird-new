/** StatBox — نمایش آمار کوچک و inline (مثلاً: 🧬 تعداد نژاد: ۵) */
export function StatBox({ icon, value, label, tone = 'default' }: { icon?: string; value: string; label: string; tone?: 'default' | 'accent' | 'warn' | 'danger' | 'info' | 'purple' }) {
  const colorMap: Record<string, string> = {
    default: 'var(--text)',
    accent: 'var(--accent)',
    warn: 'var(--warn)',
    danger: 'var(--danger)',
    info: 'var(--info)',
    purple: 'var(--purple)',
  };
  const fg = colorMap[tone] || colorMap.default;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, whiteSpace: 'nowrap', maxWidth: '40%', overflow: 'hidden' }}>
      {icon && <span style={{ flexShrink: 0 }}>{icon}</span>}
      <span style={{ color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}:</span>
      <b style={{ color: fg, fontWeight: 700, direction: 'ltr', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</b>
    </span>
  );
}
