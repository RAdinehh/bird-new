/**
 * MultiSelectBar — نوار شناور پایین صفحه برای Multi-Select
 *
 * از createPortal استفاده می‌کنه تا از هر محدودیت parent آزاد باشه.
 */
import { createPortal } from 'react-dom';
import type { MultiSelectState } from './useMultiSelect';

interface Props<T> {
  ms: MultiSelectState<T>;
  deleteLabel?: string;
  archiveLabel?: string;
}

export default function MultiSelectBar<T>({
  ms,
  deleteLabel = 'حذف',
  archiveLabel = 'آرشیو',
}: Props<T>) {
  if (!ms.selectionMode || ms.count === 0) return null;

  const btnBase: React.CSSProperties = {
    flexShrink: 0,
    padding: '10px 14px',
    background: 'var(--input-bg)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    color: 'var(--text)',
    fontFamily: 'inherit',
    fontSize: 'var(--fs-sm)',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 44,
    whiteSpace: 'nowrap',
  };

  const bar = (
    <div
      role="toolbar"
      aria-label="اکشن‌های گروهی"
      style={{
        position: 'fixed',
        bottom: 90,
        left: 10,
        right: 10,
        zIndex: 99999,
        background: 'var(--card-solid)',
        border: '1px solid ' + (ms.customAction?.danger ? 'var(--danger)' : 'rgba(59,130,246,0.4)'),
        borderRadius: 22,
        boxShadow: '0 16px 44px rgba(0,0,0,0.22), 0 4px 12px rgba(0,0,0,0.1)',
        padding: '10px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        maxWidth: 480,
        margin: '0 auto',
        direction: 'rtl',
        overflowX: 'auto',
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <span
        style={{
          fontSize: 'var(--fs-sm)',
          fontWeight: 700,
          color: 'var(--info)',
          paddingLeft: 4,
          whiteSpace: 'nowrap',
        }}
      >
        {ms.count} انتخاب
      </span>

      <button
        type="button"
        onClick={ms.exitSelection}
        style={{ ...btnBase, background: 'transparent', color: 'var(--muted)' }}
      >
        لغو
      </button>

      {ms.customAction && (
        <button
          type="button"
          onClick={ms.doCustom}
          style={{
            ...btnBase,
            color: ms.customAction.danger ? 'var(--danger)' : 'var(--text)',
            background: ms.customAction.danger ? 'rgba(220,38,38,0.1)' : 'var(--input-bg)',
            border: '1px solid ' + (ms.customAction.danger ? 'var(--danger)' : 'var(--border)'),
          }}
        >
          {ms.customAction.icon && <span>{ms.customAction.icon}</span>}
          <span>{ms.customAction.label}</span>
        </button>
      )}

      {ms.customActions && ms.customActions.map(a => (
        <button
          key={a.key}
          type="button"
          onClick={() => ms.doCustomByKey(a.key)}
          style={{
            ...btnBase,
            color: a.danger ? 'var(--danger)' : 'var(--text)',
            background: a.danger ? 'rgba(220,38,38,0.1)' : 'var(--input-bg)',
            border: '1px solid ' + (a.danger ? 'var(--danger)' : 'var(--border)'),
          }}
        >
          {a.icon && <span>{a.icon}</span>}
          <span>{a.label}</span>
        </button>
      ))}

      {ms.hasArchive && (
        <button type="button" onClick={ms.doArchive} style={btnBase}>
          📦 {archiveLabel}
        </button>
      )}

      {ms.hasDelete && (
        <button
          type="button"
          onClick={ms.doDelete}
          style={{
            ...btnBase,
            background: 'rgba(220,38,38,0.1)',
            border: '1px solid var(--danger)',
            color: 'var(--danger)',
            fontWeight: 700,
          }}
        >
          🗑 {deleteLabel}
        </button>
      )}
    </div>
  );

  return createPortal(bar, document.body);
}
