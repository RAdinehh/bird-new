/**
 * _hallsHelpers.ts — تایپ‌ها و توابع کمکی HallsPage
 */

export interface F {
  id?: string;
  name: string; code: string;
  length: string; width: string; height: string;
  capacity: string; targetTemp: string; targetHumidity: string;
  ventilation: string; light: string;
  ventilationSystem: string; feederType: string; drinkerType: string; litterType: string;
  address: string; builtAt: string; lastSanitizedAt: string; sanitizeNotes: string;
  status: string; responsibleId: string; notes: string;
  birdId: string; breedId: string;
}

export const empty: F = {
  name:'', code:'', length:'', width:'', height:'',
  capacity:'', targetTemp:'', targetHumidity:'', ventilation:'', light:'',
  ventilationSystem:'', feederType:'', drinkerType:'', litterType:'',
  address:'', builtAt:'', lastSanitizedAt:'', sanitizeNotes:'', status:'empty',
  responsibleId:'', notes:'', birdId:'', breedId:'',
};

/** محاسبه ظرفیت پیشنهادی بر اساس مساحت و نژاد */
export function calcSuggestedCapacity(
  length: number | null,
  width: number | null,
  densityMax: number | null,
): number | null {
  if (!length || !width || !densityMax) return null;
  const area = length * width;
  return Math.floor(area * densityMax);
}
