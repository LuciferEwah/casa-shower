'use server';

import { cookies } from 'next/headers';
import { adminDb } from '@/lib/firebase-admin';
import * as bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-fallback-key');

export async function loginAdmin(slug: string, pin: string) {
  const eventRef = adminDb.collection('events').doc(slug);
  const eventSnap = await eventRef.get();
  
  if (!eventSnap.exists) {
    return { success: false, error: 'Evento no encontrado' };
  }

  const data = eventSnap.data();
  if (!data?.adminPinHash) {
    return { success: false, error: 'Evento no configurado' };
  }

  const isValid = await bcrypt.compare(pin, data.adminPinHash);
  if (!isValid) {
    return { success: false, error: 'PIN incorrecto' };
  }

  const cookieStore = await cookies();
  const existingToken = cookieStore.get('auth_token')?.value;
  let authorizedSlugs: string[] = [];

  if (existingToken) {
    try {
      const { payload } = await jwtVerify(existingToken, JWT_SECRET);
      authorizedSlugs = (payload.authorizedSlugs as string[]) || [];
    } catch {
      // Token invalid, start fresh
    }
  }

  if (!authorizedSlugs.includes(slug)) {
    authorizedSlugs.push(slug);
  }

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

export async function logoutAdmin(slug: string) {
  const cookieStore = await cookies();
  const existingToken = cookieStore.get('auth_token')?.value;
  
  if (existingToken) {
    try {
      const { payload } = await jwtVerify(existingToken, JWT_SECRET);
      let authorizedSlugs = (payload.authorizedSlugs as string[]) || [];
      authorizedSlugs = authorizedSlugs.filter(s => s !== slug);
      
      const token = await new SignJWT({ authorizedSlugs })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('30d')
        .sign(JWT_SECRET);
        
      cookieStore.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30
      });
    } catch {
      cookieStore.delete('auth_token');
    }
  }
  
  return { success: true };
}

export async function checkAdmin(slug: string): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  
  if (!token) return false;
  
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const authorizedSlugs = (payload.authorizedSlugs as string[]) || [];
    return authorizedSlugs.includes(slug);
  } catch {
    return false;
  }
}
