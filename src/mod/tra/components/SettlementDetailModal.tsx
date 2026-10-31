/**
 * SettlementDetailModal.tsx — نمایش جزئیات تسویه دوره‌ای
 * الگو: FlockHistoryModal (modal با KPI + جزئیات + BtnRow اکشن‌ها)
 * محتوا: از SettlementPrint.tsx (بدون اختراع)
 * مرجع: docs/modules/tra-deals.md
 */
import { Btn, BtnRow, Modal, Tag } from '../../../shr/components/ui';
import { Row, SectionTitle } from '../helpers';
import { toFa } from '../../../shr/utils/fa';
import { useCtc } from '../../ctc/store';
import { DEAL_LABEL } from '../store';
import type { Deal, Settlement } from '../types';

interface Props {
  open: boolean;
  settlement: Settlement | null;
  deal: Deal | null;
  onClose: () => void;
  onPrint: () => void;
  onConvert: () => void;
  onUndo: () => void;
  onReopen: () => void;
  onViewInvoice: () => void;
  onDelete?: () => void;
}

export default function SettlementDetailModal({
  open,
  settlement,
  deal,
  onClose,
  onPrint,
  onConvert,
  onUndo,
  onReopen,
  onViewInvoice,
  onDelete,
}: Props) {
  const { contacts } = useCtc();

  if (!settlement || !deal) return null;

  const party = contacts.find(c => c.id === deal.partyId);

  const statusLabel =
    settlement.status === 'draft' ? 'پیش‌نویس'
    : settlement.status === 'confirmed' ? 'تأییدشده'
    : 'فاکتورشده';

  const statusTone: 'amber' | 'info' | 'green' =
    settlement.status === 'draft' ? 'amber'
    : settlement.status === 'confirmed' ? 'info'
    : 'green';

  const balance = (settlement.netPayable || 0) - (settlement.paidAmount || 0);
  const salesSnapshot = settlement.salesSnapshot || [];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`📅 تسویه دوره‌ای — ${toFa(settlement.periodStart)} تا ${toFa(settlement.periodEnd)}`}
    >
      {/* KPI بالای modal (الگو: FlockHistoryModal) */}
      <div style={{
        padding: 'var(--sp-3) var(--sp-4)',
        background: 'var(--accent-soft)',
        border: '1px solid var(--accent-border)',
        borderRadius: 'var(--r-md)',
        marginBottom: 12,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
        fontSize: 13,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Tag tone={statusTone}>{statusLabel}</Tag>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)', marginTop: 4 }}>
            خالص: {toFa((settlement.netPayable || 0).toLocaleString('fa-IR'))} ت
          </span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>
          کمیسیون: {toFa((settlement.commission || 0).toLocaleString('fa-IR'))} ت
        </div>
      </div>

      {/* 📋 اطلاعات */}
      <SectionTitle>📋 اطلاعات</SectionTitle>
      <Row l="شماره قرارداد" v={deal.dealNumber || '—'} />
      <Row l="نوع معامله" v={DEAL_LABEL[deal.type] || deal.type} />
      <Row l="طرف حساب" v={party?.name || '—'} />
      <Row l="از تاریخ" v={toFa(settlement.periodStart)} />
      <Row l="تا تاریخ" v={toFa(settlement.periodEnd)} />

      {/* 📦 فروش‌های دوره */}
      <SectionTitle>📦 فروش‌های دوره ({toFa(salesSnapshot.length)})</SectionTitle>
      {salesSnapshot.length === 0 ? (
        <div style={{ padding: 'var(--sp-4)', textAlign: 'center', color: 'var(--muted)', fontSize: 'var(--fs-sm)' }}>
          فروشی در این دوره ثبت نشده است
        </div>
      ) : (
        salesSnapshot.map(s => {
          const good = (deal.goods || []).find(g => g.id === s.goodId);
          const qty = Number(s.quantity) || 0;
          const price = Number(s.unitPrice) || 0;
          const total = qty * price;
          return (
            <Row
              key={s.id}
              l={`${good?.name || '—'} • ${toFa(qty)} × ${toFa(price.toLocaleString('fa-IR'))}`}
              v={`${toFa(total.toLocaleString('fa-IR'))} ت`}
            />
          );
        })
      )}

      {/* 💰 خلاصه مالی */}
      <SectionTitle>💰 خلاصه مالی</SectionTitle>
      <Row l="فروش کل" v={`${toFa((settlement.grossSales || 0).toLocaleString('fa-IR'))} ت`} />
      <Row l="کمیسیون" v={`${toFa((settlement.commission || 0).toLocaleString('fa-IR'))} ت`} />
      <Row l="خالص قابل پرداخت" v={`${toFa((settlement.netPayable || 0).toLocaleString('fa-IR'))} ت`} />
      <Row l="دریافت‌شده" v={`${toFa((settlement.paidAmount || 0).toLocaleString('fa-IR'))} ت`} />
      <Row
        l="مانده"
        v={
          <span style={{ color: balance > 0 ? 'var(--danger)' : 'var(--accent)' }}>
            {toFa(Math.abs(balance).toLocaleString('fa-IR'))} ت
          </span>
        }
      />

      {/* اکشن‌ها بر اساس وضعیت */}
      {settlement.status === 'draft' && (
        <>
          <BtnRow>
            <Btn variant="outline" onClick={onPrint}>🖨️ چاپ</Btn>
            <Btn variant="primary" onClick={onConvert}>🧾 تبدیل به فاکتور</Btn>
          </BtnRow>
          {onDelete && (
            <BtnRow>
              <Btn variant="danger" onClick={onDelete}>🗑 حذف تسویه</Btn>
            </BtnRow>
          )}
        </>
      )}

      {settlement.status === 'confirmed' && (
        <>
          <BtnRow>
            <Btn variant="outline" onClick={onPrint}>🖨️ چاپ</Btn>
            <Btn variant="primary" onClick={onConvert}>🧾 تبدیل به فاکتور</Btn>
          </BtnRow>
          <BtnRow>
            <Btn variant="outline" onClick={onReopen}>✏️ بازگشت به پیش‌نویس</Btn>
          </BtnRow>
        </>
      )}

      {settlement.status === 'invoiced' && (
        <>
          <BtnRow>
            <Btn variant="outline" onClick={onPrint}>🖨️ چاپ</Btn>
            <Btn variant="outline" onClick={onViewInvoice}>📄 مشاهده فاکتور</Btn>
          </BtnRow>
          <BtnRow>
            <Btn variant="danger" onClick={onUndo}>↩️ لغو تبدیل</Btn>
          </BtnRow>
        </>
      )}

      <BtnRow>
        <Btn variant="primary" onClick={onClose}>بستن</Btn>
      </BtnRow>
    </Modal>
  );
}
