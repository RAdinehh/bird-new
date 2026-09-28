import { useDialog } from '../../cor/store/dialog';

export default function DialogHost() {
  const { open, config, close } = useDialog();

  if (!open || !config) return null;

  const { type, title, message, confirmText, cancelText, onConfirm, onCancel } = config;
  const isConfirm = type === 'confirm' || type === 'danger';

  const iconMap: Record<string, string> = {
    alert: '⚠',
    success: '✓',
    error: '✕',
    info: 'ℹ',
    confirm: '؟',
    danger: '🗑'
  };

  const toneMap: Record<string, string> = {
    alert: 'warn',
    success: 'accent',
    error: 'danger',
    info: 'info',
    confirm: 'info',
    danger: 'danger'
  };

  const tone = toneMap[type] || 'info';
  const icon = iconMap[type] || 'ℹ';

  // دکمه‌ی تأیید: فقط برای danger قرمز، بقیه سبز (رنگ برند)
  const confirmBtnBg = type === 'danger' ? 'var(--danger)' : 'var(--accent)';
  const confirmBtnText = type === 'danger' ? '#fff' : 'var(--avatar-text)';

  const handleConfirm = () => {
    close();
    setTimeout(() => { if (onConfirm) onConfirm(); }, 120);
  };

  const handleCancel = () => {
    close();
    setTimeout(() => { if (onCancel) onCancel(); }, 120);
  };

  const handleBackdrop = () => {
    if (isConfirm) handleCancel();
    else handleConfirm();
  };

  return (
    <>
      <style>{`
        @keyframes pmDlgFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pmDlgScale {
          0% { transform: scale(.92); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <div
        onClick={handleBackdrop}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'var(--overlay)',
          zIndex: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          animation: 'pmDlgFade .15s ease-out'
        }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            background: 'var(--card-solid)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: '20px 20px 16px',
            width: '100%',
            maxWidth: 300,
            boxShadow: '0 16px 48px rgba(0,0,0,.25)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
            animation: 'pmDlgScale .22s cubic-bezier(.16,1,.3,1)'
          }}
        >
          {/* آیکون کوچک و ملایم */}
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'var(--' + tone + '-soft)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            color: 'var(--' + tone + ')',
            fontWeight: 600,
            flexShrink: 0
          }}>
            {icon}
          </div>

          {/* عنوان */}
          {title ? (
            <div style={{
              fontSize: 'var(--fs-md)',
              fontWeight: 700,
              color: 'var(--text)',
              textAlign: 'center',
              lineHeight: 1.5
            }}>
              {title}
            </div>
          ) : null}

          {/* پیام */}
          {message ? (
            <div style={{
              fontSize: 'var(--fs-sm)',
              color: 'var(--muted)',
              textAlign: 'center',
              lineHeight: 1.8,
              maxWidth: '100%',
              wordBreak: 'break-word',
              whiteSpace: 'pre-line'
            }}>
              {message}
            </div>
          ) : null}

          {/* دکمه‌ها */}
          <div style={{
            display: 'flex',
            gap: 8,
            width: '100%',
            marginTop: 6
          }}>
            {isConfirm ? (
              <>
                <button
                  type="button"
                  onClick={handleConfirm}
                  style={{
                    flex: 1,
                    height: 40,
                    background: confirmBtnBg,
                    color: confirmBtnText,
                    border: 'none',
                    borderRadius: 10,
                    fontFamily: 'inherit',
                    fontSize: 'var(--fs-sm)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'transform .1s'
                  }}
                >
                  {confirmText || 'تأیید'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  style={{
                    flex: 1,
                    height: 40,
                    background: 'var(--btn-bg)',
                    color: 'var(--muted)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    fontFamily: 'inherit',
                    fontSize: 'var(--fs-sm)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'transform .1s'
                  }}
                >
                  {cancelText || 'لغو'}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleConfirm}
                style={{
                  flex: 1,
                  height: 40,
                  background: confirmBtnBg,
                  color: confirmBtnText,
                  border: 'none',
                  borderRadius: 10,
                  fontFamily: 'inherit',
                  fontSize: 'var(--fs-sm)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'transform .1s'
                }}
              >
                {confirmText || 'تأیید'}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
