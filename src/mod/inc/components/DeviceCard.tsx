import { toFa } from '../../../shr/utils/fa';
import { Btn, Select, Tag } from '../../../shr/components/ui';
import ExpandableCard, { StatBox, Dot } from '../../../shr/components/ExpandableCard';
import { LineChart } from '../../../shr/components/Charts';
import type { Device, DeviceStatus } from '../store';
import { STATUS_FA, MODE_FA } from '../types-devices';
import { Row } from '../helpers';
import { warrantyInfo } from '../api/warranty';
import { CardActions } from '../../../shr/components/ui';

interface Props {
  d: Device;
  index: number;
  stats: { totalEggs: number; activeCount: number };
  isOpen: boolean;
  onToggle: () => void;
  ms: any;
  chartMetric: 'temp' | 'humidity' | 'est' | 'co2' | 'o2';
  setChartMetric: (m: 'temp' | 'humidity' | 'est' | 'co2' | 'o2') => void;
  onEdit: () => void;
  onDelete: () => void;
  onRecordReading: () => void;
  onRemoveMaintenance: (logId: string) => void;
  onAddMaintenance: () => void;
}

const accentFor = (s: DeviceStatus): any => s === 'active' ? 'accent' : s === 'idle' ? 'dim' : 'warn';

export default function DeviceCard({
  d, index, stats, isOpen, onToggle, ms, chartMetric, setChartMetric,
  onEdit, onDelete, onRecordReading, onRemoveMaintenance, onAddMaintenance,
}: Props) {
  const totalEggs = stats.totalEggs;
  const activeEntries = stats.activeCount;
  const caps = d.capacityByBird || [];
  const logs: any[] = (d as any).maintenanceLogs || [];
  const totalCap = caps.reduce((a, c) => a + (c.capacity || 0), 0);
  const usagePercent = totalCap > 0 ? Math.round((totalEggs / totalCap) * 100) : 0;
  const w = warrantyInfo(d.purchasedAt, d.warranty);

  return (
    <ExpandableCard key={d.id} id={d.id} ms={ms} accent={accentFor(d.status)} index={toFa(index + 1)} iconEmoji="🥚"
                title={d.name} subtitle={MODE_FA[d.mode] + ' • ' + STATUS_FA[d.status]}
                isOpen={isOpen} onToggle={onToggle}
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

                {(d.temp != null || d.humidity != null || d.estCurrent != null || d.co2Current != null || d.o2Current != null) && (
                <>
                  <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>🌡 پایش زنده</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {d.temp != null && <Row l="دما محیط" v={toFa(d.temp) + '°C'} />}
                    {d.humidity != null && <Row l="رطوبت" v={toFa(d.humidity) + '٪'} />}
                    {d.estCurrent != null && <Row l="EST (پوسته تخم)" v={toFa(d.estCurrent) + '°C'} />}
                    {d.co2Current != null && <Row l="CO₂" v={toFa(d.co2Current) + '٪'} />}
                    {d.o2Current != null && <Row l="O₂" v={toFa(d.o2Current) + '٪'} />}
                    {d.turningCurrent && <Row l="چرخش" v={d.turningCurrent === 'on' ? '🔄 روشن' : d.turningCurrent === 'off' ? '⏸ قطع' : '🤖 خودکار'} />}
                  </div>
                  <Btn size="sm" full onClick={onRecordReading}>📊 ثبت قرائت</Btn>

                  {(d.readings || []).length > 0 && (
                    <>
                      <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px', marginTop: 4 }}>
                        📈 روند ({(d.readings || []).length} قرائت)
                      </div>
                      <Select value={chartMetric} onChange={(e: any) => setChartMetric(e.target.value as 'temp' | 'humidity' | 'est' | 'co2' | 'o2')}>
                        <option value="temp">دما محیط (°C)</option>
                        <option value="humidity">رطوبت (٪)</option>
                        <option value="est">EST (°C)</option>
                        <option value="co2">CO₂ (٪)</option>
                        <option value="o2">O₂ (٪)</option>
                      </Select>
                      <LineChart
                        data={(d.readings || []).slice(-30).map((r: { date: string; temp?: number | null; humidity?: number | null; est?: number | null; co2?: number | null; o2?: number | null }) => ({
                          label: r.date.slice(5),
                          value: r[chartMetric] ?? 0,
                        }))}
                        color="var(--accent)"
                        height={140}
                      />
                    </>
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
                          onClick={() => onRemoveMaintenance(m.id)}
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
                <Btn size="sm" full onClick={onAddMaintenance}>+ ثبت تعمیر</Btn>

                {d.notes && (
                  <>
                    <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📝</span> یادداشت</div>
                    <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.7, padding: 8, background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>{d.notes}</div>
                  </>
                )}

                <div style={{ display: 'flex', gap: 'var(--sp-2)' as any, paddingTop: 4 }}>
                  <CardActions actions={[
                    { label: 'ویرایش', onClick: onEdit, variant: 'outline' },
                    { label: 'حذف', onClick: onDelete, variant: 'danger' }
                  ]} />
                </div>
              </ExpandableCard>
  );
}
