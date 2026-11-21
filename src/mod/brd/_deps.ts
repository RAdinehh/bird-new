/** src/mod/brd/_deps.ts — بررسی وابستگی پرنده و نژاد پیش از حذف */
import { useBrd } from "./store";
import { useFlk } from "../flk/store";
import { useInc } from "../inc/store";
import { useTra } from "../tra/store";
import { toFa } from "../../shr/utils/fa";

export function getBirdDeleteWarning(birdIds: string[]): string {
  const idSet = new Set(birdIds);
  const brd = useBrd.getState();
  const flk = useFlk.getState();
  const inc: any = useInc.getState();
  const tra: any = useTra.getState();

  const breedsCount = (brd.breeds || []).filter((b) => idSet.has(b.birdId)).length;
  const flocksCount = (flk.flocks || []).filter((f: any) => idSet.has(f.birdId)).length;
  const incList: any[] = inc.entries || inc.batches || [];
  const incCount = incList.filter((e: any) => idSet.has(e.birdId)).length;
  const invCount = (tra.invoices || []).filter((inv: any) =>
    Array.isArray(inv.items) && inv.items.some((it: any) => idSet.has(it.birdId))
  ).length;

  const parts: string[] = [];
  if (breedsCount > 0) parts.push(`${toFa(breedsCount)} نژاد`);
  if (flocksCount > 0) parts.push(`${toFa(flocksCount)} گله`);
  if (incCount > 0) parts.push(`${toFa(incCount)} دوره جوجه‌کشی`);
  if (invCount > 0) parts.push(`${toFa(invCount)} فاکتور`);

  if (parts.length === 0) return "";
  const subj = birdIds.length === 1 ? "این پرنده" : "این پرنده‌ها";
  return `\n\n⚠️ هشدار: ${subj} به ${parts.join("، ")} متصل است. با حذف، نژادهای زیرمجموعه نیز پاک شده و نام پرنده در گزارش‌ها و بخش‌های مرتبط نامشخص می‌شود.`;
}

export function getBreedDeleteWarning(breedIds: string[]): string {
  const idSet = new Set(breedIds);
  const flk = useFlk.getState();
  const inc: any = useInc.getState();
  const tra: any = useTra.getState();

  const flocksCount = (flk.flocks || []).filter((f: any) => idSet.has(f.breedId)).length;
  const incList: any[] = inc.entries || inc.batches || [];
  const incCount = incList.filter((e: any) => idSet.has(e.breedId)).length;
  const invCount = (tra.invoices || []).filter((inv: any) =>
    Array.isArray(inv.items) && inv.items.some((it: any) => idSet.has(it.breedId))
  ).length;

  const parts: string[] = [];
  if (flocksCount > 0) parts.push(`${toFa(flocksCount)} گله`);
  if (incCount > 0) parts.push(`${toFa(incCount)} دوره جوجه‌کشی`);
  if (invCount > 0) parts.push(`${toFa(invCount)} فاکتور`);

  if (parts.length === 0) return "";
  const subj = breedIds.length === 1 ? "این نژاد" : "این نژادها";
  return `\n\n⚠️ هشدار: ${subj} به ${parts.join("، ")} متصل است. با حذف، نام نژاد در گزارش‌ها و بخش‌های مرتبط نامشخص می‌شود.`;
}
