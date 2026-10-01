import React from 'react';

interface UndoBarProps {
  label: string;
  onUndo: () => void;
  onDismiss?: () => void;
}

export default function UndoBar({ label, onUndo, onDismiss }: UndoBarProps) {
  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px',
        marginBottom: 8,
        background: 'var(--warn-soft)',
        border: '1px solid var(--warn)',
        borderRadius: 'var(--r-md)',
        fontSize: 'var(--fs-sm)',
        gap: 8,
      }}
    >
      <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <button
        type="button"
        onClick={onUndo}
        aria-label="بازگردانی"
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--warn)',
          fontWeight: 700,
          cursor: 'pointer',
          fontFamily: 'inherit',
          fontSize: 'var(--fs-sm)',
          padding: '4px 10px',
          flexShrink: 0,
        }}
      >
        بازگردانی
      </button>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="بستن"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--muted)',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 14,
            padding: '2px 6px',
            flexShrink: 0,
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}
