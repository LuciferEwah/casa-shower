/**
 * Importa productos de data/gifts-import.json a Firestore
 * como regalos de un evento: events/{slug}/gifts
 *
 * Uso:
 *   node scripts/import-gifts.js [slug]
 *   node scripts/import-gifts.js luci
 *   node scripts/import-gifts.js luci --clear   (borra regalos previos del evento)
 */
require('dotenv').config({ path: '.env.local' });

const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

const slug = process.argv[2] || 'luci';
const clearFirst = process.argv.includes('--clear');

if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  console.error('Falta FIREBASE_SERVICE_ACCOUNT_KEY en .env.local');
  process.exit(1);
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
const projectId =
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || serviceAccount.project_id;

if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount),
    projectId,
  });
}

const db = getFirestore();

async function clearGifts(giftsCol) {
  const snap = await giftsCol.get();
  if (snap.empty) {
    console.log('No había regalos previos que borrar.');
    return 0;
  }

  let deleted = 0;
  const docs = snap.docs;
  for (let i = 0; i < docs.length; i += 400) {
    const batch = db.batch();
    const chunk = docs.slice(i, i + 400);
    for (const doc of chunk) {
      batch.delete(doc.ref);
    }
    await batch.commit();
    deleted += chunk.length;
  }
  console.log(`Eliminados ${deleted} regalos previos.`);
  return deleted;
}

async function main() {
  const giftsPath = path.join(__dirname, '../data/gifts-import.json');
  if (!fs.existsSync(giftsPath)) {
    console.error('No existe data/gifts-import.json. Genera el catálogo primero.');
    process.exit(1);
  }

  const gifts = JSON.parse(fs.readFileSync(giftsPath, 'utf8'));
  console.log(`Proyecto: ${projectId}`);
  console.log(`Evento slug: ${slug}`);
  console.log(`Productos a importar: ${gifts.length}`);
  console.log(`Clear first: ${clearFirst}`);

  const eventRef = db.collection('events').doc(slug);
  const eventSnap = await eventRef.get();

  if (!eventSnap.exists) {
    console.log(`El evento "${slug}" no existe. Creando doc mínimo...`);
    await eventRef.set(
      {
        babyName: slug,
        babyEmoji: '🏠',
        customColor: '#7c3aed',
        eventDate: '',
        eventPlace: '',
        welcomeMessage: 'Lista de regalos para equipar la casa',
        createdAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } else {
    const data = eventSnap.data() || {};
    console.log(`Evento encontrado:`, {
      babyName: data.babyName,
      babyEmoji: data.babyEmoji,
    });
  }

  const giftsCol = eventRef.collection('gifts');

  if (clearFirst) {
    await clearGifts(giftsCol);
  }

  let written = 0;
  for (let i = 0; i < gifts.length; i += 400) {
    const batch = db.batch();
    const chunk = gifts.slice(i, i + 400);
    for (const gift of chunk) {
      const ref = giftsCol.doc();
      batch.set(ref, {
        name: gift.name,
        image: gift.image || '',
        link: gift.link || '',
        price: Number(gift.price) || 0,
        unlimited: Boolean(gift.unlimited),
        neededQuantity: Number(gift.neededQuantity) || 1,
        reservedCount: 0,
        reservedBy: null,
        reservedByAnimal: null,
        reservedByList: [],
      });
    }
    await batch.commit();
    written += chunk.length;
    console.log(`  escritos ${written}/${gifts.length}...`);
  }

  const finalCount = (await giftsCol.get()).size;
  console.log(`\nListo. ${written} regalos inyectados en events/${slug}/gifts`);
  console.log(`Total regalos en el evento ahora: ${finalCount}`);
  console.log(`Abre la página: /s/${slug}`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Error importando:', err);
  process.exit(1);
});
