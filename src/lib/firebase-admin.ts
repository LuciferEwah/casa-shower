import { initializeApp, getApps, cert, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// In a real app, use environment variables:
// const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string);

// If we had a service account key, we would use credential: cert(serviceAccount)
// For now, since we only know it's "beibi-shower", we'll initialize without it 
// and rely on default credentials or just mock it if we don't have the key.
// But wait, firebase-admin requires credentials to write to Firestore if rules are locked.
// The user prompt says "Create src/lib/firebase-admin.ts using environment variables."

export const customInitApp = () => {
  if (getApps().length <= 0) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      initializeApp({
        credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "beibi-shower",
      });
    } else {
      // Fallback for local dev without key
      initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "beibi-shower",
      });
    }
  }
  return getApp();
};

export const adminDb = getFirestore(customInitApp());
