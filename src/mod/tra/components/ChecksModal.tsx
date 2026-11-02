/**
 * ChecksModal.tsx — مدیریت چک‌ها (modal)
 */
import { useState, useMemo } from 'react';
import { useTra, DEAL_LABEL } from '../store';
import type { PartyPayment, Invoice, Deal, CheckStatus } from '../store';
import { useCtc } from '../../ctc/store';
import { toFa } from '../../../shr/utils/fa';
import { daysUntilJalali } from '../helpers';
import { showConfirmAsync } from '../../../cor/store/dialog';
import { toastMsg } from '../../../cor/store/toast';
import { Modal, Btn, Empty } from '../../../shr/components/ui';

const CAT_LABEL: Record<string, string> = {
  chick: 'جوجه', egg: 'تخم', fertile_egg: 'تخم نطفه‌دار',
  adult: 'پرنده بالغ', feed: 'دان', medicine: 'دارو',
  vaccine: 'واکسن', herbal: 'داروی گیاهی', equipment: 'تجهیزات',
  manure: 'کود', broken: 'تخم شکسته', other: 'سایر',
};

const STATUS_INFO: Record<CheckStatus, { label: string; bg: string; color: string; icon: string }> = {
  pending:    { label: 'در دست',   bg: 'var(--warn-soft)',   color: 'var(--warn)',   icon: '⏳' },
  in_transit: { label: 'در جریان', bg: 'var(--info-soft, rgba(2,132,199,.12))', color: 'var(--info, #0284c7)', icon: '↑' },
  cleared:    { label: 'وصول شده', bg: 'var(--accent-soft)', color: 'var(--accent)', icon: '✓' },
  bounced:    { label: 'برگشتی',   bg: 'var(--danger-soft)', color: 'var(--danger)', icon: '✗' },
};

type FilterKey = 'all' | 'pending' | 'in_transit' | 'cleared' | 'bounced' | 'soon';

