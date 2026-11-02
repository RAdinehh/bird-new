export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export interface ShareResult {
  status: 'shared' | 'copied' | 'cancelled' | 'failed';
}

export async function shareText(opts: {
  title?: string;
  text: string;
}): Promise<ShareResult> {
  if (navigator.share) {
    try {
      await navigator.share({ title: opts.title, text: opts.text });
      return { status: 'shared' };
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') {
        return { status: 'cancelled' };
      }
      const ok = await copyText(opts.text);
      return { status: ok ? 'copied' : 'failed' };
    }
  }
  const ok = await copyText(opts.text);
  return { status: ok ? 'copied' : 'failed' };
}
