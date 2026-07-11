'use server';

import { adminDb } from '@/lib/firebase-admin';
import { checkAdmin } from './adminActions';

// For guest (reserve)
export async function reserveGift(id: string, unlimited: boolean, guestName: string, guestLastname: string) {
  if (!guestName || !guestLastname) throw new Error("Nombre requerido");
  const fullName = `${guestName} ${guestLastname}`;
  const animal = "Osito"; // Mock
  
  const giftRef = adminDb.collection('gifts').doc(id);
  
  if (unlimited) {
    const giftDoc = await giftRef.get();
    const data = giftDoc.data();
    const prevList = data?.reservedByList || [];
    await giftRef.update({
      reservedByList: [...prevList, { name: fullName, animal }]
    });
  } else {
    await giftRef.update({
      reservedBy: fullName,
      reservedByAnimal: animal
    });
  }
  return { success: true, animal };
}

import { Gift } from '@/types';

// For Admin
export async function saveGift(data: Omit<Gift, 'id'>, id?: string) {
  if (!(await checkAdmin())) throw new Error('Unauthorized');
  
  if (id) {
    await adminDb.collection('gifts').doc(id).update(data);
  } else {
    await adminDb.collection('gifts').add(data);
  }
  return { success: true };
}

export async function deleteGift(id: string) {
  if (!(await checkAdmin())) throw new Error('Unauthorized');
  await adminDb.collection('gifts').doc(id).delete();
  return { success: true };
}

export async function unreserveGift(id: string, unlimited: boolean) {
  if (!(await checkAdmin())) throw new Error('Unauthorized');
  
  const giftRef = adminDb.collection('gifts').doc(id);
  if (unlimited) {
    await giftRef.update({ reservedByList: [] });
  } else {
    await giftRef.update({ reservedBy: null, reservedByAnimal: null });
  }
  return { success: true };
}
