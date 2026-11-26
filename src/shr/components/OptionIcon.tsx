import React from 'react';
import { AppIcon, isValidIconKey } from '../icons/AppIcons';

interface OptionIconProps {
  icon?: string | React.ReactNode;
  size?: number;
  color?: string;
  style?: React.CSSProperties;
}

export function OptionIcon({ icon, size = 22, color = 'currentColor', style }: OptionIconProps) {
  if (!icon) return null;

  if (typeof icon === 'string') {
    const trimmed = icon.trim();
    if (typeof trimmed === 'string' && isValidIconKey(trimmed)) {
      const scaledSize = Math.round(size * 1.12);
      return <AppIcon name={trimmed} size={scaledSize} style={style} />;
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
          fontSize: Math.round(size * 0.9),
          lineHeight: 1,
          flexShrink: 0,
          ...style,
        }}
      >
        {trimmed}
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
