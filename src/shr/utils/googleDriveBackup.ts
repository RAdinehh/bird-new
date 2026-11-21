import { safeStorage } from './storage';

const DRIVE_CFG_KEY = 'pm-gdrive-cfg';
const DRIVE_FILE_NAME = 'poultry-manager-autobackup.json';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';

export interface GoogleDriveConfig {
  clientId: string;
  autoSync: boolean;
  lastSyncedAt?: number;
  lastFileSize?: number;
}

export function getGoogleDriveConfig(): GoogleDriveConfig {
  try {
    const raw = safeStorage.get(DRIVE_CFG_KEY);
    if (!raw) return { clientId: '', autoSync: false };
    const parsed = JSON.parse(raw);
    return {
      clientId: typeof parsed.clientId === 'string' ? parsed.clientId : '',
      autoSync: Boolean(parsed.autoSync),
      lastSyncedAt: typeof parsed.lastSyncedAt === 'number' ? parsed.lastSyncedAt : undefined,
      lastFileSize: typeof parsed.lastFileSize === 'number' ? parsed.lastFileSize : undefined,
    };
  } catch {
    return { clientId: '', autoSync: false };
  }
}

export function saveGoogleDriveConfig(patch: Partial<GoogleDriveConfig>): GoogleDriveConfig {
  const next = { ...getGoogleDriveConfig(), ...patch };
  safeStorage.set(DRIVE_CFG_KEY, JSON.stringify(next));
  return next;
}

let cachedToken: { token: string; expiresAt: number } | null = null;
let gsiPromise: Promise<void> | null = null;

function loadGsiScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('مرورگر در دسترس نیست'));
  if ((window as any).google?.accounts?.oauth2) return Promise.resolve();
  if (gsiPromise) return gsiPromise;

  gsiPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector('script[data-pm-gsi]');
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('بارگذاری اسکریپت گوگل ناموفق بود')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.setAttribute('data-pm-gsi', '1');
    script.onload = () => resolve();
    script.onerror = () => {
      gsiPromise = null;
      reject(new Error('اتصال به سرور گوگل برقرار نشد (اینترنت را بررسی کنید)'));
    };
    document.head.appendChild(script);
  });

  return gsiPromise;
}

export async function requestDriveAccessToken(interactive = true): Promise<string> {
  const { clientId } = getGoogleDriveConfig();
  if (!clientId.trim()) {
    throw new Error('ابتدا Google Client ID را وارد کنید');
  }
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token;
  }

  await loadGsiScript();
  const oauth2 = (window as any).google?.accounts?.oauth2;
  if (!oauth2) throw new Error('سرویس احراز هویت گوگل آماده نیست');

  return new Promise<string>((resolve, reject) => {
    const client = oauth2.initTokenClient({
      client_id: clientId.trim(),
      scope: DRIVE_SCOPE,
      callback: (resp: any) => {
        if (resp?.error || !resp?.access_token) {
          reject(new Error(resp?.error_description || resp?.error || 'ورود به گوگل انجام نشد'));
          return;
        }
        const expiresIn = Number(resp.expires_in) || 3500;
        cachedToken = {
          token: resp.access_token,
          expiresAt: Date.now() + expiresIn * 1000,
        };
        resolve(resp.access_token);
      },
      error_callback: (err: any) => {
        reject(new Error(err?.message || 'پنجره ورود گوگل بسته شد'));
      },
    });
    client.requestAccessToken({ prompt: interactive ? '' : 'none' });
  });
}

async function findExistingBackupFileId(token: string): Promise<string | null> {
  const q = encodeURIComponent(`name = '${DRIVE_FILE_NAME}' and 'appDataFolder' in parents and trashed = false`);
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${q}&fields=files(id,name,modifiedTime,size)&pageSize=1`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error('خطا در جستجوی فایل در Google Drive');
  const data = await res.json();
  return data.files?.[0]?.id || null;
}

export async function uploadBackupToGoogleDrive(jsonText: string, interactive = true): Promise<void> {
  const token = await requestDriveAccessToken(interactive);
  const existingId = await findExistingBackupFileId(token);

  const boundary = 'pm_drive_boundary_' + Date.now();
  const metadata = existingId
    ? { name: DRIVE_FILE_NAME, mimeType: 'application/json' }
    : { name: DRIVE_FILE_NAME, parents: ['appDataFolder'], mimeType: 'application/json' };

  const body =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: application/json\r\n\r\n` +
    `${jsonText}\r\n` +
    `--${boundary}--`;

  const url = existingId
    ? `https://www.googleapis.com/upload/drive/v3/files/${existingId}?uploadType=multipart`
    : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

  const res = await fetch(url, {
    method: existingId ? 'PATCH' : 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error('آپلود به Google Drive ناموفق بود: ' + (errText.slice(0, 120) || res.status));
  }

  saveGoogleDriveConfig({
    lastSyncedAt: Date.now(),
    lastFileSize: new Blob([jsonText]).size,
  });
}

export async function downloadBackupFromGoogleDrive(interactive = true): Promise<string> {
  const token = await requestDriveAccessToken(interactive);
  const fileId = await findExistingBackupFileId(token);
  if (!fileId) {
    throw new Error('هیچ فایل پشتیبانی در Google Drive یافت نشد');
  }

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error('دانلود فایل پشتیبان از Google Drive ناموفق بود');
  }
  return res.text();
}
