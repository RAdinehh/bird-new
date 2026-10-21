/**
 * DevicesPage — دستگاه‌های انکوباسیون (ظرفیت، تعمیرات، گارانتی)
 */
import { useFab } from '../../shr/hooks/useFab';
import { useState, useMemo, useEffect } from 'react';
import { useInc, type Device, type DeviceStatus } from './store';
import { useValidation } from '../../shr/validation/useValidation';
import { createDeviceSchema } from '../../shr/validation/rules/inc';
import { useSet } from '../set/store';
import { useBrd } from '../brd/store';
import { Btn, Empty, PageContainer, Select, Tag } from '../../shr/components/ui';
import ExpandableCard, { StatBox, Dot } from '../../shr/components/ExpandableCard';
import HelpBanner from '../../shr/components/HelpBanner';
import { useMultiSelect } from '../../shr/multiSelect/useMultiSelect';
import { useFilterSort, FilterBar, getIncDevicesConfig } from '../../shr/filter';
import MultiSelectBar from '../../shr/multiSelect/MultiSelectBar';
import { toFa, toEn } from '../../shr/utils/fa';
import { toastMsg } from '../../cor/store/toast';
import { showConfirmAsync } from '../../cor/store/dialog';
import { Row } from './helpers';
import MaintenanceModal from './components/MaintenanceModal';
import DeviceFormModal from './components/DeviceFormModal';
import DeviceCard from './components/DeviceCard';
import { STATUS_FA, MODE_FA, emptyForm as empty, type F } from './types-devices';
import { warrantyInfo } from './api/warranty';
import { LineChart } from '../../shr/components/Charts';
import { todayJalali } from './helpers';


