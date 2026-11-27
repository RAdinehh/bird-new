import React from 'react';
import { AppIcon, isValidIconKey } from '../icons/AppIcons';

interface OptionIconProps {
  icon?: string | React.ReactNode;
  size?: number;
  color?: string;
  style?: React.CSSProperties;
}

const EMOJI_FONT = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';

const ICON_KEY_TO_EMOJI: Record<string, string> = {
  chicken: '🐔',
  duck: '🦆',
  turkey: '🦃',
  quail: '🐦',
  hatch: '🐣',
  chick: '🐤',
  egg: '🥚',
  fertile_egg: '🥚',
  hall: '🏠',
  flock: '🐔',
  equipment: '🔧',
  hand_tools: '🛠️',
  heating: '🔥',
  cooling: '❄️',
  ventilation: '💨',
  drinker: '💧',
  lighting: '💡',
  cleaning: '🧹',
  weighing: '⚖️',
  generator: '⚡',
  meds: '💊',
  vaccine: '💉',
  herbal: '🌿',
  feed: '🌾',
  inventory: '📦',
  invoice: '🧾',
};

export function OptionIcon({ icon, size = 22, color = 'currentColor', style }: OptionIconProps) {
  if (!icon) return null;

  if (typeof icon === 'string') {
    const trimmed = icon.trim();
    const emoji = ICON_KEY_TO_EMOJI[trimmed];
    if (!emoji && isValidIconKey(trimmed)) {
      return <AppIcon name={trimmed} size={size} style={style} />;
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
