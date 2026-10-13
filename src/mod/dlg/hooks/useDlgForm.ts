/**
 * useDlgForm — مدیریت state و منطق فرم ثبت روزانه
 */
import { useState, useCallback } from 'react';
import type { DailyLog } from '../store';
import type { F } from '../types';
import type { Flock } from '../../flk/store';
import type { Hall } from '../../hal/store';
import { isLayingReady } from '../../flk/store';
import { useFed } from '../../fed/store';
import { toFa, toEn } from '../../../shr/utils/fa';
import { feedSystemFromHall, waterSystemFromHall } from '../../../shr/utils/systemType';
import { showAlert } from '../../../cor/store/dialog';

export function newLog(flockId = ''): F {
  return {
    flockId, date: '', entryTime: '',
    temperature: '', temperatureMin: '', temperatureMax: '',
    humidity: '', humidityMin: '', humidityMax: '',
    ventilation: 'ok', litter: 'dry', lightHours: '',
    behavior: 'active', distribution: 'uniform', appearance: '', sound: 'normal',
    feedType: '', feedAmount: '', feedRemaining: '',
    feedSourceType: '', feedSourceId: '', feedMovementIds: [], feedMethod: '',
    waterMethod: '', waterAmount: '', waterFillCount: '', waterFillVolume: '',
    weightSamples: [], weightGender: '',
    eatingEggs: '', fertileEggs: '', brokenEggs: '', otherEggs: '',
    deaths: [], vaccines: [], medications: [], activities: [],
    notes: '',
  };
}

export interface UseDlgFormParams {
  activeFlocks: Flock[];
  halls: Hall[];
  todayStr: string;
}

export function useDlgForm({ activeFlocks, halls, todayStr }: UseDlgFormParams) {
  const { formulas } = useFed();
  const [form, setForm] = useState<F>(newLog());
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const num = (s: string) => s ? parseFloat(toEn(s).replace('٫', '.')) || null : null;
  const int = (s: string) => s ? parseInt(toEn(s)) || null : null;

  const detectSystems = useCallback((flockId: string) => {
    const flock = activeFlocks.find(f => f.id === flockId);
    const hall = halls.find(h => h.id === flock?.hallId);
    return {
      feedMethod: feedSystemFromHall(hall?.feederType || ''),
      waterMethod: waterSystemFromHall(hall?.drinkerType || ''),
    };
  }, [activeFlocks, halls]);

  const currentTime = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  };

  const openNew = () => {
    if (activeFlocks.length === 0) { showAlert('اول یک گله بسازید'); return; }
    const flock = activeFlocks[0];
    const sys = detectSystems(flock.id);
    // 🆕 اگر فقط یک فرمول active هست، خودکار انتخاب شه
    const activeFormulas = formulas.filter((f) => f.status === 'active');
    const autoFormula = activeFormulas.length === 1 ? activeFormulas[0] : null;
    const feedDefault = autoFormula
      ? { feedSourceType: 'formula' as const, feedSourceId: autoFormula.id, feedType: autoFormula.name || '' }
      : {};
    setForm({ ...newLog(flock.id), date: todayStr, entryTime: currentTime(), ...sys, ...feedDefault });
    setErr(''); setOpen(true);
  };

  const openEdit = (l: DailyLog) => {
    setForm({
      id: l.id, flockId: l.flockId, date: l.date, entryTime: l.entryTime,
      temperature: l.temperature ? toFa(l.temperature) : '',
      temperatureMin: l.temperatureMin ? toFa(l.temperatureMin) : '',
      temperatureMax: l.temperatureMax ? toFa(l.temperatureMax) : '',
      humidity: l.humidity ? toFa(l.humidity) : '',
      humidityMin: l.humidityMin ? toFa(l.humidityMin) : '',
      humidityMax: l.humidityMax ? toFa(l.humidityMax) : '',
      ventilation: l.ventilation, litter: l.litter,
      lightHours: l.lightHours ? toFa(l.lightHours) : '',
      behavior: l.behavior, distribution: l.distribution,
      appearance: l.appearance, sound: l.sound,
      feedType: l.feedType,
      feedAmount: l.feedAmount !== null ? toFa(l.feedAmount) : '',
      feedRemaining: l.feedRemaining !== null ? toFa(l.feedRemaining) : '',
      feedSourceType: l.feedSourceType || '',
      feedSourceId: l.feedSourceId || '',
      feedMovementIds: l.feedMovementIds || [],
      feedMethod: l.feedMethod || '',
      waterMethod: l.waterMethod || '',
      waterAmount: l.waterAmount !== null ? toFa(l.waterAmount) : '',
      waterFillCount: l.waterFillCount !== null ? toFa(l.waterFillCount) : '',
      waterFillVolume: l.waterFillVolume !== null ? toFa(l.waterFillVolume) : '',
      weightSamples: (l.weightSamples || []).map(w => ({ id: w.id, weight: toFa(w.weight) })),
      eatingEggs: (l as any).eatingEggs ? toFa((l as any).eatingEggs) : (l.eggsCount ? toFa(l.eggsCount) : ''),
      fertileEggs: (l as any).fertileEggs ? toFa((l as any).fertileEggs) : '',
      brokenEggs: l.brokenEggs ? toFa(l.brokenEggs) : '',
      otherEggs: (l as any).otherEggs ? toFa((l as any).otherEggs) : (l.dirtyEggs ? toFa(l.dirtyEggs) : ''),
      weightGender: l.weightGender || '',
      deaths: l.deaths || [], vaccines: l.vaccines || [],
      medications: l.medications || [], activities: l.activities || [],
      notes: l.notes,
    });
    setErr(''); setOpen(true);
  };

  const onFlockChange = (flockId: string) => {
    const sys = detectSystems(flockId);
    setForm(f => ({ ...f, flockId, feedMethod: sys.feedMethod, waterMethod: sys.waterMethod }));
  };

  const selectedFlock = activeFlocks.find(f => f.id === form.flockId);
  const isLayerType = selectedFlock?.type === 'layer' || selectedFlock?.type === 'breeder';
  const isFlockMature = selectedFlock ? isLayingReady(selectedFlock) : false;
  const isLayerFlock = isLayerType && isFlockMature;
  const flockAliveCount = selectedFlock?.currentCount || selectedFlock?.initialCount || 0;

  return {
    form, setForm, open, setOpen, saving, setSaving, err, setErr,
    num, int, detectSystems,
    openNew, openEdit, onFlockChange,
    selectedFlock, isLayerType, isFlockMature, isLayerFlock, flockAliveCount,
  };
}
