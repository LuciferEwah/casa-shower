export type GiftCategory = 'bronze' | 'silver' | 'gold';

export function getGiftCategory(price: number): GiftCategory {
  if (price < 10000) return 'bronze';
  if (price < 30000) return 'silver';
  return 'gold';
}

export const categoryLabels = {
  bronze: { label: 'Bronce 🥉', color: 'from-amber-700 to-amber-900', border: 'border-amber-700/50' },
  silver: { label: 'Plata 🥈', color: 'from-slate-400 to-slate-600', border: 'border-slate-400/50' },
  gold: { label: 'Oro 🥇', color: 'from-yellow-400 to-yellow-600', border: 'border-yellow-500/50' }
};
