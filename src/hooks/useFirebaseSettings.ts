import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Settings } from '@/types';

export function useFirebaseSettings() {
  const [settings, setSettings] = useState<Settings>({
    babyName: 'Kai',
    eventDate: '',
    eventPlace: '',
    customColor: '#4a4a4a',
    babyEmoji: '👶'
  });

  useEffect(() => {
    const settingsRef = doc(db, 'config', 'settings');
    const unsubscribe = onSnapshot(settingsRef, (snap) => {
      if (snap.exists()) {
        setSettings(snap.data() as Settings);
      }
    });

    return () => unsubscribe();
  }, []);

  return { settings };
}
