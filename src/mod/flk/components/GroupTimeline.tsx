/**
 * GroupTimeline.tsx — Gantt تاریخچه عضویت گله‌ها در گروه
 */
import { useMemo } from 'react';
import { useFlk, jalaliToDate } from '../store';
import { todayJ } from '../api/flocksCalc';
import { toFa } from '../../../shr/utils/fa';

interface Props {
  groupId: string;
}

interface TimelineRow {
  flockId: string;
  flockName: string;
  joinedAt: string;
  leftAt?: string;
  startOffset: number;
  endOffset: number;
  isActive: boolean;
}

function daysDiff(from: string, to: string): number {
  const d1 = jalaliToDate(from);
  const d2 = jalaliToDate(to);
  if (!d1 || !d2) return 0;
  return Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

export default function GroupTimeline({ groupId }: Props) {
  const groups = useFlk(s => s.groups);
  const groupMembers = useFlk(s => s.groupMembers);
  const flocks = useFlk(s => s.flocks);

  const today = todayJ();

  const rows = useMemo<TimelineRow[]>(() => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return [];

    const members = groupMembers
      .filter(m => m.groupId === groupId)
      .map(m => {
        const flock = flocks.find(f => f.id === m.flockId);
        if (!flock) return null;
        const joined = m.joinedAt?.slice(0, 10) || '';
        const left = m.leftAt?.slice(0, 10);
        const isActive = !left;
        const endDate = left || today;
        const startOffset = daysDiff(today, joined);
        const endOffset = daysDiff(today, endDate);
        return {
          flockId: m.flockId,
          flockName: flock.name,
          joinedAt: joined,
          leftAt: left,
          startOffset,
          endOffset,
          isActive,
        };
      })
      .filter(Boolean) as TimelineRow[];

    return members.sort((a, b) => a.startOffset - b.startOffset);
  }, [groupId, groups, groupMembers, flocks, today]);

  if (rows.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>📅</div>
        <div>هیچ تاریخچه‌ای برای این گروه نیست</div>
      </div>
    );
  }

  const minOffset = Math.min(...rows.map(r => Math.min(r.startOffset, r.endOffset)));
  const maxOffset = Math.max(...rows.map(r => Math.max(r.startOffset, r.endOffset, 0)));
  const range = Math.max(1, maxOffset - minOffset);
  const todayPos = ((0 - minOffset) / range) * 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--muted)', paddingBottom: 4 }}>
        <span>قدیمی‌ترین</span>
        <span>امروز</span>
        <span>جدیدترین</span>
      </div>

      <div style={{ position: 'relative', padding: '8px 0' }}>
        <div style={{
          position: 'absolute',
          top: 0, bottom: 0,
          right: `${todayPos}%`,
          width: 2,
          background: 'var(--danger)',
          opacity: 0.4,
          zIndex: 1,
        }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {rows.map(r => {
            const start = ((r.startOffset - minOffset) / range) * 100;
            const end = ((r.endOffset - minOffset) / range) * 100;
            const width = Math.max(2, end - start);
            const isActive = r.isActive;

            return (
              <div
                key={r.flockId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  position: 'relative',
                  height: 28,
                }}
              >
                <span style={{
                  width: 90,
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--text)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}>
                  {r.flockName}
                </span>
                <div style={{ position: 'relative', flex: 1, height: 20 }}>
                  <div style={{
                    position: 'absolute',
                    top: 0, bottom: 0,
                    right: `${start}%`,
                    width: `${width}%`,
                    background: isActive ? 'var(--accent)' : 'var(--muted)',
                    opacity: isActive ? 0.8 : 0.5,
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 9,
                    color: 'white',
                    fontWeight: 700,
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                  }}>
                    {toFa(Math.abs(r.endOffset - r.startOffset))} روز
                  </div>
                </div>
                <div style={{ width: 110, fontSize: 10, color: 'var(--muted)', flexShrink: 0, textAlign: 'left' }}>
                  {toFa(r.joinedAt)} {r.leftAt ? '→ ' + toFa(r.leftAt) : '→ امروز'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)', fontSize: 10, color: 'var(--muted)' }}>
        🟢 فعال (هنوز در گروه) · ⚪ خارج شده · خط قرمز = امروز
      </div>
    </div>
  );
}
