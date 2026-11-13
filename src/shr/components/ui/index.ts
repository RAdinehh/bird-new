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

export * from './CardActions';
export * from './ModalFooter';
export * from './Segmented';
export * from './Row';
export * from './ActionMenu';
export * from './Tabs';
export * from './AlertBox';
export * from './SummaryCard';
