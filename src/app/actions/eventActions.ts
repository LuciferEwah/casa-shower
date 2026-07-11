'use server';

import { adminDb } from '@/lib/firebase-admin';
import * as bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { Settings } from '@/types';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-fallback-key');

export async function createEvent(slug: string, babyName: string, adminPin: string) {
  if (!slug || !babyName || !adminPin) throw new Error("Todos los campos son requeridos");
  if (!/^[a-z0-9-]+$/.test(slug)) throw new Error("El slug solo puede contener letras minusculas, numeros y guiones");
  if (adminPin.length < 4) throw new Error("El PIN debe tener al menos 4 digitos");

  const eventRef = adminDb.collection('events').doc(slug);
  
  await adminDb.runTransaction(async (t) => {
    const doc = await t.get(eventRef);
    if (doc.exists) {
      throw new Error("El slug ya esta en uso");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPin = await bcrypt.hash(adminPin, salt);

    t.set(eventRef, {
      babyName,
      adminPinHash: hashedPin,
      eventDate: '',
      eventPlace: '',
      customColor: '#4a4a4a',
      babyEmoji: '🏠',
      createdAt: new Date().toISOString()
    });
  });

  const cookieStore = await cookies();
  const authorizedSlugs: string[] = [];
  
  // Actually since we don't read existing token here easily without jose.jwtVerify, let's just make it simple
  // Overwrite token with just this slug for simplicity on creation, or parse if valid.
  authorizedSlugs.push(slug);
  
  const token = await new SignJWT({ authorizedSlugs })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(JWT_SECRET);
    
  cookieStore.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30
  });

  return { success: true };
}

export async function updateEventSettings(slug: string, newSettings: Partial<Settings>) {
  const { checkAdmin } = await import('./adminActions');
  const isAuth = await checkAdmin(slug);
  if (!isAuth) throw new Error("No autorizado");
  
  const eventRef = adminDb.collection('events').doc(slug);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { adminPinHash: _1, createdAt: _2, ...safeSettings } = newSettings as any;
  
  await eventRef.update(safeSettings);
  return { success: true };
}
