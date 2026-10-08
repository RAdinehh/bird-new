/**
 * DevicesPage — دستگاه‌های انکوباسیون (ظرفیت، تعمیرات، گارانتی)
 */
import { useTempUnit, toUserTemp, toCelsius, round1 } from '../../shr/utils/temp';
import { useFab } from '../../shr/hooks/useFab';
import { useState, useMemo, useEffect } from 'react';
import { useInc, type Device, type DeviceMode, type DeviceStatus } from './store';
import { useValidation } from '../../shr/validation/useValidation';
import { createDeviceSchema } from '../../shr/validation/rules/inc';
import { useSet } from '../set/store';
import { useBrd } from '../brd/store';
import { Btn, BtnRow, Empty, Field, Grid2, Input, Modal, MoneyField, NumField, PageContainer, Select, SectionTitle, Tag, ErrorBox , Textarea } from '../../shr/components/ui';
import ExpandableCard, { StatBox, Dot } from '../../shr/components/ExpandableCard';
import HelpBanner from '../../shr/components/HelpBanner';
import { useMultiSelect } from '../../shr/multiSelect/useMultiSelect';
import { useFilterSort, FilterBar, getIncDevicesConfig } from '../../shr/filter';
import MultiSelectBar from '../../shr/multiSelect/MultiSelectBar';
import DatePicker from '../../shr/components/DatePicker';
import { toFa, toEn } from '../../shr/utils/fa';
import { showToast, toastMsg } from '../../cor/store/toast';
import { showAlert, showConfirmAsync } from '../../cor/store/dialog';
import { parse as parseJ, addMonths, format as formatJ } from 'date-fns-jalali';
import { Row } from './helpers';
import OvNumField from './components/OvNumField';
import MaintenanceModal from './components/MaintenanceModal';
import CapacityEditor from './components/CapacityEditor';
import { STATUS_FA, MODE_FA, emptyForm as empty, type F } from './types-devices';
import { warrantyInfo } from './api/warranty';
import { useIncubationProfile } from './hooks';
import { logAction } from '../../cor/logger/auditLog';


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
    });
    setErr(''); setOpen(true);
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
    if (!maintForm.date || !maintForm.type) { showAlert('تاریخ و نوع تعمیر اجباری است'); return; }
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
    showAlert('تعمیر ثبت شد', '✅');
  };

  const removeMaintenance = async (deviceId: string, logId: string) => {
    const dev = devices.find(d => d.id === deviceId);
    if (!dev) return;
    if (!await showConfirmAsync('تأیید', 'حذف این رکورد تعمیر؟', { danger: true })) return;
    const logs = ((dev as any).maintenanceLogs || []).filter((l: any) => l.id !== logId);
    updateDevice(deviceId, { maintenanceLogs: logs } as any);
  };
  const accentFor = (s: DeviceStatus): any => s === 'active' ? 'accent' : s === 'idle' ? 'dim' : 'warn';
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
          {list.map((d, i) => {
            const stats = deviceStats[d.id] || { totalEggs: 0, activeCount: 0 };
            const totalEggs = stats.totalEggs;
            const activeEntries = stats.activeCount;
            const isOpen = !ms.selectionMode && expandedId === d.id;
            const caps = d.capacityByBird || [];
            const logs: any[] = (d as any).maintenanceLogs || [];
            const totalCap = caps.reduce((a, c) => a + (c.capacity || 0), 0);
            const usagePercent = totalCap > 0 ? Math.round((totalEggs / totalCap) * 100) : 0;
            const w = warrantyInfo(d.purchasedAt, d.warranty);
            return (
              <ExpandableCard key={d.id} id={d.id} ms={ms} accent={accentFor(d.status)} index={toFa(i + 1)} iconEmoji="🥚"
                title={d.name} subtitle={MODE_FA[d.mode] + ' · ' + STATUS_FA[d.status]}
                isOpen={isOpen} onToggle={() => setExpandedId(isOpen ? null : d.id)}
                badge={activeEntries > 0 ? <Tag tone="green">{toFa(activeEntries)} ورودی فعال</Tag> : undefined}
                stats={<>
                  <StatBox icon="📊" label="استفاده" value={toFa(totalEggs) + '/' + toFa(totalCap)} tone={usagePercent > 90 ? 'warn' : 'accent'} />
                  <Dot />
                  <StatBox icon="🔄" label="ورودی" value={toFa(activeEntries)} />
                  <Dot />
                  <StatBox icon="🛠" label="تعمیر" value={toFa(logs.length)} />
                </>}
              >
                {caps.length > 0 && (
                  <>
                    <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📊</span> ظرفیت</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                      {caps.map(c => (
                        <div key={c.birdName} style={{ padding: 'var(--pad-tight)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)', display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)' }}>
                          <span>{c.birdName}</span>
                          <span style={{ fontWeight: 600 }}>{c.capacity ? toFa(c.capacity) : '—'}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {(d.purchasedAt || d.price || d.warranty) && (
                  <>
                    <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>💰</span> مالی</div>
                    {d.price && <Row l="قیمت" v={toFa(d.price.toLocaleString('fa-IR')) + ' ت'} />}
                    {d.purchasedAt && <Row l="تاریخ خرید" v={toFa(d.purchasedAt)} />}
                    {d.warranty && <Row l="گارانتی" v={toFa(d.warranty) + ' ماه'} />}
                    {w && w.expired && (
                      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--danger)', fontWeight: 700, padding: '4px 8px', background: 'var(--danger-soft)', borderRadius: 'var(--r-sm)', textAlign: 'center' }}>
                        ⏰ گارانتی تمام شده ({toFa(w.end)})
                      </div>
                    )}
                  </>
                )}

                <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>🛠 تعمیرات</div>
                {logs.length === 0 ? (
                  <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)', padding: 8, textAlign: 'center' }}>تعمیری ثبت نشده</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 4 }}>
                    {logs.slice().reverse().slice(0, 6).map((m: any) => (
                      <div key={m.id} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' as any, fontSize: 'var(--fs-sm)', padding: '8px 24px 8px 8px', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)', position: 'relative' }}>
                        <button
                          type="button"
                          onClick={() => removeMaintenance(d.id, m.id)}
                          title="حذف"
                          aria-label="حذف"
                          style={{
                            position: 'absolute',
                            top: 3,
                            left: 3,
                            background: 'var(--danger-soft)',
                            border: '1px solid var(--danger)',
                            color: 'var(--danger)',
                            cursor: 'pointer',
                            borderRadius: 'var(--r-sm)',
                            fontSize: 12,
                            lineHeight: 1,
                            padding: '2px 5px',
                            fontWeight: 700,
                            minWidth: 18,
                            height: 36,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontFamily: 'inherit',
                          }}
                        >✕</button>
                        <span style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.type}</span>
                        <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>{toFa(m.date)}</span>
                        {m.cost ? <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent)', fontWeight: 600 }}>{toFa(m.cost.toLocaleString('fa-IR'))} ت</span> : null}
                      </div>
                    ))}
                  </div>
                )}
                <Btn size="sm" full onClick={() => { setMaintDeviceId(d.id); setMaintForm({ date: '', type: '', cost: '', description: '' }); }}>+ ثبت تعمیر</Btn>

                {d.notes && (
                  <>
                    <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📝</span> یادداشت</div>
                    <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.7, padding: 8, background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>{d.notes}</div>
                  </>
                )}

                <div style={{ display: 'flex', gap: 'var(--sp-2)' as any, paddingTop: 4 }}>
                  <Btn size="sm" onClick={() => openEdit(d)} style={{ flex: 1 }}>ویرایش</Btn>
                  <Btn size="sm" onClick={async () => {
                    if (!d.id) return;
                    const dev = devices.find(d => d.id === d.id);
                    if (dev) {
                    setUndoDevice({ device: dev });
                    setTimeout(() => setUndoDevice(cur => cur && cur.device.id === dev.id ? null : cur), 6000);
                    }
                    deleteDevice(d.id);
                    toastMsg.deleted('دستگاه')
                    }} aria-label="حذف دستگاه" style={{ flex: 1 }}>حذف</Btn>
                </div>
              </ExpandableCard>
            );
          })}
          
        </>
      )}

      <MultiSelectBar ms={ms} deleteLabel="حذف" />

      {ms.selectionMode && <div style={{ height: 90 }} />}

      <Modal open={open} onClose={() => setOpen(false)} title={form.id ? 'ویرایش دستگاه' : 'افزودن دستگاه'}
        footer={<BtnRow><Btn variant="primary" onClick={save} disabled={Object.keys(vErrors).length > 0}>ذخیره</Btn><Btn onClick={() => setOpen(false)}>لغو</Btn></BtnRow>}>

        <SectionTitle><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📋</span> مشخصات اصلی</SectionTitle>
        <Field label="نام دستگاه" required hint={
          form.name && devices.some(x => x.id !== form.id && x.name.trim() === form.name.trim())
            ? '⚠️ این نام قبلاً استفاده شده'
            : undefined
        }>
          <Input
            placeholder="مثلاً — دستگاه ۱"
            value={form.name}
            onChange={e => setForm({...form, name: e.target.value})}
            error={form.name && devices.some(x => x.id !== form.id && x.name.trim() === form.name.trim()) ? ' ' : undefined}
          />
        </Field>
        <Grid2>
          <Field label="حالت" required>
            <Select value={form.mode} onChange={e => setForm({...form, mode: e.target.value as DeviceMode})}>
              <option value="setter">ستر</option>
              <option value="hatcher">هچر</option>
              <option value="setter+hatcher">ستر + هچر</option>
            </Select>
          </Field>
          <Field label="وضعیت" required>
            <Select value={form.status} onChange={e => setForm({...form, status: e.target.value as DeviceStatus})}>
              <option value="active">✅ فعال</option>
              <option value="idle">⏸ غیرفعال</option>
              <option value="maintenance"><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>🔧</span> تعمیر</option>
              <option value="broken">❌ خراب</option>
            </Select>
          </Field>
        </Grid2>

        <SectionTitle><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📊</span> ظرفیت بر اساس پرنده</SectionTitle>
        <CapacityEditor
          birds={birds}
          capacityByBird={form.capacityByBird}
          onChange={(next) => setForm(f => ({ ...f, capacityByBird: next }))}
        />

        <SectionTitle>⚙ مشخصات فنی</SectionTitle>
        <Grid2>
          <Field label="تعداد راگ" hint="قفسه">
            <NumField placeholder="۰" value={form.racks} onChange={e => setForm({...form, racks: e.target.value})} unit="عدد" min={0} />
          </Field>
          <Field label="تعداد سبد" hint="Tray">
            <NumField placeholder="۰" value={form.trays} onChange={e => setForm({...form, trays: e.target.value})} unit="عدد" min={0} />
          </Field>
        </Grid2>
        <Grid2>
          <Field label="تعداد فن">
            <NumField placeholder="۰" value={form.fans} onChange={e => setForm({...form, fans: e.target.value})} unit="عدد" min={0} />
          </Field>
          <Field label="توان موتور">
            <NumField placeholder="۰" value={form.motorPower} onChange={e => setForm({...form, motorPower: e.target.value})} unit="W" min={0} />
          </Field>
        </Grid2>
        <Grid2>
          <Field label="سنسور دما">
            <NumField placeholder="۰" value={form.tempSensors} onChange={e => setForm({...form, tempSensors: e.target.value})} unit="عدد" min={0} />
          </Field>
          <Field label="سنسور رطوبت">
            <NumField placeholder="۰" value={form.humiditySensors} onChange={e => setForm({...form, humiditySensors: e.target.value})} unit="عدد" min={0} />
          </Field>
        </Grid2>

        <SectionTitle><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>💰</span> مالی</SectionTitle>
        <Grid2>
          <Field label="قیمت خرید">
            <MoneyField placeholder="۰" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
          </Field>
          <Field label="تاریخ خرید">
            <DatePicker value={form.purchasedAt} onChange={v => setForm({...form, purchasedAt: v})}  autoToday />
          </Field>
        </Grid2>
        <Grid2>
          <Field label="گارانتی (ماه)">
            <NumField placeholder="۲۴" value={form.warranty} onChange={e => setForm({...form, warranty: e.target.value})} unit="ماه" min={0} max={120} />
          </Field>
          <Field label="هزینه جانبی" hint="نصب، حمل">
            <MoneyField placeholder="۰" value={form.extraCost} onChange={e => setForm({...form, extraCost: e.target.value})} />
          </Field>
        </Grid2>
        {warrantyForm && (
          <div style={{ padding: 'var(--pad-normal)', background: warrantyForm.expired ? 'var(--danger-soft)' : 'var(--accent-soft)', border: '1px solid ' + (warrantyForm.expired ? 'var(--danger)' : 'var(--accent-border)'), borderRadius: 'var(--r-md)', fontSize: 'var(--fs-sm)', color: warrantyForm.expired ? 'var(--danger)' : 'var(--accent)', fontWeight: 700, textAlign: 'center' }}>
            {warrantyForm.expired ? '⏰ گارانتی تمام شده — ' : '✅ گارانتی تا — '}{toFa(warrantyForm.end)}
          </div>
        )}

        <SectionTitle><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📝</span> یادداشت</SectionTitle>
        <Input placeholder="..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />

        <ErrorBox>{err}</ErrorBox>
      </Modal>

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
