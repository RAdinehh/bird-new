import { createElement } from "react";
/**
 * HatchCard.tsx — کارت نتیجه‌ی یک هچ
 */
import { useFormat } from '../../../shr/units/useFormat';

import { toFa } from '../../../shr/utils/fa';
import { Btn, Tag } from '../../../shr/components/ui';
import ExpandableCard, { StatBox, Dot } from '../../../shr/components/ExpandableCard';
import { Row } from '../helpers';
import EntityLink from '../../../shr/components/EntityLink';
import { costPerChick, type HatchResult } from '../store';
import { calcChickYield } from '../api/needs';
import type { Bird } from '../../brd/store';
import type { EggEntry } from '../store';
import { CardActions } from '../../../shr/components/ui';
import { ACTION_PRESETS } from '../../../shr/constants/cardActions';

export interface HatchCardProps {
  hatch: HatchResult;
  index: number;
  bird: Bird;
  dev: any;
  entry: EggEntry;
  isOpen: boolean;
  ms: any;
  hr: number;
  realRate: number;
  aliveAfter: number;
  total: number;
  isComplete: boolean;
  tone: any;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onOpenFlock: () => void;
  onOpenSell: () => void;
}

export default function HatchCard(props: HatchCardProps) {
  const fmt = useFormat();
  const { hatch: h, index: i, bird, dev, entry, isOpen, ms, hr, realRate, aliveAfter, total, isComplete, tone, onToggle, onEdit, onDelete, onOpenFlock, onOpenSell } = props;

            return (
              <ExpandableCard key={h.id} id={h.id} ms={ms} accent="accent" index={fmt.count(i + 1)} iconEmoji="hatch"
                title={fmt.count(h.hatched || 0) + ' جوجه • ' + (bird?.name || '—')}
                subtitle={(dev?.name || '—') + ' • ' + fmt.date(h.date)}
                isOpen={isOpen} onToggle={() => onToggle()}
                badge={<Tag tone={tone}>{fmt.code(hr.toFixed(1))}٪</Tag>}
                stats={<>
                  <StatBox icon="📊" label="نرخ" value={fmt.code(hr.toFixed(0)) + '٪'} tone={hr >= 70 ? 'accent' : 'warn'} />
                  <Dot />
                  <StatBox icon="🥚" label="تخم" value={fmt.count(total)} />
                </>}
              >
 {isComplete && <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent)', fontWeight: 700, padding: 'var(--pad-tight)', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', borderRadius: 'var(--r-sm)', textAlign: 'center'}}>تکمیل — همه تخم‌ها شمارش شدن</div>}

 {total >0 && (h.hatched || 0) >0 && (
 <>
 <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px'}}><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}></span>توزیع</div>
 <div style={{ display: 'flex', height: 36, borderRadius: 4, overflow: 'hidden', background: 'var(--input-bg)'}}>
 {(h.hatched||0) >0 && <div style={{ width: ((h.hatched||0)/total*100)+'%', background: 'var(--accent)'}} />}
 {(h.deadInShell||0) >0 && <div style={{ width: ((h.deadInShell||0)/total*100)+'%', background: 'var(--danger)'}} />}
 {(h.pipped||0) >0 && <div style={{ width: ((h.pipped||0)/total*100)+'%', background: 'var(--warn)'}} />}
 {(h.unhatched||0) >0 && <div style={{ width: ((h.unhatched||0)/total*100)+'%', background: 'var(--muted)'}} />}
 </div>
 </>
 )}

 <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px'}}><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}></span>نتیجه هچ</div>
 <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
 {dev ? <Row l="دستگاه"v={createElement(EntityLink, { type: "device", id: dev.id, label: dev.name })} />: null}
 {h.generatedFlockId ? <Row l="گله ایجادشده"v={createElement(EntityLink, { type: "flock", id: h.generatedFlockId, label: 'مشاهده گله'})} />: null}
 <Row l="جوجه هچ‌شده"v={fmt.count(h.hatched || 0)} />
 <Row l="هچ‌نشده"v={fmt.count(h.unhatched || 0)} />
 {h.deadInShell ? <Row l="مرده در پوسته"v={fmt.count(h.deadInShell)} />: null}
 {h.pipped ? <Row l="نوک‌زده"v={fmt.count(h.pipped)} />: null}
 {h.other ? <Row l="سایر"v={fmt.count(h.other)} />: null}
 </div>

 {(h.gradeA || h.gradeB) && (
 <>
 <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px'}}><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}></span>تفکیک کیفی</div>
 <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
 {h.gradeA ? <Row l="درجه A"v={fmt.count(h.gradeA)} />: null}
 {h.gradeB ? <Row l="درجه B"v={fmt.count(h.gradeB)} />: null}
 </div>
 </>
 )}

 {(h.maleCount || h.femaleCount || h.unknownCount) && (
 <>
 <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px'}}><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}></span>جنسیت</div>
 <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
 {h.maleCount ? <Row l="نر"v={fmt.count(h.maleCount)} />: null}
 {h.femaleCount ? <Row l="ماده"v={fmt.count(h.femaleCount)} />: null}
 {h.unknownCount ? <Row l="? نامعلوم"v={fmt.count(h.unknownCount)} />: null}
 </div>
 </>
 )}

 {h.avgWeight ? <><div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px'}}><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}></span>وزن</div><Row l="وزن متوسط"v={fmt.num(h.avgWeight) + 'گرم'} /></>: null}

 <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px'}}><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}></span>نرخ‌ها</div>
 <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
 <Row l="نرخ هچ کل"v={fmt.code(hr.toFixed(1)) + '٪'} />
 {aliveAfter !== total && <Row l="نرخ از نطفه‌دار"v={fmt.code(realRate.toFixed(1)) + '٪'} />}
 {entry?.sampleWeightInitial && h.avgWeight && (() =>{
 const cy = calcChickYield(h.avgWeight, entry.sampleWeightInitial);
 if (!cy) return null;
 const icon = cy.level === 'ok'? '': cy.level === 'warn'? '': '';
 return <Row l="Chick Yield"v={`${icon} ${fmt.num(cy.value)}٪`} />;
 })()}
 </div>

 {entry?.totalPrice && h.hatched ? (
 <>
 <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px'}}><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}></span>هزینه</div>
 <Row l="هزینه هر جوجه"v={fmt.money(Math.round(costPerChick(entry.totalPrice, h.hatched)))} />
 </>
 ) : null}

 {h.notes && (
 <>
 <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px'}}><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}></span>یادداشت</div>
 <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.7, padding: 'var(--pad-normal)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)'}}>{h.notes}</div>
 </>
 )}

 {isComplete && (h.hatched || 0) >0 && (
 <div style={{ padding: 10, background: 'var(--input-bg)', border: '1px dashed var(--border)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 6 }}>
 <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px', textAlign: 'center'}}>مرحله بعد:</div>
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
 <Btn size="sm"onClick={onOpenFlock}><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}></span>گله</Btn>
 <Btn size="sm"onClick={onOpenSell}><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}></span>فروش</Btn>
 </div>
 </div>
 )}

 <CardActions actions={[
 { ...ACTION_PRESETS.EDIT, onClick: onEdit },
 { ...ACTION_PRESETS.DELETE, onClick: onDelete }
 ]} />
 </ExpandableCard>
  );
}
