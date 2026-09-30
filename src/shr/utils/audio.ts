/**
 * audio.ts — سیستم مشترک صدا و ویبره
 * AudioContext روی موبایل تا اولین تعامل کاربر در حالت suspended می‌مونه.
 * این ماژول یک context پایدار نگه می‌داره و روی اولین tap/touch بازش می‌کنه.
 */

let _ctx: any = null;
let _unlocked = false;

function getCtx(): any {
  try {
    if (_ctx && _ctx.state !== 'closed') return _ctx;
    const Ctx: any = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return null;
    _ctx = new Ctx();
    return _ctx;
  } catch { return null; }
}

export async function unlockAudio(): Promise<void> {
  const ctx = getCtx();
  if (!ctx) return;
  try {
    if (ctx.state === 'suspended') await ctx.resume();
    if (!_unlocked) {
      const buf = ctx.createBuffer(1, 1, 22050);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      src.start(0);
      _unlocked = true;
    }
  } catch {}
}

export function playBeep(type?: string): void {
  const ctx = getCtx();
  if (!ctx) return;
  try {
    if (ctx.state === 'suspended') { ctx.resume().catch(() => {}); }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const isCritical = type === 'danger' || type === 'error';
    const dur = isCritical ? 0.25 : 0.15;
    osc.type = 'sine';
    osc.frequency.value = isCritical ? 880 : 660;
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.15, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  } catch {}
}

export function vibrate(type?: string): boolean {
  try {
    if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return false;
    const isCritical = type === 'danger' || type === 'error';
    return !!navigator.vibrate(isCritical ? [200, 80, 200] : 100);
  } catch { return false; }
}

export function hasVibration(): boolean {
  try { return typeof navigator !== 'undefined' && 'vibrate' in navigator; } catch { return false; }
}

if (typeof window !== 'undefined') {
  const unlock = () => {
    unlockAudio();
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('touchstart', unlock);
    window.removeEventListener('click', unlock);
    window.removeEventListener('keydown', unlock);
  };
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('touchstart', unlock);
  window.addEventListener('click', unlock);
  window.addEventListener('keydown', unlock);
}
