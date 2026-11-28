import React from 'react';
import { AppIcon, isValidIconKey } from '../icons/AppIcons';

interface OptionIconProps {
  icon?: string | React.ReactNode;
  size?: number;
  color?: string;
  style?: React.CSSProperties;
}

const EMOJI_FONT = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';

import { EMOJI_BY_ICON_KEY as ICON_KEY_TO_EMOJI } from './uiIconRegistry';

export function OptionIcon({ icon, size = 22, color = 'currentColor', style }: OptionIconProps) {
  if (!icon) return null;

  if (typeof icon === 'string') {
    const trimmed = icon.trim() === '🐦' ? 'quail' : icon.trim();
    const emoji = ICON_KEY_TO_EMOJI[trimmed];
    const isRawKeyLike = /^[a-z0-9_-]+$/i.test(trimmed);
    if (!emoji && (isValidIconKey(trimmed) || isRawKeyLike)) {
      return (
        <span
          aria-hidden="true"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: size,
            height: size + 4,
            verticalAlign: "middle",
            flexShrink: 0,
            userSelect: "none",
            ...style,
          }}
        >
          <AppIcon name={trimmed} size={Math.round(size * 1.1)} />
        </span>
      );
    }
    return (
      <span
        aria-hidden="true"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: size,
          height: size + 4,
          fontSize: Math.round(size * 0.85),
          fontFamily: EMOJI_FONT,
          lineHeight: 1.25,
          overflow: 'visible',
          verticalAlign: 'middle',
          flexShrink: 0,
          userSelect: 'none',
          ...style,
        }}
      >
        {emoji || trimmed}
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        color,
        flexShrink: 0,
        ...style,
      }}
    >
      {icon}
    </span>
  );
}
