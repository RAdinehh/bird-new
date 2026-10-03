import { useState, useMemo } from 'react';
import { useFlk, getAgeDays, getLifecycle, calcCosts, formatAge, SOURCE_LABEL, type Flock } from '../flk/store';
import { useBrd } from '../brd/store';
import { useHal } from '../hal/store';
import { Btn, BtnRow, Empty, Modal, PageContainer, Tag } from '../../shr/components/ui';
import ExpandableCard from '../../shr/components/ExpandableCard';
import { toFa } from '../../shr/utils/fa';

type Kind = 'flocks';

export default function ArchivePage() {
  const { flocks, restore, remove } = useFlk();
  const { birds, breeds } = useBrd();
  const { halls } = useHal();

  const [kind, setKind] = useState<Kind>('flocks');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [delId, setDelId] = useState<string | null>(null);

  const archivedFlocks = useMemo(
    () => flocks.filter(f => f.status === 'archived' || f.status === 'sold')
      .sort((a, b) => (b.endDate || '').localeCompare(a.endDate || '')),
    [flocks]
  );

  const target = delId ? flocks.find(f => f.id === delId) : null;

  return (
    <PageContainer>
      {/* آمار کلی */}
      <div style={{
        padding: '14px 16px',
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div>
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>آیتم آرشیو‌شده</div>
          <div style={{ fontSize: 'var(--fs-2xl)', fontWeight: 700, color: 'var(--text)', marginTop: 4 }}>
            {toFa(archivedFlocks.length)}
          </div>
        </div>
        <div style={{ fontSize: 40 }}>🗄</div>
      </div>

      {archivedFlocks.length === 0 ? (
        <Empty
          icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4"/></svg>}
          title="آرشیو خالی است"
          desc="آیتم‌هایی که آرشیو می‌کنید این‌جا نمایش داده می‌شوند."
        />
      ) : (
        <>
          {archivedFlocks.map((f, i) => {
            const bird = birds.find(b => b.id === f.birdId);
            const breed = breeds.find(b => b.id === f.breedId);
            const hall = halls.find(h => h.id === f.hallId);
            const ageDays = getAgeDays(f);
            const lc = getLifecycle(f.type, ageDays, (f as any).endOfCycleDay ?? null);
            const costs = calcCosts(f);
            const isOpen = expandedId === f.id;
            const statusLabel = f.status === 'sold' ? 'فروخته‌شده' : 'آرشیو';

            return (
              <ExpandableCard
                key={f.id}
                accent="dim"
                index={toFa(i + 1)}
                iconEmoji="🗄"
                title={f.name}
                subtitle={(bird?.name || '—') + (breed ? ' · ' + breed.name : '') + (hall ? ' · ' + hall.name : '')}
                isOpen={isOpen}
                onToggle={() => setExpandedId(isOpen ? null : f.id)}
                badge={<Tag tone={f.status === 'sold' ? 'green' : 'gray'}>{statusLabel}</Tag>}
                stats={
                  <>
                    <span>سن نهایی: <b style={{ color: 'var(--text)' }}>{toFa(ageDays)} روز</b></span>
                    {f.currentCount ? <span>تعداد: <b style={{ color: 'var(--text)' }}>{toFa(f.currentCount)}</b></span> : null}
                    {f.endDate ? <span>آرشیو: <b style={{ color: 'var(--text)' }}>{toFa(f.endDate)}</b></span> : null}
                  </>
                }
              >
                <SectionTitle><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📋</span> اطلاعات گله</SectionTitle>
                <Row l="پرنده" v={bird?.name || '—'} />
                <Row l="نژاد" v={breed?.name || '—'} />
                <Row l="سالن" v={hall?.name || '—'} />
                <Row l="نوع" v={f.type === 'layer' ? 'تخم‌گذار' : f.type === 'broiler' ? 'گوشتی' : 'مادر'} />
                <Row l="منبع" v={SOURCE_LABEL[f.source] || '—'} />
                <Row l="تعداد اولیه" v={f.initialCount ? toFa(f.initialCount) : '—'} />
                {f.currentCount ? <Row l="تعداد نهایی" v={toFa(f.currentCount)} /> : null}
                <Row l="سن نهایی" v={toFa(ageDays) + ' روز (' + formatAge(ageDays) + ')'} />

                <SectionTitle><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📅</span> تاریخ‌ها</SectionTitle>
                {f.hatchDate ? <Row l="هچ" v={toFa(f.hatchDate)} /> : null}
                {f.purchaseDate ? <Row l="خرید" v={toFa(f.purchaseDate)} /> : null}
                {f.startDate ? <Row l="شروع" v={toFa(f.startDate)} /> : null}
                {f.endDate ? <Row l="پایان" v={toFa(f.endDate)} /> : null}

                {costs.total > 0 ? (
                  <>
                    <SectionTitle><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>💰</span> هزینه‌ها</SectionTitle>
                    <Row l="جمع کل" v={toFa(costs.total.toLocaleString('fa-IR')) + ' ت'} />
                    {costs.perBird > 0 ? <Row l="هر پرنده" v={toFa(Math.round(costs.perBird).toLocaleString('fa-IR')) + ' ت'} /> : null}
                  </>
                ) : null}

                {f.notes ? (
                  <>
                    <SectionTitle><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📝</span> یادداشت</SectionTitle>
                    <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.7, padding: 'var(--pad-normal)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>{f.notes}</div>
                  </>
                ) : null}

                <div style={{ display: 'flex', gap: 6, paddingTop: 4 }}>
                  <Btn size="sm" onClick={() => { restore(f.id); setExpandedId(null); }} style={{ flex: 1 }}>🔄 بازیابی</Btn>
                  <Btn size="sm" onClick={() => setDelId(f.id)} style={{ flex: 1 }}>🗑 حذف نهایی</Btn>
                </div>
              </ExpandableCard>
            );
          })}
        </>
      )}

      <Modal
        open={delId !== null}
        onClose={() => setDelId(null)}
        title="حذف نهایی گله"
        footer={<BtnRow><Btn variant="danger" onClick={() => { if (delId) remove(delId); setDelId(null); }}>حذف کن</Btn><Btn onClick={() => setDelId(null)}>لغو</Btn></BtnRow>}
      >
        <div style={{ textAlign: 'center', fontSize: 'var(--fs-md)', lineHeight: 1.9 }}>
          حذف کامل <b>{target?.name}</b>؟
          <br />
          <span style={{ color: 'var(--danger)', fontSize: 'var(--fs-sm)' }}>
            ⚠ این عمل قابل بازگشت نیست. برای همیشه پاک می‌شود.
          </span>
        </div>
      </Modal>
    </PageContainer>
  );
}

function Row({ l, v }: { l: string; v: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: 'var(--pad-tight)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>
      <span style={{ color: 'var(--muted)' }}>{l}:</span>
      <span style={{ fontWeight: 600, color: 'var(--text)' }}>{v}</span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ paddingTop: 12, marginTop: 4, borderTop: '1px dashed var(--border)', fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)', letterSpacing: '.3px' }}>{children}</div>
  );
}
