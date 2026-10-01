import React from 'react';

export function iconBtnProps(label: string) {
  return {
    'aria-label': label,
    type: 'button' as const,
  };
}

export function clickableDivProps(onClick: () => void, label: string, isOpen?: boolean) {
  return {
    role: 'button' as const,
    tabIndex: 0,
    'aria-label': label,
    'aria-expanded': isOpen,
    onClick,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      }
    },
  };
}

export function toggleBtnProps(active: boolean, label: string) {
  return {
    'aria-label': label,
    'aria-pressed': active,
    role: 'switch' as const,
    type: 'button' as const,
  };
}
