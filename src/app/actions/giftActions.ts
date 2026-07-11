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

// For guest (cancel their own reservation)
export async function cancelReservation(slug: string, id: string, guestEmail: string) {
  if (!guestEmail) throw new Error("Correo requerido");
  
  const giftRef = adminDb.collection(`events/${slug}/gifts`).doc(id);
  
  await adminDb.runTransaction(async (transaction) => {
    const giftDoc = await transaction.get(giftRef);
    if (!giftDoc.exists) throw new Error("Regalo no encontrado");
    const data = giftDoc.data()!;
    
    const prevList = data.reservedByList || [];
    const indexToRemove = prevList.findIndex((r: { email?: string }) => r.email?.toLowerCase() === guestEmail.toLowerCase());
    
    if (indexToRemove === -1) {
      throw new Error("No tienes reservas para este regalo");
    }

    const newList = [...prevList];
    newList.splice(indexToRemove, 1);
    
    const newCount = Math.max(0, (data.reservedCount || 1) - 1);
    
    const updates: Record<string, unknown> = {
      reservedCount: newCount,
      reservedByList: newList
    };
    
    // Clear backward compatibility fields if no reservations left
    if (newCount === 0) {
      updates.reservedBy = null;
      updates.reservedByAnimal = null;
      updates.reservedByEmail = null;
    } else if (indexToRemove === 0) {
      // If we removed the first one, update legacy fields to the new first one
      updates.reservedBy = newList[0].name;
      updates.reservedByAnimal = newList[0].animal;
      updates.reservedByEmail = newList[0].email;
    }
    
    transaction.update(giftRef, updates);
  });

  return { success: true };
}

// For Admin (remove specific reservation by index)
export async function adminRemoveReservationIndex(slug: string, id: string, indexToRemove: number) {
  if (!(await checkAdmin(slug))) throw new Error('Unauthorized');
  
  const giftRef = adminDb.collection(`events/${slug}/gifts`).doc(id);
  
  await adminDb.runTransaction(async (transaction) => {
    const giftDoc = await transaction.get(giftRef);
    if (!giftDoc.exists) throw new Error("Regalo no encontrado");
    const data = giftDoc.data()!;
    
    const prevList = data.reservedByList || [];
    if (indexToRemove < 0 || indexToRemove >= prevList.length) {
      throw new Error("Índice de reserva inválido");
    }

    const newList = [...prevList];
    newList.splice(indexToRemove, 1);
    
    const newCount = Math.max(0, (data.reservedCount || 1) - 1);
    
    const updates: Record<string, unknown> = {
      reservedCount: newCount,
      reservedByList: newList
    };
    
    if (newCount === 0) {
      updates.reservedBy = null;
      updates.reservedByAnimal = null;
      updates.reservedByEmail = null;
    } else if (indexToRemove === 0) {
      updates.reservedBy = newList[0].name;
      updates.reservedByAnimal = newList[0].animal;
      updates.reservedByEmail = newList[0].email;
    }
    
    transaction.update(giftRef, updates);
  });

  return { success: true };
}

