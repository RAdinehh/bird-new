/**
 * helpers.tsx — ماژول cal
 */
import type { ReactNode, CSSProperties } from 'react';
import { Btn, BtnRow, Field, Grid2, Input, Modal, Select } from '../../shr/components/ui';
import { toFa } from '../../shr/utils/fa';
import { TYPE_OPTIONS, type ManualEvent, useManual } from './manual';
import { TYPE_COLORS, TYPE_LABELS, collectEvents, eventsOfDay, statusOf, todayJalali, type CalEvent, type EventType } from './store';

export function AutoEventCard({ event }: { event: CalEvent }) {
  const colors = TYPE_COLORS[event.type];

  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-lg)',
      padding: 'var(--pad-comfy)',
      display: 'flex',
      gap: 12,
      alignItems: 'flex-start',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0, width: 4,
        background: colors.dot
      }} />

      <div style={{
        width: 40, height: 40,
        borderRadius: 'var(--r-md)',
        background: colors.bg,
        color: colors.text,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 'var(--fs-md)', flexShrink: 0
      }}>
        {event.icon}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 'var(--fs-base)', fontWeight: 700, marginBottom: 4,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
        }}>
          {event.title}
        </div>
        <div style={{
          fontSize: 'var(--fs-xs)', color: 'var(--muted)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
        }}>
          {event.subtitle}
        </div>
        <div style={{
          fontSize: 'var(--fs-xs)', color: 'var(--dim)', marginTop: 4,
          display: 'flex', gap: 8
        }}>
          <span style={{ color: colors.text }}>🏷 {TYPE_LABELS[event.type]}</span>
        </div>
      </div>
    </div>
  );
}
