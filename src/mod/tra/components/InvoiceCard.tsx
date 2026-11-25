import { useInc } from '../../inc/store';
import { useWhs } from '../../whs/store';
import { useHal } from '../../hal/store';
import { useFormat } from '../../../shr/units/useFormat';
import { Tag, Btn, CardActions } from '../../../shr/components/ui';
import { ACTION_PRESETS } from '../../../shr/constants/cardActions';
import ExpandableCard from '../../../shr/components/ExpandableCard';
import { toFa , formatQty } from '../../../shr/utils/fa';
import {
  WORKFLOW_LABEL, STATUS_LABEL, remaining, paidSumAllocated, workflowTone, nextWorkflowStatus, CHECK_STATUS_LABEL, type Invoice
} from '../store';
import { Row, RowGrid, SectionTitle } from '../helpers';
import type { MultiSelectState } from '../../../shr/multiSelect/useMultiSelect';
import { formatInvoiceNumber } from '../calc';
import { useTra } from '../store';
import PickFlockModal from './PickFlockModal';
import { useFlk, type Flock } from '../../flk/store';
import { useState, createElement } from 'react';
import { toastMsg } from '../../../cor/store/toast';
import { showConfirmAsync } from '../../../cor/store/dialog';
import EntityLink from '../../../shr/components/EntityLink';

interface Props {
  inv: Invoice;
  partyName?: string;
  isOpen: boolean;
  ms: MultiSelectState<Invoice>;
  onToggle: () => void;
  onTransferClick: () => void;
  onReopen?: () => void;
  onEdit?: () => void;
  onDispute?: () => void;
  onResolveDispute?: () => void;
  onWriteOff?: () => void;
  index: number;
}

