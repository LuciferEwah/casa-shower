'use server';

import { adminDb } from '@/lib/firebase-admin';
import { checkAdmin } from './adminActions';
import { Gift } from '@/types';

// For guest (reserve)
export async function reserveGift(
  slug: string, 
  id: string, 
  guestName: string, 
  guestLastname: string, 
  guestEmail: string, 
  quantity: number = 1,
  accompaniment?: {
    isCouple?: boolean;
    partnerName?: string;
    partnerLastname?: string;
    hasChildren?: boolean;
    childrenCount?: number;
  }
) {
  if (!guestName || !guestLastname) throw new Error("Nombre requerido");
  if (!guestEmail) throw new Error("Correo requerido");
  if (!Number.isFinite(quantity) || quantity < 1) throw new Error("Cantidad inválida");
  const fullName = `${guestName} ${guestLastname}`;
  const animal = "Osito"; // Mock
  
  const giftRef = adminDb.collection(`events/${slug}/gifts`).doc(id);
  
  await adminDb.runTransaction(async (transaction) => {
    const giftDoc = await transaction.get(giftRef);
    if (!giftDoc.exists) throw new Error("Regalo no encontrado");
    const data = giftDoc.data() as Omit<Gift, 'id'>;
    const neededQuantity = data.neededQuantity || 1;
    const reservedCount = data.reservedCount || 0;
    const minQuantity = Math.max(1, Number(data.minQuantity) || 1);

    if (quantity < minQuantity) {
      throw new Error(
        `No se puede bajar. El mínimo para este producto es ${minQuantity}`
      );
    }
    
    if (!data.unlimited && reservedCount + quantity > neededQuantity) {
      throw new Error(`Solo quedan ${neededQuantity - reservedCount} unidades disponibles`);
    }

    if (!data.unlimited && neededQuantity - reservedCount < minQuantity) {
      throw new Error(
        `No hay unidades suficientes. El mínimo para este producto es ${minQuantity}`
      );
    }

    const prevList = data.reservedByList || [];
    const newReservations = Array(quantity).fill({ 
      name: fullName, 
      animal, 
      email: guestEmail,
      firstName: guestName,
      lastName: guestLastname,
      isCouple: accompaniment?.isCouple || false,
      partnerName: accompaniment?.partnerName || null,
      partnerLastname: accompaniment?.partnerLastname || null,
      hasChildren: accompaniment?.hasChildren || false,
      childrenCount: accompaniment?.childrenCount || 0
    });
    
    transaction.update(giftRef, {
      reservedCount: reservedCount + quantity,
      reservedByList: [...prevList, ...newReservations],
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

// For Admin (remove all reservations of a specific email/name for a gift)
export async function adminRemoveReservationByEmail(slug: string, id: string, identifier: string) {
  if (!(await checkAdmin(slug))) throw new Error('Unauthorized');
  
  const giftRef = adminDb.collection(`events/${slug}/gifts`).doc(id);
  
  await adminDb.runTransaction(async (transaction) => {
    const giftDoc = await transaction.get(giftRef);
    if (!giftDoc.exists) throw new Error("Regalo no encontrado");
    const data = giftDoc.data()!;
    
    const prevList = data.reservedByList || [];
    
    // Filter out all reservations matching the identifier (email or name if email is not present)
    const newList = prevList.filter((r: { name: string, email?: string }) => {
      const rKey = r.email ? r.email.toLowerCase() : r.name.toLowerCase();
      return rKey !== identifier.toLowerCase();
    });
    
    const removedCount = prevList.length - newList.length;
    if (removedCount === 0) {
      throw new Error("No se encontraron reservas para este usuario");
    }

    const newCount = Math.max(0, (data.reservedCount || 0) - removedCount);
    
    const updates: Record<string, unknown> = {
      reservedCount: newCount,
      reservedByList: newList
    };
    
    if (newCount === 0) {
      updates.reservedBy = null;
      updates.reservedByAnimal = null;
      updates.reservedByEmail = null;
    } else {
      updates.reservedBy = newList[0].name;
      updates.reservedByAnimal = newList[0].animal;
      updates.reservedByEmail = newList[0].email;
    }
    
    transaction.update(giftRef, updates);
  });

  return { success: true };
}

export async function updateGuestReservations(
  slug: string, 
  email: string, 
  fullName: string,
  firstName: string,
  lastName: string,
  accompaniment: {
    isCouple?: boolean;
    partnerName?: string;
    partnerLastname?: string;
    hasChildren?: boolean;
    childrenCount?: number;
  }
) {
  const giftsColl = adminDb.collection(`events/${slug}/gifts`);
  const snap = await giftsColl.get();
  
  const batch = adminDb.batch();
  let updatedCount = 0;
  
  snap.forEach(doc => {
    const data = doc.data();
    if (data.reservedByList) {
      let modified = false;
      const newList = data.reservedByList.map((r: {
        name: string;
        animal: string;
        email?: string;
        firstName?: string;
        lastName?: string;
        isCouple?: boolean;
        partnerName?: string;
        partnerLastname?: string;
        hasChildren?: boolean;
        childrenCount?: number;
      }) => {
        if (r.email?.toLowerCase() === email.toLowerCase()) {
          modified = true;
          return {
            ...r,
            name: fullName,
            firstName: firstName,
            lastName: lastName,
            isCouple: accompaniment.isCouple || false,
            partnerName: accompaniment.partnerName || null,
            partnerLastname: accompaniment.partnerLastname || null,
            hasChildren: accompaniment.hasChildren || false,
            childrenCount: accompaniment.childrenCount || 0
          };
        }
        return r;
      });
      
      if (modified) {
        batch.update(doc.ref, { reservedByList: newList });
        updatedCount++;
      }
    }
  });
  
  if (updatedCount > 0) {
    await batch.commit();
  }
  return { success: true };
}

export async function findExistingGuestIdentity(slug: string, email: string) {
  const giftsColl = adminDb.collection(`events/${slug}/gifts`);
  const snap = await giftsColl.get();
  
  for (const doc of snap.docs) {
    const data = doc.data();
    if (data.reservedByList) {
      const r = data.reservedByList.find((res: {
        name: string;
        animal: string;
        email?: string;
        firstName?: string;
        lastName?: string;
        isCouple?: boolean;
        partnerName?: string;
        partnerLastname?: string;
        hasChildren?: boolean;
        childrenCount?: number;
      }) => res.email?.toLowerCase() === email.toLowerCase());
      if (r) {
        let firstName = r.firstName || '';
        let lastName = r.lastName || '';
        
        if (!firstName && r.name) {
          const parts = r.name.split(' ');
          firstName = parts[0] || '';
          lastName = parts.slice(1).join(' ') || '';
        }
        
        return {
          found: true,
          identity: {
            name: firstName,
            lastname: lastName,
            email: email.toLowerCase(),
            isCouple: r.isCouple || false,
            partnerName: r.partnerName || undefined,
            partnerLastname: r.partnerLastname || undefined,
            hasChildren: r.hasChildren || false,
            childrenCount: r.childrenCount || undefined
          }
        };
      }
    }
  }
  
  return { found: false };
}
