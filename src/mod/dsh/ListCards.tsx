/**
 * ListCards — coordinator چهار بخش Dashboard
 */
import { MiniEmpty } from './cards';
import AlertList from './sections/AlertList';
import FlockList from './sections/FlockList';
import ActiveIncubations from './sections/ActiveIncubations';
import StockAlertCard from './sections/StockAlertCard';
import type { AlertLevel } from '../alt/store';

interface Props {
  active: Array<{ level: AlertLevel; [k: string]: any }>;
  counts: Record<string, number>;
  activeFlocks: any[];
  birds: any[];
  productions: any[];
  activeEntries: any[];
  stockAlerts: number;
  nav: (p: string) => void;
}

export default function ListCards({
  active, counts, activeFlocks, birds, productions,
  activeEntries, stockAlerts, nav,
}: Props) {
  const isEmpty = active.length === 0 && activeFlocks.length === 0
                  && activeEntries.length === 0 && stockAlerts === 0;

  if (isEmpty) {
    return (
      <MiniEmpty
        icon="✅"
        title="همه‌چیز مرتبه"
        hint="هیچ هشدار، گله فعال، یا جوجه‌کشی در جریان نیست"
      />
    );
  }

  return (
    <>
      <AlertList active={active} counts={counts} nav={nav} />
      <FlockList activeFlocks={activeFlocks} birds={birds} productions={productions} nav={nav} />
      <ActiveIncubations activeEntries={activeEntries} birds={birds} nav={nav} />
      <StockAlertCard stockAlerts={stockAlerts} nav={nav} />
    </>
  );
}
