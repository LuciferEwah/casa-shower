const https = require('https');
const fs = require('fs');

const products = JSON.parse(fs.readFileSync('data/productos-casa.json', 'utf8'));
const cache = JSON.parse(fs.readFileSync('data/falabella-cache.json', 'utf8'));

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

function parsePrice(item) {
  const arr = item.prices?.[0]?.price;
  if (!arr) return null;
  const n = Number(String(arr[0]).replace(/\./g, ''));
  return n > 100 ? n : null;
}

function clamp(p) {
  let n = Number(p) || 12990;
  if (n < 10000) n = 10990;
  if (n > 20000) n = 19990;
  n = Math.floor(n / 1000) * 1000 + 990;
  if (n < 10000) n = 10990;
  if (n > 19990) n = 19990;
  return n;
}

async function search(q) {
  const body = await get(
    'https://www.falabella.com/falabella-cl/search?Ntt=' + encodeURIComponent(q)
  );
  const next = body.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/
  );
  if (!next) return [];
  try {
    return JSON.parse(next[1])?.props?.pageProps?.results || [];
  } catch {
    return [];
  }
}

const fixes = [
  ['Televisor (aporte)', 'Smart TV LED 32'],
  ['Colador mediano', 'colador cocina acero'],
  ['Fuente de ensalada grande', 'fuente ensalada vidrio'],
  ['Huevero', 'porta huevos refrigerador'],
  ['Cama 2 plazas (aporte)', 'base cama 2 plazas'],
  ['Estantes para esmaltes', 'organizador esmaltes uñas'],
  ['Soporte para mopa', 'organizador escobas pared'],
  ['Set de baño logia', 'set accesorios baño'],
  ['Set de baño Baño 1', 'set accesorios baño jabonera'],
  ['Set de baño Baño 2', 'kit baño dispensador jabon'],
];

(async () => {
  for (const [name, q] of fixes) {
    const p = products.find((x) => x.name === name);
    if (!p) {
      console.log('missing', name);
      continue;
    }
    const results = await search(q);
    await sleep(700);

    let best = null;
    for (const item of results) {
      const img = item.mediaUrls?.[0];
      const url = item.url;
      if (!img || !url) continue;
      const price = parsePrice(item);
      const dn = (item.displayName || '').toLowerCase();
      if (/televisor/i.test(name) && !/tv|tele|led|smart/i.test(dn)) continue;
      best = { item, img, url, price };
      if (price >= 10000 && price <= 20000) break;
      break;
    }
    if (!best && results[0]?.mediaUrls?.[0]) {
      best = {
        item: results[0],
        img: results[0].mediaUrls[0],
        url: results[0].url,
        price: parsePrice(results[0]),
      };
    }

    if (best) {
      p.image = best.img;
      p.link = best.url;
      p.price = clamp(best.price);
      p.productName = best.item.displayName;
      p.brand = best.item.brand || '';
      p.matchedFrom = q;
      p.realPrice = best.price;
      p.displayName = name + ' · ' + best.item.displayName;
      const key = p.room + '::' + p.name;
      cache[key] = {
        image: p.image,
        link: p.link,
        price: p.price,
        productName: p.productName,
        brand: p.brand,
        matchedFrom: q,
        displayName: p.displayName,
        realPrice: p.realPrice,
      };
      console.log('OK', name, '->', best.item.displayName.slice(0, 55), p.price);
    } else {
      console.log('FAIL', name, 'results', results.length);
    }
  }

  fs.writeFileSync('data/productos-casa.json', JSON.stringify(products, null, 2));
  fs.writeFileSync('data/falabella-cache.json', JSON.stringify(cache, null, 2));

  const faba = products.filter((p) =>
    /media\.falabella|falabellaCL|sodimacCL/i.test(p.image || '')
  ).length;
  console.log('falabella images', faba, '/', products.length);
  console.log(
    'sin productName',
    products.filter((p) => !p.productName).map((p) => p.name)
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