export default function InvoiceCard({ inv, partyName, isOpen, ms, onToggle, onTransferClick, onReopen, onEdit, onDispute, onResolveDispute, onWriteOff, index }: Props) {
  const { items: whsItems, movements: whsMovements } = useWhs();
  const { halls, zones, equipment } = useHal();
  const { hatches } = useInc();
  const fmt = useFormat();
  const { updateInvoice, allocations } = useTra();
  const { flocks, restore, update: updateFlock } = useFlk();
  const [flockPickerOpen, setFlockPickerOpen] = useState(false);
  // 🆕 استاندارد ERP: خواندن شناسه یکتا از خود سند (بدون حدس زدن)
  const invFlockId = inv.relatedFlockId || inv.items?.find((it: any) => it.flockId)?.flockId;
  const linkedFlock = flocks?.find((f: any) => 
    (invFlockId && f.id === invFlockId) || f.sourceInvoiceId === inv.id
  );
  const rem2 = remaining(inv, allocations);

  // 🆕 اتصال دستی هوشمند برای داده‌های قدیمی و گله‌های بدون فاکتور
  const liveBirdItems = (inv.items || []).filter(it => {
    const cat = it.category || inv.category;
    return (cat === 'chick' || cat === 'adult') && !!it.birdId;
  });
  const invoiceBirdIds = Array.from(new Set(liveBirdItems.map(it => it.birdId).filter(Boolean) as string[]));

  const handleManualLink = async (flock: Flock) => {
    if (flock.sourceInvoiceId && flock.sourceInvoiceId !== inv.id) {
      const ok = await showConfirmAsync(
        'تغییر فاکتور متصل به گله',
        `گله «${flock.name}» قبلاً به فاکتور دیگری متصل است. آیا اتصال قبلی جایگزین این فاکتور شود؟`,
        { confirmText: 'بله، جایگزین شود' }
      );
      if (!ok) return;
      // پاک کردن اتصال از فاکتور قبلی
      useTra.setState(state => ({
        invoices: state.invoices.map(i =>
          i.id === flock.sourceInvoiceId
            ? {
                ...i,
                relatedFlockId: '',
                items: i.items.map((it: any) => (it.flockId === flock.id || it.existingFlockId === flock.id) ? { ...it, flockId: '', existingFlockId: '' } : it),
              }
            : i
        ),
      }));
    }

    const firstBirdItem = liveBirdItems[0];
    const wasLinkedToOther = Boolean(flock.sourceInvoiceId && flock.sourceInvoiceId !== inv.id);
    const flockPatch: Partial<Flock> = {
      sourceInvoiceId: inv.id,
      sourceCategory: (firstBirdItem?.category || inv.category) as any,
    };
    if (!flock.birdId && firstBirdItem?.birdId) flockPatch.birdId = firstBirdItem.birdId;
    if (!flock.breedId && firstBirdItem?.breedId) flockPatch.breedId = firstBirdItem.breedId;
    if ((!flock.purchaseDate || wasLinkedToOther) && inv.date) flockPatch.purchaseDate = inv.date;
    if ((flock.purchasePrice == null || wasLinkedToOther) && firstBirdItem?.unitPrice) {
      flockPatch.purchasePrice = firstBirdItem.unitPrice;
    }

    // ۱. به‌روزرسانی گله
    updateFlock(flock.id, flockPatch);

    // ۲. به‌روزرسانی فاکتور (ذخیره شناسه گله در relatedFlockId، flockId و existingFlockId بدون اجرای cascade مجدد)
    useTra.setState(state => ({
      invoices: state.invoices.map(i =>
        i.id === inv.id
          ? {
              ...i,
              relatedFlockId: flock.id,
              items: i.items.map(it => {
                const cat = it.category || inv.category;
                return (cat === 'chick' || cat === 'adult') && it.birdId
                  ? { ...it, flockId: flock.id, existingFlockId: flock.id }
                  : it;
              }),
            }
          : i
      ),
    }));

    toastMsg.success(`فاکتور با موفقیت به گله «${flock.name}» متصل شد`);
  };

  const handleManualUnlink = async () => {
    if (!linkedFlock) return;
    const ok = await showConfirmAsync(
      'قطع اتصال فاکتور و گله',
      `آیا اتصال این فاکتور از گله «${linkedFlock.name}» قطع شود؟ (اطلاعات و موجودی گله حذف نمی‌شود)`,
      { confirmText: 'قطع اتصال' }
    );
    if (!ok) return;

    if (linkedFlock.sourceInvoiceId === inv.id) {
      updateFlock(linkedFlock.id, {
        sourceInvoiceId: '',
        sourceCategory: '',
      });
    }
    useTra.setState(state => ({
      invoices: state.invoices.map(i =>
        i.id === inv.id
          ? {
              ...i,
              relatedFlockId: i.relatedFlockId === linkedFlock.id ? '' : i.relatedFlockId,
              items: i.items.map((it: any) =>
                it.flockId === linkedFlock.id || it.existingFlockId === linkedFlock.id
                  ? { ...it, flockId: '', existingFlockId: '' }
                  : it
              ),
            }
          : i
      ),
    }));
    toastMsg.success('اتصال فاکتور از گله قطع شد');
  };
  const st = rem2 === 0 ? 'paid' : paidSumAllocated(inv, allocations) > 0 ? 'partial' : 'unpaid';

  return (
    <ExpandableCard
      id={inv.id}
      ms={ms}
      accent={rem2 === 0 ? 'accent' : 'warn'}
      index={fmt.count(index + 1)}
      iconEmoji="🛒"
      title={partyName || '—'}
      subtitle={`${fmt.date(inv.date)}${inv.number ? ` • ${formatInvoiceNumber(inv.number)}` : ''}`}
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
          {inv.disputeStatus === 'open' && (
              <Tag tone="amber">در اختلاف</Tag>
            )}
            {inv.writtenOff && (inv.writtenOffAmount || 0) > 0 && (
              <Tag tone={inv.type === 'purchase' ? 'amber' : 'red'}>
                {inv.type === 'purchase' ? 'بخشش مانده' : 'حذف بدحساب'}
              </Tag>
            )}
            <Tag tone={st === 'paid' ? 'green' : st === 'partial' ? 'amber' : 'red'}>
            {STATUS_LABEL[st as keyof typeof STATUS_LABEL] || '—'}
          </Tag>
        </div>
      }
      stats={
        <>
          <span>کل: <b>{fmt.money(inv.total, { withUnit: false })} تومان</b></span>
          {rem2 > 0 && <span style={{ color: 'var(--warn)' }}>مانده: <b>{fmt.money(rem2, { withUnit: false })}</b></span>}
          {inv.items.length > 0 && (
            <span>
              {fmt.count(inv.items.length)} قلم
              {(() => {
                const catSet = new Set((inv.items || []).map((it: any) => it.category || inv.category));
                const labels: Record<string, string> = {
                  egg: 'تخم نطفه‌دار', fertile_egg: 'تخم نطفه‌دار',
                  chick: 'جوجه', adult: 'پرنده بالغ', feed: 'دان',
                  medicine: 'دارو', herbal: 'داروی گیاهی', vaccine: 'واکسن',
                  equipment: 'تجهیزات', manure: 'کود', broken: 'شکسته', other: 'سایر',
                };
                const catNames = Array.from(catSet).map((c: any) => labels[c] || c);
                
                if (catNames.length === 1) {
                  return <span style={{ color: 'var(--accent)', fontWeight: 700 }}> • {catNames[0]}</span>;
                }
                
                if (catNames.length === 2) {
                  return <span style={{ color: 'var(--accent)', fontWeight: 700 }}> • {catNames.join('، ')}</span>;
                }
                
                // اگه بیشتر از ۲ دسته بود
                return (
                  <span style={{ color: 'var(--accent)', fontWeight: 700 }}>
                    {' • '}{catNames.slice(0, 2).join('، ')} و {fmt.count(catNames.length - 2)} دسته دیگر
                  </span>
                );
              })()}
            </span>
          )}
        </>
      }
    >
      <SectionTitle>اطلاعات</SectionTitle>
      <RowGrid>
        <Row l={inv.type === 'sale' ? 'خریدار' : 'فروشنده'} v={inv.partyId && partyName ? createElement(EntityLink, { type: 'party', id: inv.partyId, label: partyName }) : (partyName || '—')} />
        <Row l="تاریخ" v={fmt.date(inv.date)} />
        {inv.number ? <Row l="شماره" v={formatInvoiceNumber(inv.number)} /> : null}
        {inv.dueDate ? <Row l="سرسید" v={fmt.date(inv.dueDate)} /> : null}
            {linkedFlock ? (
              <Row
                l="گله متصل"
                v={createElement(EntityLink, { type: 'flock', id: linkedFlock.id, label: linkedFlock.name })}
              />
            ) : null}
        {inv.isPreorder && inv.deliveryDate ? <Row l="تحویل" v={fmt.date(inv.deliveryDate)} /> : null}
          {inv.writtenOff && (inv.writtenOffAmount || 0) > 0 ? (
            <Row
              l={inv.type === 'purchase' ? 'بخشش مانده' : 'حذف بدحساب'}
              v={`${fmt.money(inv.writtenOffAmount || 0, { withUnit: false })} تومان${inv.writtenOffReason ? ` (${inv.writtenOffReason})` : ''}${inv.writtenOffAt ? ` • ${fmt.date(inv.writtenOffAt)}` : ''}`}
            />
          ) : null}
      </RowGrid>

      <SectionTitle>اقلام</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
        {inv.items.map((it, idx) => {
          const invMovements = whsMovements.filter(m => (m.sourceModule === 'tra' && m.sourceId === inv.id) || (it.movementId && m.id === it.movementId));
          const linkedWhsId = it.itemId || it.stockItemId || (it.movementId ? whsMovements.find(m => m.id === it.movementId)?.itemId : undefined) || invMovements.find(m => {
            const w = whsItems.find(x => x.id === m.itemId);
            return w && it.description && (w.name === it.description || it.description.includes(w.name));
          })?.itemId;
          const linkedWhs = linkedWhsId ? whsItems.find(w => w.id === linkedWhsId) : undefined;
          const linkedHall = it.hallId ? halls.find(h => h.id === it.hallId) : undefined;
          const linkedZone = it.zoneId ? zones.find(z => z.id === it.zoneId) : undefined;
          const itemFlockId = it.flockId || it.existingFlockId;
          const linkedItemFlock = itemFlockId ? flocks.find(f => f.id === itemFlockId) : undefined;
          const linkedHatch = it.hatchId ? hatches.find(h => h.id === it.hatchId) : undefined;
          const invEquips = equipment?.filter(eq => eq.sourceInvoiceId === inv.id) || [];
          const linkedEquip = (it.equipmentId ? equipment?.find(eq => eq.id === it.equipmentId) : undefined) || (linkedWhsId ? equipment?.find(eq => eq.warehouseItemId === linkedWhsId) : undefined) || invEquips.find(eq => eq.name === it.description || eq.name === (it as any).model || (it.description && eq.name && (it.description.includes(eq.name) || eq.name.includes(it.description)))) || (invEquips.length === inv.items.length ? invEquips[idx] : (invEquips.length === 1 ? invEquips[0] : undefined));
          const showDesc = !linkedWhs && (!linkedEquip || (it.description && it.description.trim() !== linkedEquip.name.trim())) && (!linkedItemFlock || (it.description && it.description.trim() !== linkedItemFlock.name.trim()));
          return (
            <div key={it.id} >
              <RowGrid>
                {linkedWhs ? <Row l="کالا" v={createElement(EntityLink, { type: 'item', id: linkedWhs.id, label: linkedWhs.name })} /> : null}
                {showDesc ? <Row l="شرح" v={it.description || '—'} /> : null}
                {linkedItemFlock && linkedItemFlock.id !== linkedFlock?.id ? <Row l="گله" v={createElement(EntityLink, { type: 'flock', id: linkedItemFlock.id, label: linkedItemFlock.name })} /> : null}
                {linkedHall ? <Row l="سالن" v={createElement(EntityLink, { type: 'hall', id: linkedHall.id, label: linkedHall.name })} /> : null}
                {linkedZone ? <Row l="بخش" v={createElement(EntityLink, { type: 'zone', id: linkedZone.id, label: linkedZone.name })} /> : null}
                {linkedHatch ? <Row l="هچ" v={createElement(EntityLink, { type: 'device', tab: 'hatches', id: linkedHatch.id, label: `هچ ${fmt.date(linkedHatch.date)}` })} /> : null}
                {linkedEquip ? <Row l="تجهیز" v={createElement(EntityLink, { type: 'hall', tab: 'equipments', id: linkedEquip.id, label: linkedEquip.name })} /> : null}
                <Row l="مقدار" v={`${formatQty(it.quantity, it.unit || 'pcs')} × ${fmt.money(it.unitPrice || 0, { withUnit: false })}`} />
                <Row l="مبلغ" v={`${fmt.money(it.total, { withUnit: false })} تومان`} />
              </RowGrid>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: 'var(--pad-normal)', background: 'var(--accent-soft)', color: 'var(--accent)', borderRadius: 'var(--r-sm)', fontWeight: 700 }}>
        <span>جمع کل:</span>
        <span>{fmt.money(inv.total, { withUnit: false })} تومان</span>
      </div>

      {inv.installments && inv.installments.length > 0 && (() => {
        const totalCount = inv.installments.length;
        const paidCount = inv.installments.filter(x => x.status === 'paid').length;
        const overdueCount = inv.installments.filter(x => x.status === 'overdue').length;
        return (
          <>
            <SectionTitle>
              اقساط — {fmt.count(paidCount)} از {fmt.count(totalCount)} پرداخت شده
            </SectionTitle>
            {overdueCount > 0 && (
              <div style={{
                padding: 'var(--pad-tight)', background: 'var(--danger-soft)',
                color: 'var(--danger)', borderRadius: 'var(--r-sm)',
                fontSize: 'var(--fs-xs)', fontWeight: 600, textAlign: 'center',
                marginBottom: 'var(--sp-1)',
              }}>
                ⚠️ {fmt.count(overdueCount)} قسط معوق
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
                        قسط {fmt.count(inst.number)}
                      </span>
                      <span style={{ fontSize: 'var(--fs-2xs)', color: 'var(--muted)' }}>
                        سرسید: {fmt.date(inst.dueDate)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--text)' }}>
                        {fmt.money(inst.amount || 0, { withUnit: false })} تومان
                      </span>
                      {isPartial && (
                        <span style={{ fontSize: 'var(--fs-2xs)', color: 'var(--accent)' }}>
                          پرداخت: {fmt.money(inst.paidAmount || 0, { withUnit: false })} تومان
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
          <SectionTitle>پرداخت‌ها</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
            {inv.payments.map(p => (
              <div key={p.id}>
                <RowGrid>
                  <Row l="روش" v={p.method === 'cash' ? 'نقدی' : p.method === 'card' ? 'کارت' : 'چک'} />
                  <Row l="تاریخ" v={fmt.date(p.date)} />
                  <Row l="مبلغ" v={fmt.money(p.amount, { withUnit: false }) + ' تومان'} />
                  {p.method === 'check' && p.checkNo ? <Row l="شماره چک" v={p.checkNo} /> : null}
                  {p.method === 'check' && p.bank ? <Row l="بانک" v={p.bank} /> : null}
                  {p.method === 'check' ? <Row l="وضعیت چک" v={CHECK_STATUS_LABEL[p.status || 'pending']} /> : null}
                </RowGrid>
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
{inv.disputeStatus === 'open' && (
        <>
          <SectionTitle>یادداشت اختلاف</SectionTitle>
          <RowGrid>
            <Row
              l="علت اختلاف"
              v={inv.disputeReason === 'price' ? 'قیمت' : inv.disputeReason === 'quantity' ? 'تعداد' : inv.disputeReason === 'quality' ? 'کیفیت' : 'سایر'}
            />
            {inv.disputeOpenedAt ? <Row l="تاریخ ثبت" v={fmt.date(inv.disputeOpenedAt)} /> : null}
          </RowGrid>
          {inv.disputeNote ? <Row l="توضیحات" v={inv.disputeNote} /> : null}
        </>
      )}

      {(onEdit || nextWorkflowStatus(inv.workflowStatus) || onReopen || linkedFlock || onDispute || onResolveDispute || onWriteOff) && (() => {
        const nextWs = nextWorkflowStatus(inv.workflowStatus);
        const skipCashReceived = (String(inv.paymentTerms) === 'cash' || String(inv.paymentTerms) === 'card') && nextWs === 'received';
        const hasBirdItems = inv.type === 'purchase' && !inv.isPreorder && liveBirdItems.length > 0;
        const isFlockArchived = !!(linkedFlock && (linkedFlock.status === 'archived' || linkedFlock.status === 'sold'));

        return (
          <CardActions actions={[
            { label: nextWs === 'confirmed' ? 'ثبت نهایی' : nextWs === 'received' ? 'کالا رسید' : 'پرداخت کردم', onClick: onTransferClick, variant: 'primary', hidden: !nextWs || skipCashReceived },
            { label: 'حل شد', onClick: onResolveDispute || (() => {}), variant: 'primary', hidden: !onResolveDispute },
            { ...ACTION_PRESETS.RESTORE, onClick: () => { if (linkedFlock) { restore(linkedFlock.id); toastMsg.success('گله با موفقیت بازیابی شد'); } }, hidden: !isFlockArchived },
            { ...ACTION_PRESETS.EDIT, onClick: onEdit || (() => {}), hidden: !onEdit },
            { label: 'اتصال دستی', onClick: () => setFlockPickerOpen(true), variant: 'outline', hidden: !(!linkedFlock && hasBirdItems) },
            { label: 'قطع اتصال', onClick: handleManualUnlink, variant: 'outline', hidden: !(inv.type === 'purchase' && linkedFlock && inv.disputeStatus !== 'open') },
            { label: 'اختلاف', onClick: onDispute || (() => {}), variant: 'outline', hidden: !onDispute },
            { label: 'بازگشایی', onClick: onReopen || (() => {}), variant: 'outline', hidden: !onReopen },
            { label: inv.type === 'purchase' ? 'بخشش مانده' : 'حذف بدحساب', onClick: onWriteOff || (() => {}), variant: 'danger-outline', hidden: !onWriteOff },
          ]} />
        );
      })()}

      <PickFlockModal 
        open={flockPickerOpen} 
        onClose={() => setFlockPickerOpen(false)} 
        onSelect={handleManualLink} 
      />
    </ExpandableCard>
  );
}
