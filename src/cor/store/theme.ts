/**
 * theme.ts — Wrapper روی useSet (single source of truth)
 * قبلاً یه store مستقل بود که با تنظیمات sync نمی‌شد.
 * الان فقط از useSet می‌خونه/می‌نویسه.
 */
import { useSet } from '../../mod/set/store';

type Theme = 'light' | 'dark';

export function useTheme() {
  const theme = useSet((s: any) => s.theme) as Theme;
  const update = useSet((s: any) => s.update);

  const toggle = () => {
    update({ theme: theme === 'light' ? 'dark' : 'light' });
  };

  const set = (t: Theme) => {
    update({ theme: t });
  };

  return { theme: theme || 'light', toggle, set };
}
