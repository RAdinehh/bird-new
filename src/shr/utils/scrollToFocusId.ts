export function scrollToFocusId(focusId: string, delay = 150): void {
  if (!focusId || typeof document === 'undefined') return;
  window.setTimeout(() => {
    const el = document.querySelector(`[data-focus-id="${focusId}"]`);
    if (el instanceof HTMLElement) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, delay);
}
