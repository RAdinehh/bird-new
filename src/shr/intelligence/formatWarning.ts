/**
 * intelligence/formatWarning.ts — پیام کوتاه طبیعی
 */
import type { Warning } from './types';
import { getProfile } from './fieldProfiles';

const FIELD_LABELS: Record<string, string> = {
  'tra.price_chick': 'قیمت جوجه',
  'tra.price_adult': 'قیمت پرنده بالغ',
  'tra.price_egg': 'قیمت تخم',
  'tra.price_fertile_egg': 'قیمت تخم نطفه‌دار',
  'tra.price_feed': 'قیمت دان',
  'tra.price_medicine': 'قیمت دارو',
  'tra.price_equipment': 'قیمت تجهیزات',
  'tra.price_other': 'قیمت سایر',
  'tra.price_broken': 'قیمت تخم شکسته',
  'tra.price_manure': 'قیمت کود',
  'dlg.temperature': 'دمای سالن',
  'dlg.temperatureMin': 'حداقل دما',
  'dlg.temperatureMax': 'حداکثر دما',
  'dlg.humidity': 'رطوبت سالن',
  'dlg.feedAmount': 'مقدار دان',
  'dlg.feedRemaining': 'دان باقی‌مانده',
  'dlg.waterAmount': 'مقدار آب',
  'dlg.waterFillVolume': 'حجم آب',
  'dlg.waterFillCount': 'تعداد بار آب',
  'dlg.eatingEggs': 'تخم خوراکی',
  'dlg.fertileEggs': 'تخم نطفه‌دار',
  'dlg.brokenEggs': 'تخم شکسته',
  'dlg.otherEggs': 'سایر تخم‌ها',
  'dlg.deathsCount': 'تعداد تلفات',
  'dlg.dose': 'دوز دارو',
  'dlg.withdrawalDays': 'دوره پرهیز',
  'chickWeight': 'وزن جوجه',
  'flk.weightGram': 'وزن پرنده',
  'flk.initialCount': 'تعداد گله',
  'flk.maleCount': 'تعداد نر',
  'flk.femaleCount': 'تعداد ماده',
  'flk.unknownCount': 'تعداد نامشخص',
  'flk.partnerPercent': 'درصد شریک',
  'flk.rentAmount': 'مبلغ اجاره',
  'flk.rentPayments.amount': 'مبلغ پرداخت',
  'flk.layingStartDay': 'شروع تخم‌گذاری',
  'flk.endOfCycleDay': 'پایان چرخه',
  'flk.purchasePrice': 'قیمت خرید',
  'flk.deliveryCost': 'هزینه حمل',
  'inc.temperature': 'دمای دستگاه',
  'inc.humidity': 'رطوبت دستگاه',
  'inc.count': 'تعداد تخم',
  'inc.hatched': 'تخم هچ‌شده',
  'inc.unhatched': 'تعداد هچ‌نشده',
  'inc.deadInShell': 'تعداد مرده در پوسته',
  'inc.pipped': 'تعداد نوک‌زده',
  'inc.other': 'تعداد سایر (هچ)',
  'inc.avgWeight': 'وزن جوجه',
  'hal.capacity': 'ظرفیت سالن',
  'hal.targetTemp': 'دمای هدف',
  'hal.targetHumidity': 'رطوبت هدف',
  'hal.zoneCapacity': 'ظرفیت بخش',
  'hal.density': 'تراکم',
  'egg.eatingCount': 'تخم خوراکی',
  'egg.fertileCount': 'تخم نطفه‌دار',
  'egg.brokenCount': 'تخم شکسته',
  'egg.softCount': 'تخم نرم',
  'egg.dirtyCount': 'تخم کثیف',
  'egg.avgWeight': 'وزن تخم',
  // ─── رطوبت ───
  'dlg.humidityMin': 'حداقل رطوبت',
  'dlg.humidityMax': 'حداکثر رطوبت',
  // ─── دان ───
  'feed.unitPrice': 'قیمت واحد دان',
  'feed.protein': 'پروتئین دان',
  'feed.fat': 'چربی دان',
  'feed.fiber': 'فیبر دان',
  'feed.calcium': 'کلسیم دان',
  'feed.phosphorus': 'فسفر دان',
  'feed.methionine': 'متیونین دان',
  'feed.lysine': 'لیزین دان',
  'feed.sodium': 'سدیم دان',
  'feed.energy': 'انرژی دان',
  'feed.perBirdGramsPerDay': 'مصرف روزانه هر پرنده',
  'feed.bagWeight': 'وزن کیسه',
  'feed.bagCount': 'تعداد کیسه',
  // ─── گله (شاخص) ───
  'flk.fcr': 'ضریب تبدیل',
  'flk.adg': 'افزایش وزن روزانه',
  // ─── تخم (درصد) ───
  'egg.hatchOfTotal': 'درصد هچ از کل',
  'egg.hatchOfFertile': 'درصد هچ از نطفه‌دار',
  'egg.chickYieldPercent': 'درصد جوجه‌دهی',
  'egg.henDayPercent': 'درصد تخم‌گذاری',
  // ─── whs (انبار) ───
  'whs.qty_kg': 'مقدار (کیلوگرم)',
  'whs.qty_g': 'مقدار (گرم)',
  'whs.qty_L': 'مقدار (لیتر)',
  'whs.qty_ml': 'مقدار (میلی‌لیتر)',
  'whs.qty_pcs': 'مقدار (عدد)',
  'whs.qty_vial': 'مقدار (ویال)',
  'whs.qty_pack': 'مقدار (بسته)',
  'whs.dosePerBird': 'دوز هر پرنده',
  'whs.withdrawalDays': 'دوره پرهیز',
};

