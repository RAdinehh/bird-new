import { useState } from 'react';
import { PageContainer, Btn } from '../../../shr/components/ui';
import { GUIDE_CONTENT } from './content';
import type { GuideChapter, GuideSection } from './types';

function CalloutBox({ tone, text }: { tone: string; text: string }) {
  const colors: Record<string, { bg: string; color: string; icon: string }> = {
    info:    { bg: 'rgba(2,132,199,.08)',   color: 'var(--info)',   icon: 'ℹ️' },
    warn:    { bg: 'rgba(217,119,6,.08)',   color: 'var(--warn)',   icon: '⚠️' },
    accent:  { bg: 'var(--accent-soft)',    color: 'var(--accent)', icon: '✅' },
    danger:  { bg: 'rgba(220,38,38,.08)',   color: 'var(--danger)', icon: '🚨' },
  };
  const c = colors[tone] || colors.info;
  return (
    <div style={{
      display: 'flex',
      gap: 8,
      padding: '10px 12px',
      background: c.bg,
      borderRadius: 'var(--r-md)',
      color: c.color,
      fontSize: 'var(--fs-sm)',
      lineHeight: 1.8,
      fontWeight: 600,
    }}>
      <span style={{ flexShrink: 0 }}>{c.icon}</span>
      <span>{text}</span>
    </div>
  );
}

function SectionView({ section }: { section: GuideSection }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      padding: '14px 16px',
      background: 'var(--card-solid)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-md)',
    }}>
      <div style={{
        fontSize: 'var(--fs-md)',
        fontWeight: 700,
        color: 'var(--text)',
        marginBottom: 2,
      }}>{section.title}</div>

      {section.paragraphs?.map((p, i) => (
        <div key={i} style={{
          fontSize: 'var(--fs-base)',
          color: 'var(--text)',
          lineHeight: 1.9,
        }}>{p}</div>
      ))}

      {section.bullets && section.bullets.length > 0 && (
        <ul style={{
          margin: 0,
          paddingRight: 20,
          fontSize: 'var(--fs-base)',
          lineHeight: 2,
          color: 'var(--text)',
        }}>
          {section.bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      )}

      {section.table && (
        <div style={{
          overflowX: 'auto',
          borderRadius: 'var(--r-sm)',
          border: '1px solid var(--border)',
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 'var(--fs-sm)',
          }}>
            <thead>
              <tr style={{ background: 'var(--input-bg)' }}>
                {section.table.headers.map((h, i) => (
                  <th key={i} style={{
                    padding: '8px 10px',
                    textAlign: 'right',
                    fontWeight: 700,
                    color: 'var(--text)',
                    borderBottom: '1px solid var(--border)',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {section.table.rows.map((row, i) => (
                <tr key={i} style={{
                  background: i % 2 === 1 ? 'var(--input-bg)' : 'transparent',
                }}>
                  {row.map((cell, j) => (
                    <td key={j} style={{
                      padding: '8px 10px',
                      color: 'var(--text)',
                      borderBottom: '1px solid var(--border)',
                    }}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {section.callout && (
        <CalloutBox tone={section.callout.tone} text={section.callout.text} />
      )}

      {section.source && (
        <div style={{
          fontSize: 'var(--fs-xs)',
          color: 'var(--muted)',
          fontStyle: 'italic',
          paddingTop: 4,
          borderTop: '1px dashed var(--border)',
        }}>
          📚 منبع: {section.source}
        </div>
      )}
    </div>
  );
}

function ChapterView({
  chapter,
  onBack,
}: {
  chapter: GuideChapter;
  onBack: () => void;
}) {
  return (
    <PageContainer>
      <button
        type="button"
        onClick={onBack}
        style={{
          padding: '8px 12px',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)',
          color: 'var(--text)',
          fontFamily: 'inherit',
          fontSize: 'var(--fs-sm)',
          fontWeight: 600,
          cursor: 'pointer',
          marginBottom: 10,
        }}
      >
        ← بازگشت
      </button>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
      }}>
        <span style={{ fontSize: 28 }}>{chapter.icon}</span>
        <div>
          <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 800, color: 'var(--text)' }}>
            {chapter.title}
          </div>
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>
            {chapter.subtitle}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {chapter.sections.map((section, i) => (
          <SectionView key={i} section={section} />
        ))}
      </div>
    </PageContainer>
  );
}

export default function GuideTab() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedChapter = selectedId
    ? GUIDE_CONTENT.chapters.find(c => c.id === selectedId)
    : null;

  if (selectedChapter) {
    return <ChapterView chapter={selectedChapter} onBack={() => setSelectedId(null)} />;
  }

  return (
    <PageContainer>
      <div style={{
        padding: '12px 14px',
        background: 'var(--accent-soft)',
        border: '1px solid var(--accent-border)',
        borderRadius: 'var(--r-md)',
        marginBottom: 12,
      }}>
        <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--accent)' }}>
          📖 راهنمای علمی مدیریت مرغداری
        </div>
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent)', marginTop: 4, lineHeight: 1.7 }}>
          ۷ فصل — استانداردها، تجهیزات، محاسبات، منابع. نسخه {GUIDE_CONTENT.version} — به‌روزرسانی {GUIDE_CONTENT.lastUpdated}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {GUIDE_CONTENT.chapters.map((ch) => (
          <button
            key={ch.id}
            type="button"
            onClick={() => setSelectedId(ch.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 14px',
              background: 'var(--card-solid)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)',
              color: 'var(--text)',
              fontFamily: 'inherit',
              textAlign: 'right',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(15,23,42,.05)',
            }}
          >
            <span style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'var(--input-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              flexShrink: 0,
            }}>{ch.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 'var(--fs-base)', fontWeight: 700 }}>
                {ch.title}
              </div>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 2 }}>
                {ch.subtitle}
              </div>
            </div>
            <span style={{ color: 'var(--muted)', fontSize: 18 }}>‹</span>
          </button>
        ))}
      </div>
    </PageContainer>
  );
}
