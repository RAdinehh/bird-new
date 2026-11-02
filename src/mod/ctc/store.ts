import { toEn } from '../../shr/utils/fa';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';
import { useFlk } from '../flk/store';
import { showToast } from '../../cor/store/toast';

export type Role = 'customer' | 'supplier' | 'worker';

/** 🆕 عنوان/جنسیت برای پیام‌های محترمانه (یادآوری، صورت‌حساب) */
export type Gender = 'male' | 'female' | 'unspecified';

export type BankGroup = 'gov' | 'private' | 'other';

export type BankCode =
  | 'melli' | 'mellat' | 'saderat' | 'tejarat' | 'sepah' | 'keshavarzi' | 'maskan' | 'refah' | 'postbank' | 'tosee'
  | 'sanatmadan' | 'mehreiran' | 'resalat' | 'tosee_coop' | 'markazi'
  | 'pasargad' | 'saman' | 'parsian' | 'en' | 'ayande' | 'sina' | 'day' | 'shahr' | 'sarmaye'
  | 'gardeshgari' | 'iranzamin' | 'karafarin' | 'khavarmiane' | 'mellal'
  | 'other';

export interface BankInfo {
  key: BankCode;
  label: string;
  shortLabel: string;
  code: string;
  group: BankGroup;
}

export const BANKS: BankInfo[] = [
  { key: 'melli', label: 'بانک ملی', shortLabel: 'ملی', code: '017', group: 'gov' },
  { key: 'mellat', label: 'بانک ملت', shortLabel: 'ملت', code: '012', group: 'gov' },
  { key: 'saderat', label: 'بانک صادرات', shortLabel: 'صادرات', code: '019', group: 'gov' },
  { key: 'tejarat', label: 'بانک تجارت', shortLabel: 'تجارت', code: '018', group: 'gov' },
  { key: 'sepah', label: 'بانک سپه', shortLabel: 'سپه', code: '015', group: 'gov' },
  { key: 'keshavarzi', label: 'بانک کشاورزی', shortLabel: 'کشاورزی', code: '016', group: 'gov' },
  { key: 'maskan', label: 'بانک مسکن', shortLabel: 'مسکن', code: '014', group: 'gov' },
  { key: 'refah', label: 'بانک رفاه', shortLabel: 'رفاه', code: '013', group: 'gov' },
  { key: 'postbank', label: 'پست بانک', shortLabel: 'پست بانک', code: '021', group: 'gov' },
  { key: 'tosee', label: 'بانک توسعه صادرات', shortLabel: 'توسعه صادرات', code: '020', group: 'gov' },
  { key: 'sanatmadan', label: 'بانک صنعت و معدن', shortLabel: 'صنعت و معدن', code: '011', group: 'gov' },
  { key: 'tosee_coop', label: 'بانک توسعه تعاون', shortLabel: 'توسعه تعاون', code: '022', group: 'gov' },
  { key: 'markazi', label: 'بانک مرکزی', shortLabel: 'مرکزی', code: '010', group: 'gov' },
  { key: 'pasargad', label: 'بانک پاسارگاد', shortLabel: 'پاسارگاد', code: '057', group: 'private' },
  { key: 'saman', label: 'بانک سامان', shortLabel: 'سامان', code: '056', group: 'private' },
  { key: 'parsian', label: 'بانک پارسیان', shortLabel: 'پارسیان', code: '054', group: 'private' },
  { key: 'en', label: 'بانک اقتصاد نوین', shortLabel: 'اقتصاد نوین', code: '055', group: 'private' },
  { key: 'ayande', label: 'بانک آینده', shortLabel: 'آینده', code: '062', group: 'private' },
  { key: 'sina', label: 'بانک سینا', shortLabel: 'سینا', code: '059', group: 'private' },
  { key: 'day', label: 'بانک دی', shortLabel: 'دی', code: '066', group: 'private' },
  { key: 'shahr', label: 'بانک شهر', shortLabel: 'شهر', code: '061', group: 'private' },
  { key: 'sarmaye', label: 'بانک سرمایه', shortLabel: 'سرمایه', code: '058', group: 'private' },
  { key: 'gardeshgari', label: 'بانک گردشگری', shortLabel: 'گردشگری', code: '064', group: 'private' },
  { key: 'iranzamin', label: 'بانک ایران زمین', shortLabel: 'ایران زمین', code: '069', group: 'private' },
  { key: 'karafarin', label: 'بانک کارآفرین', shortLabel: 'کارآفرین', code: '053', group: 'private' },
  { key: 'khavarmiane', label: 'بانک خاورمیانه', shortLabel: 'خاورمیانه', code: '078', group: 'private' },
  { key: 'mellal', label: 'بانک ملل', shortLabel: 'ملل', code: '075', group: 'private' },
  { key: 'mehreiran', label: 'قرض‌الحسنه مهر ایران', shortLabel: 'مهر ایران', code: '060', group: 'private' },
  { key: 'resalat', label: 'قرض‌الحسنه رسالت', shortLabel: 'رسالت', code: '070', group: 'private' },
  { key: 'other', label: 'سایر', shortLabel: 'سایر', code: '', group: 'other' },
];

