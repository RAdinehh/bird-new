/**
 * fabStore — وضعیت FAB (Floating Action Button) مشترک
 *
 * هر ماژول می‌تونه FAB خودش رو با useFab تنظیم کنه.
 * Layout یه FAB واحد نشون می‌ده.
 */
import { create } from 'zustand';

export interface FabConfig {
  label: string;
  onClick: () => void;
  hidden?: boolean;
  icon?: string;
}

interface FabState {
  config: FabConfig | null;
  set: (cfg: FabConfig | null) => void;
}

export const useFabStore = create<FabState>((set) => ({
  config: null,
  set: (config) => set({ config }),
}));
