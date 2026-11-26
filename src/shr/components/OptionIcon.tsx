import React from 'react';
import { AppIcon, AppIconKey, isValidIconKey } from '../icons/AppIcons';

export interface OptionIconProps {
  icon?: React.ReactNode | AppIconKey;
  size?: number;
  color?: string;
  style?: React.CSSProperties;
}

export function OptionIcon({ icon, size = 19, color = 'currentColor', style }: OptionIconProps) {
  if (!icon) return null;

  if (typeof icon === 'string' && isValidIconKey(icon)) {
    return (
      <span
        aria-hidden="true"
        style={{
          width: size,
          height: size,
          color: color,
          flexShrink: 0,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...style,
        }}
      >
        <AppIcon name={icon} size={size} />
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      style={{
        fontSize: typeof icon === 'string' ? size : undefined,
        lineHeight: 1,
        color: color,
        flexShrink: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      {icon}
    </span>
  );
}
