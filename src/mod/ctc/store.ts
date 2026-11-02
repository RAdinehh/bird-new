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
  | 'pasargad' | 'saman' | 'parsian' | 'en' | 'sina' | 'day' | 'shahr' | 'resalat' | 'iranzamin' | 'karafarin' | 'gardeshgari' | 'mehr'
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
  { key: 'pasargad', label: 'بانک پاسارگاد', shortLabel: 'پاسارگاد', code: '057', group: 'private' },
  { key: 'saman', label: 'بانک سامان', shortLabel: 'سامان', code: '056', group: 'private' },
  { key: 'parsian', label: 'بانک پارسیان', shortLabel: 'پارسیان', code: '054', group: 'private' },
  { key: 'en', label: 'بانک اقتصاد نوین', shortLabel: 'اقتصاد نوین', code: '055', group: 'private' },
  { key: 'sina', label: 'بانک سینا', shortLabel: 'سینا', code: '059', group: 'private' },
  { key: 'day', label: 'بانک دی', shortLabel: 'دی', code: '066', group: 'private' },
  { key: 'shahr', label: 'بانک شهر', shortLabel: 'شهر', code: '061', group: 'private' },
  { key: 'resalat', label: 'بانک رسالت', shortLabel: 'رسالت', code: '070', group: 'private' },
  { key: 'iranzamin', label: 'بانک ایران زمین', shortLabel: 'ایران زمین', code: '069', group: 'private' },
  { key: 'karafarin', label: 'بانک کارآفرین', shortLabel: 'کارآفرین', code: '053', group: 'private' },
  { key: 'gardeshgari', label: 'بانک گردشگری', shortLabel: 'گردشگری', code: '064', group: 'private' },
  { key: 'mehr', label: 'بانک مهر ایران', shortLabel: 'مهر ایران', code: '060', group: 'private' },
  { key: 'other', label: 'سایر', shortLabel: 'سایر', code: '', group: 'other' },
];

export const BANKS_BY_GROUP = {
  gov: BANKS.filter(b => b.group === 'gov').sort((a, b) => a.label.localeCompare(b.label, 'fa')),
  private: BANKS.filter(b => b.group === 'private').sort((a, b) => a.label.localeCompare(b.label, 'fa')),
  other: BANKS.filter(b => b.group === 'other'),
};

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
