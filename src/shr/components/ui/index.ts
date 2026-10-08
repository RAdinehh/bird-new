/** components/ui — همه‌ی کامپوننت‌های پایه */

declare global {
  interface Window {
    __modalDepth?: number;
  }
}

export * from './Btn';
export * from './Input';
export * from './Select';
export * from './Field';
export * from './Layout';
export * from './Card';
export * from './Modal';
export * from './Sheet';
export * from './Form';
export * from './Temp';