interface CheckRow {
  pp: PartyPayment;
  status: CheckStatus;
  partyName: string;
  roleLabel: string;
  subjectLabel: string;
  docNumber: string;
  daysUntilDue: number | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ChecksModal({ open, onClose }: Props) {
  const { partyPayments, invoices, deals, depositPartyPayment, clearPartyPayment, bouncePartyPayment } = useTra();
  const { contacts } = useCtc();
  const [filter, setFilter] = useState<FilterKey>('all');

  const rows = useMemo<CheckRow[]>(() => {
    const partyMap = new Map(contacts.map(c => [c.id, c]));
    const ppToInv = new Map<string, Invoice>();
    for (const inv of invoices) {
      for (const p of inv.payments || []) {
        if (p.partyPaymentId) ppToInv.set(p.partyPaymentId, inv);
      }
    }
    const ppToDeal = new Map<string, Deal>();
    for (const deal of deals) {
      for (const p of deal.payments || []) {
        if (p.partyPaymentId) ppToDeal.set(p.partyPaymentId, deal);
      }
    }
    return partyPayments
      .filter(pp => pp.method === 'check')
      .map(pp => {
        const status: CheckStatus = pp.status || 'pending';
        const party = partyMap.get(pp.partyId);
        const inv = ppToInv.get(pp.id);
        const deal = ppToDeal.get(pp.id);
        const days = pp.dueDate ? daysUntilJalali(pp.dueDate) : null;
        let roleLabel = '—';
        let subjectLabel = pp.notes || '—';
        let docNumber = '';
        if (inv) {
          roleLabel = inv.type === 'sale' ? 'خریدار' : 'فروشنده';
          subjectLabel = inv.items?.[0]?.description || CAT_LABEL[inv.category] || inv.category || '—';
          docNumber = inv.number || '';
        } else if (deal) {
          roleLabel = 'معامله';
          subjectLabel = deal.description || DEAL_LABEL[deal.type];
          docNumber = deal.dealNumber || '';
        }
        return { pp, status, partyName: party?.name || '—', roleLabel, subjectLabel, docNumber, daysUntilDue: days };
      })
      .sort((a, b) => {
        const order: Record<CheckStatus, number> = { pending: 0, in_transit: 1, cleared: 2, bounced: 3 };
        if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
        return (a.daysUntilDue ?? 999) - (b.daysUntilDue ?? 999);
      });
  }, [partyPayments, invoices, deals, contacts]);

  const counts = useMemo(() => {
    const c = { all: rows.length, pending: 0, in_transit: 0, cleared: 0, bounced: 0, soon: 0 };
    for (const r of rows) {
      c[r.status]++;
      if (r.status === 'pending' && r.daysUntilDue !== null && r.daysUntilDue >= 0 && r.daysUntilDue <= 7) c.soon++;
    }
    return c;
  }, [rows]);

  const summary = useMemo(() => {
    let hand = 0, transit = 0, cleared = 0, bounced = 0;
    for (const r of rows) {
      if (r.status === 'pending') hand += r.pp.amount;
      else if (r.status === 'in_transit') transit += r.pp.amount;
      else if (r.status === 'cleared') cleared += r.pp.amount;
      else if (r.status === 'bounced') bounced += r.pp.amount;
    }
    return { hand, transit, cleared, bounced, total: hand + transit };
  }, [rows]);

  const filtered = useMemo(() => {
    if (filter === 'all') return rows;
    if (filter === 'soon') return rows.filter(r => r.status === 'pending' && r.daysUntilDue !== null && r.daysUntilDue >= 0 && r.daysUntilDue <= 7);
    return rows.filter(r => r.status === filter);
  }, [rows, filter]);

  const groups = useMemo(() => {
    const urgent: CheckRow[] = [];
    const openRows: CheckRow[] = [];
    const closed: CheckRow[] = [];
    for (const r of filtered) {
      if (r.status === 'cleared' || r.status === 'bounced') closed.push(r);
      else if (r.status === 'pending' && r.daysUntilDue !== null && r.daysUntilDue >= 0 && r.daysUntilDue <= 7) urgent.push(r);
      else openRows.push(r);
    }
    return { urgent, open: openRows, closed };
  }, [filtered]);

  const handleAction = async (row: CheckRow, action: 'deposit' | 'clear' | 'bounce') => {
    const { pp } = row;
    const amountFa = toFa(pp.amount.toLocaleString('fa-IR'));
    const checkLabel = pp.checkNo ? `چک #${pp.checkNo}` : 'چک';
    let title = '', msg = '', confirmText = '', danger = false;
    if (action === 'deposit') {
      title = 'واریز به بانک';
      msg = `${checkLabel} به مبلغ ${amountFa} تومان را به بانک واریز می‌کنید؟`;
      confirmText = 'بله، واریز شد';
    } else if (action === 'clear') {
      title = 'تایید وصول';
      msg = `${checkLabel} به مبلغ ${amountFa} تومان وصول شد؟`;
      confirmText = 'بله، وصول شد';
    } else {
      title = 'تایید برگشت';
      msg = `${checkLabel} به مبلغ ${amountFa} تومان برگشت خورد؟ این عمل اثر مالی دارد.`;
      confirmText = 'بله، برگشت خورد';
      danger = true;
    }
    const ok = await showConfirmAsync(title, msg, { danger, confirmText });
    if (!ok) return;
    try {
      if (action === 'deposit') depositPartyPayment(pp.id);
      else if (action === 'clear') clearPartyPayment(pp.id);
      else bouncePartyPayment(pp.id);
      toastMsg.success('وضعیت چک به‌روز شد');
    } catch (e) {
      toastMsg.error(e instanceof Error ? e.message : 'خطا در ثبت');
    }
  };

  const filters: { key: FilterKey; label: string; count: number }[] = [
    { key: 'all', label: 'همه', count: counts.all },
    { key: 'pending', label: 'در دست', count: counts.pending },
    { key: 'in_transit', label: 'در جریان', count: counts.in_transit },
    { key: 'soon', label: 'نزدیک سرسید', count: counts.soon },
    { key: 'cleared', label: 'وصول شده', count: counts.cleared },
    { key: 'bounced', label: 'برگشتی', count: counts.bounced },
  ];

  const renderCard = (row: CheckRow) => {
    const info = STATUS_INFO[row.status];
    const dueLabel = row.daysUntilDue === null ? null
      : row.daysUntilDue < 0 ? `${toFa(Math.abs(row.daysUntilDue))} روز گذشته`
      : row.daysUntilDue === 0 ? 'امروز'
      : `${toFa(row.daysUntilDue)} روز مانده`;
    const dueTone = row.daysUntilDue !== null && row.daysUntilDue <= 3 ? 'var(--danger)'
      : row.daysUntilDue !== null && row.daysUntilDue <= 7 ? 'var(--warn)'
      : 'var(--muted)';
    const isUrgent = row.status === 'pending' && row.daysUntilDue !== null && row.daysUntilDue >= 0 && row.daysUntilDue <= 7;
    const rightBorder = row.status === 'bounced'
      ? '3px solid var(--danger)'
      : isUrgent ? '3px solid var(--warn)' : '1px solid var(--border)';
    return (
      <div key={row.pp.id} style={{
        background: 'var(--card)',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        borderLeft: '1px solid var(--border)',
        borderRight: rightBorder,
        borderRadius: 'var(--r-lg)', padding: '10px 12px', marginBottom: 6,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 800, color: 'var(--text)' }}>{row.partyName}</span>
            {row.roleLabel !== '—' && (
              <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 4, background: 'var(--input-bg)', color: 'var(--muted)' }}>{row.roleLabel}</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: 'var(--fs-md)', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{toFa(row.pp.amount.toLocaleString('fa-IR'))}</span>
            <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 500 }}>تومان</span>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)', fontWeight: 500 }}>{row.subjectLabel}</span>
          {dueLabel && <span style={{ fontSize: 'var(--fs-xs)', color: dueTone, fontWeight: 600, whiteSpace: 'nowrap' }}>{dueLabel}</span>}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 10, color: 'var(--dim)', fontWeight: 400 }}>
            چک شماره {row.pp.checkNo || '—'}{row.pp.bank ? ` • ${row.pp.bank}` : ''}
          </span>
          {row.docNumber && <span style={{ fontSize: 10, color: 'var(--dim)', fontWeight: 400 }}>فاکتور {row.docNumber}</span>}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 'var(--r-sm)', background: info.bg, color: info.color }}>{info.icon} {info.label}</span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {row.status === 'pending' && <Btn size="sm" variant="outline" onClick={() => void handleAction(row, 'deposit')}>↑ واریز به بانک</Btn>}
            {row.status === 'in_transit' && <Btn size="sm" variant="primary" onClick={() => void handleAction(row, 'clear')}>✓ وصول شد</Btn>}
            {(row.status === 'pending' || row.status === 'in_transit') && <Btn size="sm" variant="ghost" onClick={() => void handleAction(row, 'bounce')}>✗</Btn>}
            <button type="button" style={{
              width: 30, height: 30, borderRadius: 'var(--r-sm)',
              background: 'var(--btn-bg)', border: '1px solid var(--border)',
              color: 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, fontSize: 14
            }}>⋯</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Modal open={open} onClose={onClose} title="🧾 مدیریت چک‌ها" size="lg">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 8 }}>

        {rows.length > 0 && (
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '10px 12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--muted)' }}>کل چک‌های باز</span>
              <span style={{ fontSize: 'var(--fs-lg)', fontWeight: 800, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                {toFa(summary.total.toLocaleString('fa-IR'))}
                <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 500, color: 'var(--muted)', marginRight: 4 }}>تومان</span>
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 4px', borderLeft: '1px solid var(--border)' }}>
                <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 500 }}>در دست</span>
                <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: summary.hand > 0 ? 'var(--warn)' : 'var(--muted)', whiteSpace: 'nowrap' }}>{toFa(summary.hand.toLocaleString('fa-IR'))}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 4px' }}>
                <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 500 }}>در جریان</span>
                <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: summary.transit > 0 ? 'var(--info, #0284c7)' : 'var(--muted)', whiteSpace: 'nowrap' }}>{toFa(summary.transit.toLocaleString('fa-IR'))}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 4px', borderLeft: '1px solid var(--border)', borderTop: '1px solid var(--border)' }}>
                <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 500 }}>وصول شده</span>
                <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: summary.cleared > 0 ? 'var(--accent)' : 'var(--muted)', whiteSpace: 'nowrap' }}>{toFa(summary.cleared.toLocaleString('fa-IR'))}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 4px', borderTop: '1px solid var(--border)' }}>
                <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 500 }}>برگشتی</span>
                <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: summary.bounced > 0 ? 'var(--danger)' : 'var(--muted)', whiteSpace: 'nowrap' }}>{toFa(summary.bounced.toLocaleString('fa-IR'))}</span>
              </div>
            </div>
          </div>
        )}

        {rows.length > 0 && (
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
            {filters.map(f => (
              <button key={f.key} type="button" onClick={() => setFilter(f.key)} style={{
                padding: '6px 11px', fontSize: 'var(--fs-sm)',
                background: filter === f.key ? 'var(--accent-soft)' : 'var(--btn-bg)',
                border: `1px solid ${filter === f.key ? 'var(--accent-border)' : 'var(--border)'}`,
                borderRadius: 'var(--r-sm)',
                color: filter === f.key ? 'var(--accent)' : 'var(--muted)',
                fontWeight: filter === f.key ? 600 : 500,
                fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
              }}>{f.label} ({toFa(f.count)})</button>
            ))}
          </div>
        )}

        {groups.urgent.length > 0 && (
          <>
            <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--danger)', padding: '4px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
              ⚠ نیاز به اقدام فوری
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>
            {groups.urgent.map(renderCard)}
          </>
        )}

        {groups.open.length > 0 && (
          <>
            <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--muted)', padding: '4px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
              سایر چک‌های باز
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>
            {groups.open.map(renderCard)}
          </>
        )}

        {groups.closed.length > 0 && (
          <>
            <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--muted)', padding: '4px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
              بسته‌شده
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>
            {groups.closed.map(renderCard)}
          </>
        )}

        {rows.length === 0 && (
          <Empty icon={<span style={{ fontSize: 24 }}>📋</span>} title="هنوز چکی ثبت نشده" desc="برای ثبت چک، از طریق فاکتور یا معامله اقدام کنید" />
        )}

        {rows.length > 0 && filtered.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center', background: 'var(--input-bg)', borderRadius: 'var(--r-lg)' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>📋</div>
            <div style={{ fontSize: 'var(--fs-md)', fontWeight: 700, marginBottom: 4 }}>چکی با این فیلتر پیدا نشد</div>
            <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)' }}>فیلتر را تغییر دهید</div>
          </div>
        )}

      </div>
    </Modal>
  );
}
