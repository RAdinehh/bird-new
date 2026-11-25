import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

function findScrollableAncestor(el: Element): HTMLElement | null {
  let curr = el.parentElement;
  while (curr && curr !== document.body && curr !== document.documentElement) {
    const style = window.getComputedStyle(curr);
    const overflowY = style.overflowY;
    if (
      (overflowY === 'auto' || overflowY === 'scroll') &&
      curr.scrollHeight > curr.clientHeight + 4
    ) {
      return curr;
    }
    curr = curr.parentElement;
  }
  const docEl = document.scrollingElement || document.documentElement;
  if (docEl && docEl.scrollHeight > docEl.clientHeight + 4) {
    return docEl as HTMLElement;
  }
  return null;
}

function getTopObstructionBottom(targetEl: Element): number {
  let maxBottom = 64;

  const topBars = document.querySelectorAll('header, [role="tablist"]');
  topBars.forEach((bar) => {
    const r = bar.getBoundingClientRect();
    if (r.height > 0 && r.top >= -4 && r.top < 160 && r.bottom > maxBottom) {
      maxBottom = r.bottom;
    }
  });

  const panelRoot = targetEl.closest('[data-tab-panel]') || targetEl.parentElement?.parentElement || document;
  const banners = panelRoot.querySelectorAll('[data-help-banner], .pm-help-banner, [role="region"][aria-label*="راهنما"]');
  banners.forEach((banner) => {
    const r = banner.getBoundingClientRect();
    if (r.height > 0 && r.top >= 0 && r.top < 260 && r.bottom > maxBottom) {
      maxBottom = r.bottom;
    }
  });

  return maxBottom + 12;
}

export function useFocusParam(autoClear = true): string | null {
  const [params, setParams] = useSearchParams();
  const focusId = params.get('focus');

  useEffect(() => {
    if (!focusId) return;

    let targetEl: Element | null = null;
    let rafId = 0;
    let t2: ReturnType<typeof setTimeout> | null = null;
    let attempts = 0;

    const tryFocus = () => {
      targetEl = document.querySelector(`[data-focus-id="${focusId}"]`);
      if (targetEl) {
        const scrollContainer = findScrollableAncestor(targetEl);
        if (scrollContainer) {
          const rect = targetEl.getBoundingClientRect();
          const vh = window.innerHeight || document.documentElement.clientHeight;
          const topSafe = getTopObstructionBottom(targetEl);
          const bottomSafe = vh - 24;

          if (rect.top < topSafe) {
            scrollContainer.scrollBy({ top: rect.top - topSafe, behavior: 'auto' });
          } else if (rect.bottom > bottomSafe) {
            scrollContainer.scrollBy({ top: rect.bottom - bottomSafe, behavior: 'auto' });
          }
        }

        targetEl.classList.remove('pm-entity-focused');
        void (targetEl as HTMLElement).offsetWidth;
        targetEl.classList.add('pm-entity-focused');

        t2 = setTimeout(() => {
          if (targetEl) {
            targetEl.classList.remove('pm-entity-focused');
          }
          if (autoClear) {
            setParams(
              (prev) => {
                const next = new URLSearchParams(prev);
                next.delete('focus');
                return next;
              },
              { replace: true },
            );
          }
        }, 2600);
        return;
      }

      if (attempts < 20) {
        attempts++;
        rafId = requestAnimationFrame(tryFocus);
      }
    };

    rafId = requestAnimationFrame(tryFocus);

    return () => {
      cancelAnimationFrame(rafId);
      if (t2) clearTimeout(t2);
      if (targetEl) {
        targetEl.classList.remove('pm-entity-focused');
      }
    };
  }, [focusId, autoClear, setParams]);

  return focusId;
}