export const BANKS_BY_GROUP = {
  gov: BANKS.filter(b => b.group === 'gov').sort((a, b) => a.label.localeCompare(b.label, 'fa')),
  private: BANKS.filter(b => b.group === 'private').sort((a, b) => a.label.localeCompare(b.label, 'fa')),
  other: BANKS.filter(b => b.group === 'other'),
};

/** پیشوندهای کارت (BIN) — بر اساس ۶ رقم اول کارت */
export const CARD_BINS: Partial<Record<BankCode, string[]>> = {
  melli: ['603799', '170019'],
  sepah: ['589210'],
  saderat: ['603769', '903769'],
  mellat: ['610433', '991975'],
  tejarat: ['627353', '585983'],
  maskan: ['628023'],
  keshavarzi: ['603770', '639217'],
  refah: ['589463'],
  postbank: ['627760'],
  tosee_coop: ['502908'],
  tosee: ['627648', '207177'],
  sanatmadan: ['627961'],
  mehreiran: ['606373'],
  resalat: ['504172'],
  parsian: ['622106', '627884', '639194'],
  pasargad: ['502229', '639347'],
  saman: ['621986'],
  en: ['627412'],
  ayande: ['636214'],
  shahr: ['502806', '504706'],
  day: ['502938'],
  sina: ['639346'],
  sarmaye: ['639607'],
  gardeshgari: ['505416', '505426'],
  iranzamin: ['505785'],
  karafarin: ['627488', '502910'],
  khavarmiane: ['585947'],
  mellal: ['606256'],
  markazi: ['636795', '636797'],
};

/** جدول BIN → BankCode (برای lookup سریع) */
const BIN_MAP: Record<string, BankCode> = (() => {
  const map: Record<string, BankCode> = {};
  for (const [bank, bins] of Object.entries(CARD_BINS)) {
    if (bins) for (const bin of bins) map[bin] = bank as BankCode;
  }
  return map;
})();

/** پیشوندهای ۴ رقمی → بانک‌های ممکن (برای hint وقتی ۶ رقم ناقصه) */
const PREFIX4_MAP: Record<string, BankCode[]> = (() => {
  const map: Record<string, BankCode[]> = {};
  for (const [bin, bank] of Object.entries(BIN_MAP)) {
    const p4 = bin.slice(0, 4);
    if (!map[p4]) map[p4] = [];
    if (!map[p4].includes(bank)) map[p4].push(bank);
  }
  return map;
})();

export interface CardDetectionResult {
  /** بانک تشخیص‌داده‌شده (فقط وقتی ۶ رقم کامل و یکتا) */
  bank?: BankCode;
  /** پیشوند فعلی */
  prefix: string;
  /** اگر ۴-۵ رقم داشت و مبهم بود، لیست بانک‌های ممکن */
  possibleBanks?: BankCode[];
}

export function findBankByCardBin(cardNumber: string): CardDetectionResult {
  const digits = toEn(cardNumber || '').replace(/\D/g, '');
  const prefix = digits.slice(0, 6);
  if (digits.length < 4) return { prefix };
  if (digits.length >= 6) {
    const bank = BIN_MAP[prefix];
    if (bank) return { bank, prefix };
    return { prefix };
  }
  // ۴ یا ۵ رقم — ambiguous
  const p4 = digits.slice(0, 4);
  const possible = PREFIX4_MAP[p4];
  if (possible && possible.length > 0) {
    return { prefix: digits, possibleBanks: possible };
  }
  return { prefix: digits };
}

export function isGender(v: string): v is Gender {
  return v === 'male' || v === 'female' || v === 'unspecified';
}

export function isBankCode(v: string): v is BankCode {
  return BANKS.some(b => b.key === v);
}

export function findBankByShabaCode(code: string): BankInfo | undefined {
  return BANKS.find(b => b.code !== '' && b.code === code);
}

