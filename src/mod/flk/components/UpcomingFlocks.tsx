/**
 * UpcomingFlocks — گله‌های نزدیک به شروع تخم‌گذاری
 */
import { toFa } from '../../../shr/utils/fa';
import { MiniProgress } from '../../../shr/components/ProgressTracker';
import { DEFAULT_LAYING_START, getAgeDays, getLayingStartDay } from '../store';

export interface UpcomingFlocksProps {
  flocks: any[];
  birds: any[];
  breedStd: any;
  fmt: any;
}

export default function UpcomingFlocks(props: UpcomingFlocksProps) {
  const { flocks, birds, breedStd, fmt } = props;

  const upcoming = flocks.filter(f => {
    if (f.status !== 'active') return false;
    if (f.type !== 'layer' && f.type !== 'breeder') return false;
    const std = breedStd.byBreedId(f.breedId);
    const startDay = getLayingStartDay(f, std?.biology?.layingStartDay ?? DEFAULT_LAYING_START);
    const age = getAgeDays(f);
    return age < startDay && age >= startDay - 60;
  }).sort((a, b) => getAgeDays(b) - getAgeDays(a));

  if (upcoming.length === 0) return null;

  return (
    <div style={{
      background: 'var(--accent-soft)',
      border: '1px solid var(--accent-border)',
      borderRadius: 'var(--r-lg)',
      padding: 'var(--pad-comfy)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <span style={{ fontSize: 'var(--fs-md)' }}>⏳</span>
        <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--accent)' }}>
          نزدیک به شروع تخم‌گذاری ({fmt.int(upcoming.length)})
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {upcoming.map(f => {
          const age = getAgeDays(f);
          const std = breedStd.byBreedId(f.breedId);
          const startDay = getLayingStartDay(f, std?.biology?.layingStartDay ?? DEFAULT_LAYING_START);
          const remain = startDay - age;
          const bird = birds.find(b => b.id === f.birdId);
          return (
            <div key={f.id} style={{
              padding: 'var(--pad-normal)',
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 700 }}>{f.name}</span>
                <span style={{
                  fontSize: 'var(--fs-xs)',
                  color: remain <= 14 ? 'var(--warn)' : 'var(--muted)',
                  fontWeight: 700
                }}>
                  {fmt.int(remain)} روز مانده
                </span>
              </div>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginBottom: 6 }}>
                {bird?.name || '—'}  |  سن فعلی: {toFa(age)} روز
              </div>
              <MiniProgress current={age} target={startDay} color={remain <= 14 ? 'warn' : 'info'} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
