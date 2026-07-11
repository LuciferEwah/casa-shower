import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { Gift } from '@/types';

export function useFirebaseGifts() {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const giftsRef = collection(db, 'gifts');
    const unsubscribe = onSnapshot(giftsRef, (snap) => {
      const data: Gift[] = [];
      snap.forEach(doc => data.push({ id: doc.id, ...doc.data() } as Gift));
      setGifts(data);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { gifts, loading };
}
