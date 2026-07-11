'use server';

import { adminDb } from '@/lib/firebase-admin';
import { checkAdmin } from './adminActions';
import { Gift } from '@/types';

// For guest (reserve)
export async function reserveGift(slug: string, id: string, guestName: string, guestLastname: string, guestEmail: string) {
  if (!guestName || !guestLastname) throw new Error("Nombre requerido");
  if (!guestEmail) throw new Error("Correo requerido");
  const fullName = `${guestName} ${guestLastname}`;
  const animal = "Osito"; // Mock
  
  const giftRef = adminDb.collection(`events/${slug}/gifts`).doc(id);
  
  await adminDb.runTransaction(async (transaction) => {
    const giftDoc = await transaction.get(giftRef);
    if (!giftDoc.exists) throw new Error("Regalo no encontrado");
    const data = giftDoc.data()!;
    const neededQuantity = data.neededQuantity || 1;
    const reservedCount = data.reservedCount || 0;
    
    if (!data.unlimited && reservedCount >= neededQuantity) {
      throw new Error("Agotado");
    }

    const prevList = data.reservedByList || [];
    
    transaction.update(giftRef, {
      reservedCount: reservedCount + 1,
      reservedByList: [...prevList, { name: fullName, animal, email: guestEmail }],
      reservedBy: fullName, // backward compatibility
      reservedByAnimal: animal,
      reservedByEmail: guestEmail
    });
  });

  return { success: true, animal };
}

// For Admin
export async function saveGift(slug: string, data: Omit<Gift, 'id'>, id?: string) {
  if (!(await checkAdmin(slug))) throw new Error('Unauthorized');
  
  if (id) {
    await adminDb.collection(`events/${slug}/gifts`).doc(id).update(data as Record<string, unknown>);
  } else {
    await adminDb.collection(`events/${slug}/gifts`).add(data as Record<string, unknown>);
  }
  return { success: true };
}

export async function deleteGift(slug: string, id: string) {
  if (!(await checkAdmin(slug))) throw new Error('Unauthorized');
  await adminDb.collection(`events/${slug}/gifts`).doc(id).delete();
  return { success: true };
}

export async function unreserveGift(slug: string, id: string) {
  if (!(await checkAdmin(slug))) throw new Error('Unauthorized');
  
  const giftRef = adminDb.collection(`events/${slug}/gifts`).doc(id);
  await giftRef.update({ 
    reservedByList: [], 
    reservedCount: 0,
    reservedBy: null, 
    reservedByAnimal: null,
    reservedByEmail: null
  });
  return { success: true };
}
