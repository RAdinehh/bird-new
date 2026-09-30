/**
 * helpers.tsx — ماژول doc
 */
import type { CSSProperties } from 'react';
import { Dot, StatBox } from '../../shr/components/ExpandableCard';
import { Btn, BtnRow, Empty, Field, Input, Modal, PageContainer, Select } from '../../shr/components/ui';
import { toFa } from '../../shr/utils/fa';
import { CATEGORY_ICON, CATEGORY_LABEL, LINKED_TYPE_LABEL, addFile, deleteFile, downloadFile, fileCategory, formatSize, listFiles, openFile, totalSize, type DocCategory, type DocFile } from './store';

export function GridCard({ file, onPreview, onDelete }: { file: DocFile; onPreview: () => void; onDelete: () => void }) {
  const isImg = file.category === 'image';
  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-lg)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <button
        type="button"
        onClick={onPreview}
        style={{
          height: 110,
          background: 'var(--input-bg)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 40,
          padding: 0,
          overflow: 'hidden'
        }}
      >
        {isImg ? (
          <img
            src={URL.createObjectURL(file.blob)}
            alt={file.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          CATEGORY_ICON[file.category]
        )}
      </button>
      <div style={{ padding: 'var(--pad-normal)', flex: 1 }}>
        <div style={{
          fontSize: 'var(--fs-xs)',
          fontWeight: 700,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>{file.name}</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
          {formatSize(file.size)}
        </div>
        <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
          <button type="button" onClick={onPreview} style={iconBtn}>👁</button>
          <button type="button" onClick={onDelete} style={iconBtn}>🗑</button>
        </div>
      </div>
    </div>
  );
}

export function ListCard({ file, onPreview, onDelete }: { file: DocFile; onPreview: () => void; onDelete: () => void }) {
  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-lg)',
      padding: 'var(--pad-normal)',
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }}>
      <button
        type="button"
        onClick={onPreview}
        style={{
          width: 48, height: 48,
          borderRadius: 'var(--r-md)',
          background: 'var(--input-bg)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 'var(--fs-xl)',
          flexShrink: 0,
          padding: 0,
          overflow: 'hidden'
        }}
      >
        {file.category === 'image' ? (
          <img
            src={URL.createObjectURL(file.blob)}
            alt={file.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          CATEGORY_ICON[file.category]
        )}
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 'var(--fs-sm)',
          fontWeight: 700,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>{file.name}</div>
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 2 }}>
          {formatSize(file.size)} · {CATEGORY_LABEL[file.category]}
        </div>
      </div>
      <button type="button" onClick={onDelete} style={iconBtn}>🗑</button>
    </div>
  );
}

export const iconBtn: CSSProperties = {
  width: 30, height: 36,
  borderRadius: 8,
  background: 'var(--btn-bg)',
  border: '1px solid var(--border)',
  color: 'var(--muted)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 'var(--fs-base)',
  padding: 0,
  flexShrink: 0
};

export const fabStyle: CSSProperties = {
  position: 'fixed',
  bottom: 90,
  left: 16,
  width: 52, height: 52,
  borderRadius: 16,
  background: 'var(--accent)',
  color: 'var(--avatar-text)',
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: 'var(--shadow)',
  zIndex: 30
};

export function chip(active: boolean): CSSProperties {
  return {
    padding: '6px 11px',
    fontSize: 'var(--fs-sm)',
    background: active ? 'var(--accent-soft)' : 'var(--btn-bg)',
    border: '1px solid ' + (active ? 'var(--accent-border)' : 'var(--border)'),
    borderRadius: 8,
    color: active ? 'var(--accent)' : 'var(--muted)',
    fontWeight: active ? 600 : 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap'
  };
}