export interface BankAccount {
  bank?: BankCode;
  accountHolder?: string;
  accountNumber?: string;
  cardNumber?: string;
  shaba?: string;
}

export interface Person {
  id: string;
  name: string;
  phone: string;
  phone2: string;
  email: string;
  address: string;
  city: string;
  nationalId: string;
  roles: Role[];
  notes: string;

  // مشتری
  customerType: string;        // [قدیمی] wholesale | retail | ...
  customerTypes: string[];     // [جدید] چندتایی: wholesale, retail, ...
  trustScore: number | null; // 1-10
  /** 🆕 سقف اعتبار مشتری (تومان) — 0 یا null = بدون سقف */
  creditLimit?: number | null;
  defaultDiscount: number | null;

  // فروشنده
  supplierTypes: string[];   // egg | chick | adult | feed | medicine | equipment

  // کارگر
  position: string;
  startDate: string;
  salaryType: string;        // monthly | daily | hourly
  salaryAmount: number | null;
  insurance: boolean;

  createdAt: string;
  updatedAt: string;
  /** موجودی اعتباری: مثبت=طلبکار، منفی=بدهکار */
  creditBalance?: number;
  /** 🆕 جنسیت: مرد/زن/بی‌طرف (برای پیام‌های محترمانه) */
  gender?: Gender;
  /** 🆕 حساب بانکی (MVP: یک حساب) */
  bankAccount?: BankAccount;
}

interface State {
  contacts: Person[];
  add: (c: Omit<Person, 'id'|'createdAt'|'updatedAt'>) => void;
  update: (id: string, patch: Partial<Person>) => void;
  remove: (id: string) => void;
}

const now = () => new Date().toISOString();

export const useCtc = create<State>()(
  persist(
    (set, get) => ({
      contacts: [],
      add: (c) => set({ contacts: [...get().contacts, {...c, id: uuid(), createdAt: now(), updatedAt: now()}] }),
      update: (id, patch) => set({ contacts: get().contacts.map(x => x.id === id ? {...x, ...patch, updatedAt: now()} : x) }),
      remove: (id) => {
        // 🆕 guard: چک استفاده در گله‌ها (شریک، امانت‌دهنده، موجر)
        const flkState = useFlk.getState();
        const linked = flkState.flocks.filter((f: any) =>
          f.dealData?.partnerId === id ||
          f.dealData?.consignorId === id ||
          f.dealData?.lessorId === id
        );
        if (linked.length > 0) {
          showToast('این مخاطب ' + linked.length + ' گله دارد — ابتدا گله را ویرایش کنید', 'error');
          return;
        }
        set({ contacts: get().contacts.filter(x => x.id !== id) });
      }
    }),
    {
      name: 'pm-ctc',
      version: 2,
      migrate: (persisted: any, version: number) => {
        if (version < 2 && persisted?.people) {
          persisted.people = persisted.people.map((p: any) => ({
            ...p,
            customerTypes: p.customerTypes || (p.customerType ? [p.customerType] : []),
          }));
        }
        return persisted;
      }
    }
  )
);

export const ROLE_LABEL: Record<Role, string> = {
  customer: 'مشتری',
  supplier: 'فروشنده',
  worker: 'کارگر'
};

export const ROLE_COLOR: Record<Role, string> = {
  customer: 'blue',
  supplier: 'green',
  worker: 'purple'
};

export const CUSTOMER_TYPES: [string, string][] = [
  ['wholesale', 'عمده'],
  ['retail', 'خرده'],
  ['restaurant', 'رستوران'],
  ['shop', 'مغازه'],
  ['other', 'سایر']
];

export const SUPPLIER_TYPES: [string, string][] = [
  ['egg', 'تخم نطفه‌دار'],
  ['chick', 'جوجه یک‌روزه'],
  ['adult', 'پرنده بالغ'],
  ['feed', 'دان و مواد اولیه'],
  ['medicine', 'دارو و واکسن'],
  ['equipment', 'تجهیزات']
];

export const SALARY_TYPES: [string, string][] = [
  ['monthly', 'ماهانه'],
  ['daily', 'روزانه'],
  ['hourly', 'ساعتی']
];

export function avatarLetter(name: string): string {
  if (!name) return '؟';
  return name.trim().charAt(0);
}


export function setPartyCredit(partyId: string, amount: number): void {
  const state = useCtc.getState() as any;
  const updated = state.contacts.map((c: any) =>
    c.id === partyId ? { ...c, creditBalance: amount } : c
  );
  useCtc.setState({ contacts: updated } as any);
}
