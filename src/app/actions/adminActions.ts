'use server';

import { cookies } from 'next/headers';

const ADMIN_PIN = process.env.ADMIN_PIN || '1234';

export async function loginAdmin(pin: string) {
  if (pin === ADMIN_PIN) {
    const cookieStore = await cookies();
    cookieStore.set('admin_token', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 // 1 day
    });
    return { success: true };
  }
  return { success: false, error: 'Invalid PIN' };
}

export async function logoutAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_token');
  return { success: true };
}

export async function checkAdmin() {
  const cookieStore = await cookies();
  return cookieStore.get('admin_token')?.value === 'true';
}
