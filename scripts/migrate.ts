import { adminDb } from '../src/lib/firebase-admin';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function migrate() {
  const slug = 'luci';
  console.log(`Starting migration to event slug: ${slug}`);

  // 1. Get old settings
  const oldSettingsSnap = await adminDb.collection('config').doc('settings').get();
  const oldSettings = oldSettingsSnap.exists ? oldSettingsSnap.data() : { babyName: 'Luci', babyEmoji: '🏠' };

  // 2. Hash default PIN 
  const pin = process.env.ADMIN_PIN || '1234';
  const adminPinHash = await bcrypt.hash(pin, 10);

  // 3. Create event doc
  await adminDb.collection('events').doc(slug).set({
    ...oldSettings,
    adminPinHash,
    createdAt: new Date().toISOString()
  });
  console.log('Event doc created');

  // 4. Migrate gifts
  const giftsSnap = await adminDb.collection('gifts').get();
  let count = 0;
  const batch = adminDb.batch();
  for (const doc of giftsSnap.docs) {
    const data = doc.data();
    const newRef = adminDb.collection('events').doc(slug).collection('gifts').doc(doc.id);
    batch.set(newRef, data);
    count++;
  }
  if (count > 0) {
    await batch.commit();
  }
  console.log(`Migrated ${count} gifts`);
  console.log('Migration complete!');
}

migrate().catch(console.error);
