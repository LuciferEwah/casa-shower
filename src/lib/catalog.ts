import { Gift } from '@/types';
import originalGiftsJson from '../../data/gifts-import.json';

export function getStableId(gift: { name: string; link?: string }) {
  const str = `${gift.name}_${gift.link || ''}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `g_${Math.abs(hash).toString(36)}`;
}

export function getOriginalGifts(): Gift[] {
  return (originalGiftsJson as Omit<Gift, 'id'>[]).map((gift) => {
    const id = getStableId(gift);
    return {
      ...gift,
      id,
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
