/**
 * EquipmentCard — کارت خلاصه تجهیزات در Dashboard
 * نمایش ارزش کل، تعداد فعال/تعمیر/اسقاط و تفکیک سالن
 */
import { useMemo } from 'react';
import { useWhs } from '../whs/store';
import { useHal } from '../hal/store';
import { SectionTitle, KpiCard, MiniStat, MiniEmpty } from './cards';
import { toFa } from '../../shr/utils/fa';

interface Props {
  nav: (p: string) => void;
}

export default function EquipmentCard({ nav }: Props) {
  const { items } = useWhs();
  const { halls } = useHal();

  const equipment = useMemo(() => items.filter(i => i.category === 'equipment'), [items]);

  const stats = useMemo(() => {
    let totalValue = 0;
    let active = 0, repair = 0, scrapped = 0, broken = 0;
    let warrantySoon = 0;
    const byHall: Record<string, { count: number; value: number }> = {};

    const today = new Date();
    equipment.forEach(eq => {
      const v = (eq.purchasePrice || 0);
      totalValue += v;
      const st = eq.equipmentStatus || 'active';
      if (st === 'broken') broken++;
      else if (st === 'repair' || st === 'repairing' || st === 'maintenance') repair++;
      else if (st === 'scrapped' || st === 'retired') scrapped++;
      else active++;

      if (eq.warrantyUntil) {
        try {
          const en = eq.warrantyUntil.replace(/[۰-۹]/g, (d: string) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
          const parts = en.split('/');
          if (parts.length === 3) {
            const wd = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            const diff = Math.ceil((wd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            if (diff >= 0 && diff <= 30) warrantySoon++;
          }
        } catch { /* ignore */ }
      }

      const hallId = eq.hallId || '__none__';
      if (!byHall[hallId]) byHall[hallId] = { count: 0, value: 0 };
      byHall[hallId].count++;
      byHall[hallId].value += v;
    });

    return { totalValue, active, repair, scrapped, broken, warrantySoon, byHall, total: equipment.length };
  }, [equipment]);

  if (equipment.length === 0) {
    return (
      <div style={{ marginTop: 14 }}>
        <SectionTitle>🔧 تجهیزات</SectionTitle>
        <MiniEmpty icon="🔧" title="تجهیزی ثبت نشده" hint="از بخش انبار → اقلام، تجهیزات رو ثبت کن" />
      </div>
    );
  }

  const hallRows = Object.entries(stats.byHall)
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.value - a.value);

  return (
    <div style={{ marginTop: 14 }}>
      <SectionTitle>🔧 تجهیزات</SectionTitle>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
        <KpiCard
          icon="💰"
          label="ارزش تجهیزات"
          value={stats.totalValue}
          unit="تومان"
          color="accent"
          onClick={() => nav('/whs/items')}
        />
        <KpiCard
          icon="🔧"
          label="تعداد اقلام"
          value={stats.total}
          unit="قلم"
          color="info"
          onClick={() => nav('/whs/items')}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 8 }}>
        <MiniStat label="✅ فعال" value={stats.active} suffix="" color="accent" />
        <MiniStat label="🔧 تعمیر" value={stats.repair} suffix="" color="warn" />
        <MiniStat label="❌ اسقاط" value={stats.scrapped} suffix="" color="danger" />
      </div>

      {stats.broken > 0 && (
        <div style={{
          marginTop: 8, padding: '8px 12px', background: 'var(--danger-soft)',
          color: 'var(--danger)', borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-sm)',
          fontWeight: 700, textAlign: 'center',
        }}>
          🔴 {toFa(stats.broken)} تجهیز خراب — بررسی کنید
        </div>
      )}

      {stats.warrantySoon > 0 && (
        <div style={{
          marginTop: 8, padding: '8px 12px', background: 'var(--warn-soft)',
          color: 'var(--warn)', borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-sm)',
          fontWeight: 700, textAlign: 'center',
        }}>
          ⏰ {toFa(stats.warrantySoon)} تجهیز — گارانتی نزدیک پایان (کمتر از ۳۰ روز)
        </div>
      )}

      {hallRows.length > 0 && (
        <div style={{ marginTop: 10, background: 'var(--input-bg)', borderRadius: 'var(--r-sm)', padding: '8px 10px' }}>
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700, marginBottom: 6 }}>
            📍 تفکیک بر اساس سالن
          </div>
          {hallRows.map(row => {
            const hall = row.id === '__none__' ? null : halls.find(h => h.id === row.id);
            const label = hall ? hall.name : 'بدون سالن';
            return (
              <div key={row.id} style={{
                display: 'flex', justifyContent: 'space-between',
                fontSize: 'var(--fs-sm)', padding: '3px 0',
              }}>
                <span style={{ color: 'var(--text)' }}>{label}</span>
                <span style={{ color: 'var(--muted)' }}>
                  {toFa(row.count)} قلم · {toFa(row.value.toLocaleString('fa-IR'))} ت
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