const FALLBACK_FA: Record<string, string> = {
  quantity: 'مقدار', count: 'تعداد', amount: 'مقدار', total: 'مجموع',
  unitPrice: 'قیمت واحد', price: 'قیمت', value: 'مقدار',
  weight: 'وزن', volume: 'حجم', capacity: 'ظرفیت',
  date: 'تاریخ', dueDate: 'مهلت', notes: 'یادداشت',
  discount: 'تخفیف', totalPrice: 'مبلغ کل',
  minStock: 'حداقل موجودی', currentStock: 'موجودی',
};

function getLabel(fieldPath: string): string {
  if (FIELD_LABELS[fieldPath]) return FIELD_LABELS[fieldPath];
  const parts = fieldPath.split('.');
  const last = parts[parts.length - 1];
  if (last.startsWith('price_')) {
    const cat = last.slice(6);
    return FIELD_LABELS[`tra.price_${cat}`] ?? cat;
  }
  return FALLBACK_FA[last] ?? last;
}

function toFaDigit(s: string): string {
  return s.replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d]);
}

function fmtNum(n: number): string {
  if (!Number.isFinite(n)) return '—';
  const rounded = Math.round(n * 100) / 100;
  try {
    return toFaDigit(rounded.toLocaleString('en-US', {
      maximumFractionDigits: 2,
      useGrouping: true,
    }));
  } catch {
    return toFaDigit(String(rounded));
  }
}

function fmtMult(n: number): string {
  if (!Number.isFinite(n)) return '—';
  const rounded = n >= 10 ? Math.round(n) : Math.round(n * 10) / 10;
  const str = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return toFaDigit(str);
}

function crossFieldLabel(rule?: string): string {
  switch (rule) {
    case 'lte_current':      return 'موجودی گله';
    case 'lte_female':       return 'تعداد مرغ ماده';
    case 'lte_initial':      return 'تعداد اولیه گله';
    case 'lte_initial_sum':  return 'تعداد کل گله';
    case 'lte_egg_count':    return 'تعداد تخم ورودی';
    case 'lte_hall':         return 'ظرفیت سالن';
    case 'lte_rent':         return 'مبلغ کل اجاره';
    default:                 return 'حد منطقی';
  }
}

export function formatWarningDetail(w: Warning): string {
  const parts: string[] = [`مقدار: ${fmtNum(w.value)}`];
  if (w.expected !== undefined) parts.push(`مرجع: ${fmtNum(w.expected)}`);
  const profile = getProfile(w.field);
  if (profile) {
    if (typeof profile.hardMin === 'number') parts.push(`حداقل: ${fmtNum(profile.hardMin)}`);
    if (typeof profile.hardMax === 'number') parts.push(`سقف: ${fmtNum(profile.hardMax)}`);
  }
  return parts.join(' · ');
}

export function formatWarning(w: Warning): string {
  const { value, expected, signals, field } = w;
  const label = getLabel(field);
  const profile = getProfile(field);
  const kind = profile?.kind ?? 'count';

  if (signals.some(s => s.type === 'hard_min')) {
    return `${label} کمتر از حداقل مجاز`;
  }
  if (signals.some(s => s.type === 'hard_max')) {
    return `${label} بالاتر از سقف مجاز`;
  }
  if (signals.some(s => s.type === 'cross_absolute') && expected !== undefined) {
    return `${label} بیش از ${crossFieldLabel(profile?.crossFieldRule)}`;
  }

  // pattern باید قبل از ratio چک بشه (چون هر دو expected دارن)
  if (signals.some(s => s.type === 'pattern')) {
    return `${label} غیرمعمول — الگوی همیشگی نیست`;
  }

  if (expected !== undefined && expected > 0) {
    if (kind === 'temperature') {
      const diff = Math.round(value - expected);
      return diff > 0
        ? `${label} ${fmtNum(diff)} درجه بالاتر از هدف`
        : `${label} ${fmtNum(-diff)} درجه پایین‌تر از هدف`;
    }
    if (kind === 'humidity') {
      const diff = Math.round(value - expected);
      return diff > 0
        ? `${label} ${fmtNum(diff)}٪ بالاتر از هدف`
        : `${label} ${fmtNum(-diff)}٪ پایین‌تر از هدف`;
    }
    if (kind === 'weight') {
      const pct = Math.round(Math.abs(1 - value / expected) * 100);
      return value > expected
        ? `${label} ${fmtNum(pct)}٪ بیشتر از استاندارد`
        : `${label} ${fmtNum(pct)}٪ کمتر از استاندارد`;
    }
    const ratio = value / expected;
    if (ratio >= 1) {
      if (ratio >= 1.5) return `${label} ${fmtMult(ratio)} برابر شده`;
      return `${label} ${fmtNum(Math.round((ratio - 1) * 100))}٪ بیشتر شده`;
    }
    const pctDown = Math.round((1 - ratio) * 100);
    return `${label} ${fmtNum(pctDown)}٪ کمتر شده`;
  }

  if (signals.some(s => s.type === 'biological') && profile?.biologicalRange) {
    return `${label} بیرون از محدوده زیستی`;
  }
  if (signals.some(s => s.type === 'zscore')) {
    return `${label} غیرعادی`;
  }
  if (signals.some(s => s.type === 'iqr')) {
    return `${label} خارج از محدوده رایج`;
  }

  return `${label} غیرعادی`;
}
