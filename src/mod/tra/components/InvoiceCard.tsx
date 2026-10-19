import { Tag, Btn } from '../../../shr/components/ui';
import ExpandableCard from '../../../shr/components/ExpandableCard';
import { toFa } from '../../../shr/utils/fa';
import {
  WORKFLOW_LABEL, STATUS_LABEL, remaining, paidSum, workflowTone, nextWorkflowStatus, CHECK_STATUS_LABEL, type Invoice
} from '../store';
import { Row, SectionTitle } from '../helpers';
import type { MultiSelectState } from '../../../shr/multiSelect/useMultiSelect';

interface Props {
  inv: Invoice;
  partyName?: string;
  isOpen: boolean;
  ms: MultiSelectState<Invoice>;
  onToggle: () => void;
  onTransferClick: () => void;
  index: number;
}

export default function InvoiceCard({ inv, partyName, isOpen, ms, onToggle, onTransferClick, index }: Props) {
  const rem2 = remaining(inv);
  const st = rem2 === 0 ? 'paid' : paidSum(inv.payments || []) > 0 ? 'partial' : 'unpaid';

  return (
    <ExpandableCard
      id={inv.id}
      ms={ms}
      accent={rem2 === 0 ? 'accent' : 'warn'}
      index={toFa(index + 1)}
      iconEmoji="🛒"
      title={partyName || '—'}
      subtitle={`${toFa(inv.date)}${inv.number ? ` • ${inv.number}` : ''}`}
      isOpen={isOpen}
      onToggle={onToggle}
      badge={
        <div style={{ display: 'flex', gap: 4 }}>
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
          <span>کل: <b>{toFa(inv.total.toLocaleString('fa-IR'))} ت</b></span>
          {rem2 > 0 && <span style={{ color: 'var(--warn)' }}>مانده: <b>{toFa(rem2.toLocaleString('fa-IR'))}</b></span>}
          {inv.items.length > 0 && <span>{toFa(inv.items.length)} قلم</span>}
        </>
      }
    >
      <SectionTitle><span style={{ fontSize: 'var(--fs-sm)', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📋</span> اطلاعات</SectionTitle>
      <Row l="فروشنده" v={partyName || '—'} />
      <Row l="تاریخ" v={toFa(inv.date)} />
      {inv.number ? <Row l="شماره" v={inv.number} /> : null}
      {inv.dueDate ? <Row l="سرسید" v={toFa(inv.dueDate)} /> : null}
      {inv.isPreorder && inv.deliveryDate ? <Row l="📅 تاریخ تحویل" v={toFa(inv.deliveryDate)} /> : null}

      <SectionTitle><span style={{ fontSize: 'var(--fs-sm)', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📦</span> اقلام</SectionTitle>
      {inv.items.map(it => (
        <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: 'var(--pad-tight)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>
          <span>{it.description || '—'} × {toFa(it.quantity)}</span>
          <span style={{ fontWeight: 600 }}>{toFa(it.total.toLocaleString('fa-IR'))} ت</span>
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: 'var(--pad-normal)', background: 'var(--accent-soft)', color: 'var(--accent)', borderRadius: 'var(--r-sm)', fontWeight: 700 }}>
        <span>جمع کل:</span>
        <span>{toFa(inv.total.toLocaleString('fa-IR'))} ت</span>
      </div>

      {inv.payments && inv.payments.length > 0 && (
        <>
          <SectionTitle>💳 پرداخت‌ها</SectionTitle>
          {inv.payments.map(p => (
            <div key={p.id} style={{ padding: 'var(--pad-normal)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{p.method === 'cash' ? '💵 نقدی' : p.method === 'card' ? '💳 کارت' : '📄 چک'} • {toFa(p.date)}</span>
                <span style={{ fontWeight: 600 }}>{toFa(p.amount.toLocaleString('fa-IR'))} ت</span>
              </div>
              {p.method === 'check' && (
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 2 }}>
                  چک {p.checkNo} • {p.bank} • {CHECK_STATUS_LABEL[p.status || 'pending']}
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {nextWorkflowStatus(inv.workflowStatus) && (
        <Btn
          size="sm" variant="primary" full
          onClick={onTransferClick}
        >
          انتقال به {WORKFLOW_LABEL[nextWorkflowStatus(inv.workflowStatus)!]}
        </Btn>
      )}
    </ExpandableCard>
  );
}
