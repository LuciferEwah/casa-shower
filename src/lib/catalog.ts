import { Gift } from '@/types';
import originalGiftsJson from '../../data/gifts-import.json';

export function getOriginalGifts(): Gift[] {
  return (originalGiftsJson as Gift[]).map((gift) => {
    return {
      ...gift,
      reservedCount: gift.reservedCount || 0,
      reservedBy: gift.reservedBy || null,
      reservedByAnimal: gift.reservedByAnimal || null,
      reservedByEmail: gift.reservedByEmail || null,
      reservedByList: gift.reservedByList || [],
    } as Gift;
  });
}

export function getOriginalGiftsMap(): Record<string, Gift> {
  const map: Record<string, Gift> = {};
  getOriginalGifts().forEach((gift) => {
    map[gift.id] = gift;
  });
  return map;
}
