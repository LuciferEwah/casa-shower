/**
 * Restaura los 8 regalos originales de casa-luci (borrados por --clear).
 * NO borra el catálogo actual: solo agrega.
 */
require('dotenv').config({ path: '.env.local' });
const https = require('https');
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const originals = [
  { id: '9TU1AknHVGOsY4JxfpTX', name: 'SET De Cuchillos', price: 17000, query: 'set cuchillos cocina' },
  {
    id: 'LloChDVbJ8NvDNkDwpXj',
    name: 'Tea Bar Machine Táctil Dispensador Agua Fría Caliente Premium',
    price: 140000,
    query: 'dispensador agua fria caliente tea bar',
  },
  {
    id: 'T7G9pz5Me1aHSDkmnS7R',
    name: 'Juego de Vajilla 30 Piezas Lorenza',
    price: 19990,
    query: 'juego vajilla 30 piezas',
  },
  { id: 'hBNXNYr7dOi9c15whMl9', name: 'Bowl Bella 3,1 Litros', price: 3790, query: 'bowl 3 litros cocina' },
  {
    id: 'iz7ZdV6bDw1bvnOHy9TO',
    name: 'Xiaomi Secador De Pelo Compacto H101 Doble Protección Color Blanco',
    price: 17000,
    query: 'xiaomi secador pelo H101',
  },
  {
    id: 'qVnn7ekkEQWEtXZptGG8',
    name: 'Vaso 11 oz Empavonado color',
    price: 1600,
    query: 'vaso empavonado 11 oz',
  },
  {
    id: 'sp90vTRHQOT3lGHoAbKM',
    name: 'Batería de Cocina X piezas',
    price: 30000,
    query: 'bateria de cocina piezas',
  },
  {
    id: 'whTj0CcKRwTi2tVaJTHh',
    name: 'Pack 6 Tazas Vidrio Empavonado Sublimación 11 Oz Colores',
    price: 13990,
    query: 'pack 6 tazas vidrio empavonado',
  },
];

function get(url) {
  return new Promise((resolve, reject) => {
    https
      .get(
        url,
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept-Language': 'es-CL',
          },
        },
        (res) => {
          let d = '';
          res.on('data', (c) => (d += c));
          res.on('end', () => resolve(d));
        }
      )
      .on('error', reject);
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function falabellaLookup(query) {
  try {
    const body = await get(
      'https://www.falabella.com/falabella-cl/search?Ntt=' + encodeURIComponent(query)
    );
    const next = body.match(
      /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/
    );
    if (!next) return { image: '', link: '' };
    const results = JSON.parse(next[1])?.props?.pageProps?.results || [];
    const item = results.find((r) => r.mediaUrls?.[0] && r.url) || results[0];
    if (!item) return { image: '', link: '' };
    return {
      image: item.mediaUrls?.[0] || '',
      link: item.url || '',
      productName: item.displayName || '',
    };
  } catch {
    return { image: '', link: '' };
  }
}

async function main() {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    console.error('Falta FIREBASE_SERVICE_ACCOUNT_KEY');
    process.exit(1);
  }
  const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  if (!getApps().length) {
    initializeApp({
      credential: cert(sa),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || sa.project_id,
    });
  }
  const db = getFirestore();
  const giftsCol = db.collection('events').doc('casa-luci').collection('gifts');

  // Avoid duplicates by name
  const existing = await giftsCol.get();
  const existingNames = new Set(
    existing.docs.map((d) => (d.data().name || '').toLowerCase())
  );

  let added = 0;
  for (const orig of originals) {
    const already = [...existingNames].some(
      (n) => n.includes(orig.name.toLowerCase().slice(0, 20)) || n === orig.name.toLowerCase()
    );
    if (already) {
      console.log('SKIP (ya existe):', orig.name);
      continue;
    }

    process.stdout.write(`Restaurando: ${orig.name.slice(0, 50)}... `);
    const found = await falabellaLookup(orig.query);
    await sleep(500);

    const data = {
      name: orig.name,
      image: found.image || '',
      link: found.link || '',
      price: Number(orig.price),
      unlimited: false,
      neededQuantity: 1,
      reservedCount: 0,
      reservedBy: null,
      reservedByAnimal: null,
      reservedByList: [],
      restoredOriginal: true,
      originalId: orig.id,
    };

    // Prefer original doc ids if free
    const ref = giftsCol.doc(orig.id);
    const snap = await ref.get();
    if (snap.exists) {
      await giftsCol.add(data);
    } else {
      await ref.set(data);
    }
    existingNames.add(orig.name.toLowerCase());
    added++;
    console.log('OK', found.productName?.slice(0, 40) || '(sin imagen falabella)');
  }

  const total = (await giftsCol.get()).size;
  console.log(`\nRestaurados: ${added}`);
  console.log(`Total regalos en casa-luci: ${total}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
