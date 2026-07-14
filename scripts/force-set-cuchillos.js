require('dotenv').config({ path: '.env.local' });
const https = require('https');
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

function get(url) {
  return new Promise((resolve, reject) => {
    https
      .get(
        url,
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
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

(async () => {
  const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  if (!getApps().length) {
    initializeApp({
      credential: cert(sa),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || sa.project_id,
    });
  }
  const db = getFirestore();
  const col = db.collection('events').doc('casa-luci').collection('gifts');
  const snap = await col.get();

  console.log('total', snap.size);
  const originals = [
    'SET De Cuchillos',
    'Tea Bar Machine',
    'Juego de Vajilla 30 Piezas Lorenza',
    'Bowl Bella',
    'Xiaomi Secador',
    'Vaso 11 oz Empavonado color',
    'Batería de Cocina',
    'Pack 6 Tazas Vidrio Empavonado',
  ];
  for (const n of originals) {
    const hits = snap.docs.filter((d) =>
      (d.data().name || '').toLowerCase().includes(n.toLowerCase())
    );
    console.log(
      n,
      '->',
      hits.map((h) => `${h.id}: ${h.data().name} $${h.data().price}`).join(' | ') ||
        'NO'
    );
  }

  const exact = snap.docs.find((d) => d.data().name === 'SET De Cuchillos');
  if (!exact) {
    const body = await get(
      'https://www.falabella.com/falabella-cl/search?Ntt=' +
        encodeURIComponent('set cuchillos cocina')
    );
    const next = body.match(
      /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/
    );
    let image = '';
    let link = '';
    if (next) {
      const results = JSON.parse(next[1])?.props?.pageProps?.results || [];
      const it = results[0];
      if (it) {
        image = it.mediaUrls?.[0] || '';
        link = it.url || '';
      }
    }
    await col.doc('9TU1AknHVGOsY4JxfpTX').set({
      name: 'SET De Cuchillos',
      image,
      link,
      price: 17000,
      unlimited: false,
      neededQuantity: 1,
      reservedCount: 0,
      reservedBy: null,
      reservedByAnimal: null,
      reservedByList: [],
      restoredOriginal: true,
      originalId: '9TU1AknHVGOsY4JxfpTX',
    });
    console.log('FORCED SET De Cuchillos');
  } else {
    console.log('SET exact exists', exact.id);
  }

  console.log('final', (await col.get()).size);
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