export default function DevicesPage({ active = true }: { active?: boolean } = {}) {
  const { devices, eggEntries, addDevice, updateDevice, deleteDevice } = useInc();
  const settings = useSet();
  const { birds } = useBrd();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<F>(empty);
  const [err, setErr] = useState('');
  const [undoDevice, setUndoDevice] = useState<{ device: any | any[] } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [maintDeviceId, setMaintDeviceId] = useState<string | null>(null);
  const [maintForm, setMaintForm] = useState({ date: '', type: '', cost: '', description: '' });

  // ═══ Performance: pre-compute device stats ═══
  const deviceStats = useMemo(() => {
    const map: Record<string, { totalEggs: number; activeCount: number }> = {};
    eggEntries.forEach(e => {
      if (!map[e.deviceId]) map[e.deviceId] = { totalEggs: 0, activeCount: 0 };
      map[e.deviceId].totalEggs += (e.count || 0);
      if (e.status === 'incubating' || e.status === 'candled' || e.status === 'locked') {
        map[e.deviceId].activeCount += 1;
      }
    });
    return map;
  }, [eggEntries]);

  const num = (s: string) => s ? parseFloat(toEn(s).replace('٫', '.')) || null : null;

  // ═══ اعتبارسنجی زنده ═══
  const [chartMetric, setChartMetric] = useState<'temp' | 'humidity' | 'est' | 'co2' | 'o2'>('temp');
  const { errors: vErrors } = useValidation(
    createDeviceSchema(),
    {
      name: form.name || '',
      mode: form.mode,
      status: form.status,
      temp: num(form.temp),
      humidity: num(form.humidity),
      purchasedAt: form.purchasedAt || '',
      price: num(form.price),
      warranty: num(form.warranty),
      racks: num(form.racks),
      trays: num(form.trays),
      fans: num(form.fans),
      tempSensors: num(form.tempSensors),
      humiditySensors: num(form.humiditySensors),
      motorPower: num(form.motorPower),
      extraCost: num(form.extraCost),
      notes: form.notes || '',
    },
  );
  const int = (s: string) => s ? parseInt(toEn(s)) || null : null;

  const openNew = () => { setForm(empty); setErr(''); setOpen(true); };

  const openEdit = (d: Device) => {
    setForm({
      id: d.id, name: d.name,
      capacityByBird: d.capacityByBird || [],
      mode: d.mode, status: d.status,
      temp: d.temp ? toFa(d.temp) : '',
      humidity: d.humidity ? toFa(d.humidity) : '',
      purchasedAt: d.purchasedAt,
      price: d.price ? toFa(d.price) : '',
      warranty: d.warranty ? toFa(d.warranty) : '',
      racks: d.racks ? String(d.racks) : '',
      trays: d.trays ? String(d.trays) : '',
      fans: d.fans ? String(d.fans) : '',
      tempSensors: d.tempSensors ? String(d.tempSensors) : '',
      humiditySensors: d.humiditySensors ? String(d.humiditySensors) : '',
      motorPower: d.motorPower ? String(d.motorPower) : '',
      extraCost: d.extraCost ? toFa(d.extraCost) : '',
      notes: d.notes,
      estCurrent: d.estCurrent ? toFa(d.estCurrent) : '',
      co2Current: d.co2Current ? toFa(d.co2Current) : '',
      o2Current: d.o2Current ? toFa(d.o2Current) : '',
      turningCurrent: d.turningCurrent || 'auto',
    });
    setErr(''); setOpen(true);
  };
  const recordReading = (d: Device) => {
    const reading = {
      id: 'r-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      date: todayJalali(),
      temp: d.temp,
      humidity: d.humidity,
      est: d.estCurrent ?? null,
      co2: d.co2Current ?? null,
      o2: d.o2Current ?? null,
    };
    const currentReadings = d.readings || [];
    const next = [...currentReadings, reading].slice(-200);
    updateDevice(d.id, { readings: next } as any);
    toastMsg.saved('قرائت');
  };

  useFab(active ? { label: 'افزودن دستگاه', onClick: openNew } : null);






  const save = () => {
    setErr('');
    if (!form.id) {
      const dup = devices.find((x: any) => x.name.trim() === form.name.trim());
      if (dup) { setErr('دستگاهی با نام «' + dup.name + '» قبلاً ثبت شده'); return; }
    }
    if (!form.name.trim()) { setErr('نام دستگاه اجباری است'); return; }
    const data = {
      name: form.name.trim(),
      code: '',
      capacity: null,
      capacityByBird: form.capacityByBird,
      mode: form.mode,
      status: form.status,
      temp: num(form.temp),
      humidity: num(form.humidity),
      purchasedAt: form.purchasedAt.trim(),
      price: num(form.price),
      warranty: int(form.warranty),
      racks: int(form.racks),
      trays: int(form.trays),
      fans: int(form.fans),
      tempSensors: int(form.tempSensors),
      humiditySensors: int(form.humiditySensors),
      motorPower: num(form.motorPower),
      extraCost: num(form.extraCost),
      estCurrent: num(form.estCurrent),
      co2Current: num(form.co2Current),
      o2Current: num(form.o2Current),
      turningCurrent: (form.turningCurrent as 'on' | 'off' | 'auto') || 'auto',
      maintenanceLogs: [],
      equipmentId: '',
      notes: form.notes.trim(),
    };
    if (form.id) {
      updateDevice(form.id, data);
      toastMsg.saved(form.name || 'دستگاه')
    } else {
      addDevice(data);
      toastMsg.added(data.name, 'دستگاه')
    }
    setForm(empty);
    setErr('');
    setOpen(false);
  };

  const undoDeleteDevice = () => {
    if (!undoDevice) return;
    try {
      const arr: any[] = Array.isArray(undoDevice.device) ? undoDevice.device : [undoDevice.device];
      for (const d of arr) addDevice(d);
      toastMsg.restoredBulk(arr.length, 'دستگاه')
    } catch {
      toastMsg.error('بازگردانی ناموفق بود')
    }
    setUndoDevice(null);
  };

  const addMaintenance = (deviceId: string) => {
    const dev = devices.find(d => d.id === deviceId);
    if (!dev) return;
    if (!maintForm.date || !maintForm.type) { toastMsg.error('تاریخ و نوع تعمیر اجباری است'); return; }
    const log = {
      id: Date.now().toString(),
      date: maintForm.date,
      type: maintForm.type.trim(),
      cost: parseFloat(toEn(maintForm.cost).replace('٫', '.')) || null,
      description: maintForm.description.trim(),
    };
    const logs = [...((dev as any).maintenanceLogs || []), log];
    updateDevice(deviceId, { maintenanceLogs: logs } as any);
    setMaintForm({ date: '', type: '', cost: '', description: '' });
    setMaintDeviceId(null);
    toastMsg.success('تعمیر ثبت شد');
  };

  const removeMaintenance = async (deviceId: string, logId: string) => {
    const dev = devices.find(d => d.id === deviceId);
    if (!dev) return;
    if (!await showConfirmAsync('تأیید', 'حذف این رکورد تعمیر؟', { danger: true })) return;
    const logs = ((dev as any).maintenanceLogs || []).filter((l: any) => l.id !== logId);
    updateDevice(deviceId, { maintenanceLogs: logs } as any);
  };
  const warrantyForm = warrantyInfo(form.purchasedAt, parseInt(toEn(form.warranty)) || null);

  // ─── Multi-Select ───
  // فیلتر/مرتب
  const config = useMemo(() => getIncDevicesConfig(), []);
  const { filtered: list, filters, setFilter, clearFilter, sort, setSort, toggleSort,
          resetAll, hasActiveFilters, total, count } = useFilterSort<Device>({
    items: devices,
    filters: config.filterDefs,
    sorts: config.sortDefs,
    persistKey: config.persistKey,
    initialSort: config.initialSort,
  });

  const ms = useMultiSelect({
    items: list,
    getId: (d: any) => d.id,
    onDelete: async (ids: string[]) => {
      const ok = await showConfirmAsync('حذف گروهی', toFa(ids.length) + ' دستگاه حذف شوند؟', { danger: true });
      if (!ok) return;
      const backups: any[] = [];
      for (const id of ids) {
        const it = devices.find(d => d.id === id);
        if (!it) continue;
        backups.push(it);
        try { deleteDevice(id); } catch {}
      }
      if (backups.length > 0) {
        setUndoDevice({ device: backups });
        setTimeout(() => setUndoDevice((cur: any) => cur && Array.isArray(cur.device) && cur.device.length === backups.length ? null : cur), 8000);
      }
      toastMsg.deletedBulk(backups.length, 'دستگاه')
    },
  });

  useEffect(() => {
    if (ms.selectionMode) setExpandedId(null);
  }, [ms.selectionMode]);

  return (
    <PageContainer>
      {undoDevice && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px', marginBottom: 8,
          background: 'var(--warn-soft, var(--input-bg))',
          border: '1px solid var(--warn)',
          borderRadius: 'var(--r-md)',
          fontSize: 'var(--fs-sm)',
        }}>
          <span>دستگاه «{undoDevice.device.name}» حذف شد</span>
          <button type="button" onClick={undoDeleteDevice} style={{
            background: 'none', border: 'none',
            color: 'var(--warn)', fontWeight: 700, cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 'var(--fs-sm)', padding: '4px 10px',
          }}>بازگردانی</button>
        </div>
      )}
      <HelpBanner
        id="inc-devices-intro"
        icon="🏭"
        title="دستگاه‌های جوجه‌کشی"
        description="دستگاه‌های انکوباسیون و هچر را اینجا تعریف کنید. برای انتخاب چندتایی، روی یک کارت نگه دارید."
        tone="info"
      />
      <FilterBar
        filterDefs={config.filterDefs}
        sortDefs={config.sortDefs}
        filterState={filters}
        sortState={sort}
        setFilter={setFilter}
        clearFilter={clearFilter}
        setSort={setSort}
        toggleSort={toggleSort}
        resetAll={resetAll}
        hasActiveFilters={hasActiveFilters}
        total={total}
        count={count}
      />

      {!ms.selectionMode && list.length > 1 && (
        <div style={{ fontSize: '10px', color: 'var(--dim)', textAlign: 'center', paddingBottom: 2 }}>
          برای انتخاب چندتایی، روی یک کارت نگه دارید
        </div>
      )}

      {ms.selectionMode && list.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
          <button type="button"
            onClick={ms.selectedIds.size === list.length ? ms.clearSelection : ms.selectAll}
            style={{ padding: '4px 10px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', color: 'var(--muted)', fontFamily: 'inherit', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}>
            {ms.selectedIds.size === list.length ? 'لغو انتخاب همه' : 'انتخاب همه'}
          </button>
        </div>
      )}

      {devices.length > 0 && (
        <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, padding: '0 4px' }}>
          🏭 {toFa(devices.length)} دستگاه
        </div>
      )}
      {list.length === 0 ? (
        <Empty icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="4" y="2" width="16" height="20" rx="2"/></svg>}
          title="هنوز دستگاهی نساخته‌اید" desc="اولین دستگاه جوجه‌کشی خود را اضافه کنید."
          action={<Btn variant="primary" onClick={openNew}>+ افزودن دستگاه</Btn>} />
      ) : (
        <>
          {list.map((d, i) => (
                <DeviceCard
                  key={d.id}
                  d={d}
                  index={i}
                  stats={deviceStats[d.id] || { totalEggs: 0, activeCount: 0 }}
                  isOpen={!ms.selectionMode && expandedId === d.id}
                  onToggle={() => setExpandedId(!ms.selectionMode && expandedId === d.id ? null : d.id)}
                  ms={ms}
                  chartMetric={chartMetric}
                  setChartMetric={setChartMetric}
                  onEdit={() => openEdit(d)}
                  onDelete={() => {
                    if (!d.id) return;
                    const dev = devices.find(x => x.id === d.id);
                    if (dev) {
                      setUndoDevice({ device: dev });
                      setTimeout(() => setUndoDevice(cur => cur && cur.device.id === dev.id ? null : cur), 6000);
                    }
                    deleteDevice(d.id);
                    toastMsg.deleted('دستگاه');
                  }}
                  onRecordReading={() => recordReading(d)}
                  onRemoveMaintenance={(logId) => removeMaintenance(d.id, logId)}
                  onAddMaintenance={() => {
                    setMaintDeviceId(d.id);
                    setMaintForm({ date: '', type: '', cost: '', description: '' });
                  }}
                />
              ))}
          
        </>
      )}

      <MultiSelectBar ms={ms} deleteLabel="حذف" />

      {ms.selectionMode && <div style={{ height: 90 }} />}

      <DeviceFormModal
        open={open}
        setOpen={setOpen}
        form={form}
        setForm={setForm}
        err={err}
        vErrors={vErrors}
        devices={devices}
        birds={birds}
        save={save}
      />

      <MaintenanceModal
        open={!!maintDeviceId}
        form={maintForm}
        setForm={setMaintForm}
        onSave={() => { if (maintDeviceId) addMaintenance(maintDeviceId); }}
        onClose={() => setMaintDeviceId(null)}
      />
    </PageContainer>
  );
}
