import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { Gift } from '@/types';
import { getOriginalGifts } from '@/lib/catalog';

export function useFirebaseGifts(slug: string) {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    
    const giftsRef = collection(db, `events/${slug}/gifts`);
    const unsubscribe = onSnapshot(giftsRef, (snap) => {
      const baseGifts = getOriginalGifts();
      const baseGiftsMap = new Map<string, Gift>();
      baseGifts.forEach(g => baseGiftsMap.set(g.id, g));
      
      const customGifts: Gift[] = [];
      const deletedIds = new Set<string>();
      
      snap.forEach(doc => {
        const id = doc.id;
        const data = doc.data();
        
        if (data.deleted === true) {
          deletedIds.add(id);
          return;
        }
        
        if (baseGiftsMap.has(id)) {
          const original = baseGiftsMap.get(id)!;
          baseGiftsMap.set(id, {
            ...original,
            ...data,
            id,
          } as Gift);
        } else {
          customGifts.push({
            id,
            ...data
          } as Gift);
        }
      });
      
      const mergedList: Gift[] = [];
      
      baseGifts.forEach(g => {
        if (!deletedIds.has(g.id)) {
          mergedList.push(baseGiftsMap.get(g.id)!);
        }
      });
      
      mergedList.push(...customGifts);
      
      setGifts(mergedList);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [slug]);

  return { gifts, loading };
}
