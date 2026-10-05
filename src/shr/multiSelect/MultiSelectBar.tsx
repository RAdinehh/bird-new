/**
 * MultiSelectBar — نوار شناور پایین صفحه برای Multi-Select
 *
 * نمایش خودکار وقتی تعداد انتخاب > 0
 * شامل: شمارش + لغو + اکشن سفارشی + آرشیو + حذف
 */
import type { MultiSelectState } from './useMultiSelect';

interface Props<T> {
  ms: MultiSelectState<T>;
  /** متن اکشن سفارشی (اگه توی hook پاس شده باشه، خودش میاد) */
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
    flex: 1,
    padding: '12px 14px',
    background: 'var(--input-bg)',
    border: '1px solid var(--border)',
    borderRadius: 14,
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
  };

  return (
    <div
      role="toolbar"
      aria-label="اکشن‌های گروهی"
      style={{
        position: 'fixed',
        bottom: 80,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        maxWidth: 460,
        width: 'calc(100% - 20px)',
        background: 'var(--card-solid)',
        border: '1px solid ' + (ms.customAction?.danger ? 'var(--danger)' : 'rgba(59,130,246,0.4)'),
        borderRadius: 22,
        boxShadow: '0 16px 44px rgba(0,0,0,0.22), 0 4px 12px rgba(0,0,0,0.1)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        minHeight: 72,
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
        style={{
          ...btnBase,
          background: 'transparent',
          color: 'var(--muted)',
        }}
        aria-label="لغو انتخاب"
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

      {ms.hasArchive && (
        <button
          type="button"
          onClick={ms.doArchive}
          style={btnBase}
          aria-label={archiveLabel}
        >
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
          aria-label={deleteLabel}
        >
          🗑 {deleteLabel}
        </button>
      )}
    </div>
  );
}
