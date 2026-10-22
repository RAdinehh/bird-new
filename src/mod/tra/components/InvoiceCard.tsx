import { Tag, Btn } from '../../../shr/components/ui';
import ExpandableCard from '../../../shr/components/ExpandableCard';
import { toFa } from '../../../shr/utils/fa';
import {
  WORKFLOW_LABEL, STATUS_LABEL, remaining, paidSumAllocated, workflowTone, nextWorkflowStatus, CHECK_STATUS_LABEL, type Invoice
} from '../store';
import { Row, RowGrid, SectionTitle } from '../helpers';
import type { MultiSelectState } from '../../../shr/multiSelect/useMultiSelect';
import { formatInvoiceNumber } from '../calc';
import { useTra } from '../store';

interface Props {
  inv: Invoice;
  partyName?: string;
  isOpen: boolean;
  ms: MultiSelectState<Invoice>;
  onToggle: () => void;
  onTransferClick: () => void;
  onReopen?: () => void;
  onEdit?: () => void;
  index: number;
}

export default function InvoiceCard({ inv, partyName, isOpen, ms, onToggle, onTransferClick, onReopen, onEdit, index }: Props) {
  const { updateInvoice, allocations } = useTra();
  const rem2 = remaining(inv, allocations);
  const st = rem2 === 0 ? 'paid' : paidSumAllocated(inv, allocations) > 0 ? 'partial' : 'unpaid';

  return (
    <ExpandableCard
      id={inv.id}
      ms={ms}
      accent={rem2 === 0 ? 'accent' : 'warn'}
      index={toFa(index + 1)}
      iconEmoji="🛒"
      title={partyName || '—'}
      subtitle={`${toFa(inv.date)}${inv.number ? ` • ${formatInvoiceNumber(inv.number)}` : ''}`}
      isOpen={isOpen}
      onToggle={onToggle}
      badge={
        <div style={{ display: 'flex', gap: 'var(--sp-1)' }}>
          {/* اگر workflowStatus=paid، اون با STATUS_LABEL تکراری ئه — نشون نده */}
          {inv.workflowStatus && inv.workflowStatus !== 'paid' && (
            <Tag tone={workflowTone(inv.workflowStatus)}>
              {WORKFLOW_LABEL[inv.workflowStatus]}
            </Tag>
          )}
          <Tag tone={st === 'paid' ? 'green' : st === 'partial' ? 'amber' : 'red'}>
            {STATUS_LABEL[st as keyof typeof STATUS_LABEL] || '—'}
          </Tag>
        </div>
      }
      stats={
        <>
          <span>کل: <b>{toFa(inv.total.toLocaleString('fa-IR'))} تومان</b></span>
          {rem2 > 0 && <span style={{ color: 'var(--warn)' }}>مانده: <b>{toFa(rem2.toLocaleString('fa-IR'))}</b></span>}
          {inv.items.length > 0 && (
            <span>
              {toFa(inv.items.length)} قلم
              {(() => {
                const catSet = new Set((inv.items || []).map((it: any) => it.category || inv.category));
                if (catSet.size === 1) {
                  const cat = Array.from(catSet)[0] as string;
                  const labels: Record<string, string> = {
                    egg: 'تخم نطفه‌دار',
                    fertile_egg: 'تخم نطفه‌دار',
                    chick: 'جوجه',
                    adult: 'پرنده بالغ',
                    feed: 'دان',
                    medicine: 'دارو',
                    herbal: 'داروی گیاهی',
                    vaccine: 'واکسن',
                    equipment: 'تجهیزات',
                    manure: 'کود',
                    broken: 'شکسته',
                    other: 'سایر',
                  };
                  return <span style={{ color: 'var(--accent)', fontWeight: 700 }}> • {labels[cat] || cat}</span>;
                }
                return <span style={{ color: 'var(--muted)' }}> • مختلط</span>;
              })()}
            </span>
          )}
        </>
      }
    >
      <SectionTitle><span style={{ fontSize: 'var(--fs-sm)', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📋</span> اطلاعات</SectionTitle>
      <RowGrid>
        <Row l="فروشنده" v={partyName || '—'} />
        <Row l="تاریخ" v={toFa(inv.date)} />
        {inv.number ? <Row l="شماره" v={formatInvoiceNumber(inv.number)} /> : null}
        {inv.dueDate ? <Row l="سرسید" v={toFa(inv.dueDate)} /> : null}
        {inv.isPreorder && inv.deliveryDate ? <Row l="📅 تحویل" v={toFa(inv.deliveryDate)} /> : null}
      </RowGrid>

      <SectionTitle><span style={{ fontSize: 'var(--fs-sm)', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📦</span> اقلام</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
        {inv.items.map(it => (
          <Row key={it.id} l={`${it.description || '—'} • ${toFa(it.quantity)} عدد × ${toFa(it.unitPrice)} تومان`} v={`${toFa(it.total.toLocaleString('fa-IR'))} تومان`} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: 'var(--pad-normal)', background: 'var(--accent-soft)', color: 'var(--accent)', borderRadius: 'var(--r-sm)', fontWeight: 700 }}>
        <span>جمع کل:</span>
        <span>{toFa(inv.total.toLocaleString('fa-IR'))} تومان</span>
      </div>

      {inv.installments && inv.installments.length > 0 && (() => {
        const totalCount = inv.installments.length;
        const paidCount = inv.installments.filter(x => x.status === 'paid').length;
        const overdueCount = inv.installments.filter(x => x.status === 'overdue').length;
        return (
          <>
            <SectionTitle>
              <span style={{ fontSize: 'var(--fs-sm)', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📅</span>
              اقساط — {toFa(paidCount)} از {toFa(totalCount)} پرداخت شده
            </SectionTitle>
            {overdueCount > 0 && (
              <div style={{
                padding: 'var(--pad-tight)', background: 'var(--danger-soft)',
                color: 'var(--danger)', borderRadius: 'var(--r-sm)',
                fontSize: 'var(--fs-xs)', fontWeight: 600, textAlign: 'center',
                marginBottom: 'var(--sp-1)',
              }}>
                ⚠️ {toFa(overdueCount)} قسط معوق
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
              {inv.installments.map(inst => {
                const tone = inst.status === 'paid' ? 'green' : inst.status === 'overdue' ? 'red' : 'amber';
                const label = inst.status === 'paid' ? 'پرداخت شده' : inst.status === 'overdue' ? 'معوق' : 'در انتظار';
                const isPartial = inst.paidAmount !== undefined && inst.paidAmount > 0 && inst.paidAmount < (inst.amount || 0);
                return (
                  <div key={inst.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: 'var(--pad-tight) var(--pad-normal)',
                    background: 'var(--input-bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--r-sm)',
                    gap: 'var(--sp-2)',
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--text)' }}>
                        قسط {toFa(inst.number)}
                      </span>
                      <span style={{ fontSize: 'var(--fs-2xs)', color: 'var(--muted)' }}>
                        سرسید: {toFa(inst.dueDate)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--text)' }}>
                        {toFa((inst.amount || 0).toLocaleString('fa-IR'))} تومان
                      </span>
                      {isPartial && (
                        <span style={{ fontSize: 'var(--fs-2xs)', color: 'var(--accent)' }}>
                          پرداخت: {toFa((inst.paidAmount || 0).toLocaleString('fa-IR'))} تومان
                        </span>
                      )}
                      <Tag tone={tone}>{label}</Tag>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        );
      })()}

      {inv.payments && inv.payments.length > 0 && (
        <>
          <SectionTitle>💳 پرداخت‌ها</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
            {inv.payments.map(p => (
              <div key={p.id}>
                <Row
                  l={`${p.method === 'cash' ? '💵 نقدی' : p.method === 'card' ? '💳 کارت' : '📄 چک'} • ${toFa(p.date)}`}
                  v={`${toFa(p.amount.toLocaleString('fa-IR'))} تومان`}
                />
                {p.method === 'check' && (
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', padding: '2px 8px' }}>
                    چک {p.checkNo} • {p.bank} • {CHECK_STATUS_LABEL[p.status || 'pending']}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {inv.isPreorder && (
        <Btn
          variant="primary"
          size="sm"
          full
          onClick={() => {
            updateInvoice(inv.id, { 
              isPreorder: false, 
              workflowStatus: 'received',
              receivedAt: new Date().toISOString()
            });
          }}
          style={{ marginBottom: 8 }}
        >
          📦 تحویل گرفتم (ایجاد گله و موجودی)
        </Btn>
      )}
      {(onEdit || nextWorkflowStatus(inv.workflowStatus) || onReopen) ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
          {onEdit && (
            <Btn
              size="sm" variant="outline"
              onClick={onEdit}
              style={{ flex: '1 1 120px' }}
            >
              ✏️ ویرایش فاکتور
            </Btn>
          )}
          {nextWorkflowStatus(inv.workflowStatus) && (
            <Btn
              size="sm" variant="primary"
              onClick={onTransferClick}
              style={{ flex: '1 1 120px' }}
            >
              انتقال به {WORKFLOW_LABEL[nextWorkflowStatus(inv.workflowStatus)!]}
            </Btn>
          )}
          {onReopen && (
            <Btn
              size="sm" variant="primary"
              onClick={onReopen}
              style={{ flex: '1 1 120px' }}
            >
              🔓 بازگشایی
            </Btn>
          )}
        </div>
      ) : null}

    </ExpandableCard>
  );
}
