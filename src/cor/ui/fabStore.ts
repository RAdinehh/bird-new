/**
 * fabStore — وضعیت FAB (Floating Action Button) مشترک
 *
 * هر ماژول می‌تونه FAB خودش رو با useFab تنظیم کنه.
 * Layout یه FAB واحد نشون می‌ده.
 *
 * ownerId: از useRef هر کامپوننت میاد. اجازه می‌ده فقط ownerId فعال
 * config رو پاک کنه. این جلوی overwrite توسط tabs غیرفعال رو می‌گیره.
 */
import { create } from 'zustand';

export interface FabConfig {
  label: string;
  onClick: () => void;
  hidden?: boolean;
  icon?: string;
  /**
   * 🆕 حالت wake:
   *   - `true`: همیشه wake (با اسکرول/لمس ظاهر، ۳ث سکون → محو)
   *   - `false`: همیشه ثابت
   *   - `'auto'` یا `undefined`: خودکار بر اساس اسکرول‌پذیری صفحه
   */
  wakeMode?: boolean | 'auto';
}

interface FabState {
  config: FabConfig | null;
  ownerId: string | null;
  set: (cfg: FabConfig | null, ownerId: string) => void;
}

export const useFabStore = create<FabState>((set, get) => ({
  config: null,
  ownerId: null,
  set: (config, ownerId) => {
    if (config === null) {
      // فقط ownerId خودم می‌تونم پاک کنم
      if (get().ownerId === ownerId) {
        set({ config: null, ownerId: null });
      }
      return;
    }
    // set config جدید — از ownerId جدید
    set({ config, ownerId });
  },
}));
