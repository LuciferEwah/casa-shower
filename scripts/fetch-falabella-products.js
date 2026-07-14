/**
 * Busca en Falabella Chile el artículo ESPECÍFICO de cada regalo.
 * Actualiza image, link, price y nombre con el producto real encontrado.
 *
 *   node scripts/fetch-falabella-products.js
 *   node scripts/fetch-falabella-products.js --force
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const FORCE = process.argv.includes('--force');
const productsPath = path.join(__dirname, '../data/productos-casa.json');
const cachePath = path.join(__dirname, '../data/falabella-cache.json');

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function get(url) {
  return new Promise((resolve, reject) => {
    https
      .get(
        url,
        {
          headers: {
            'User-Agent': UA,
            'Accept-Language': 'es-CL,es;q=0.9',
            Accept: 'text/html,application/xhtml+xml',
            'Cache-Control': 'no-cache',
          },
        },
        (res) => {
          // follow one redirect
          if (
            res.statusCode >= 300 &&
            res.statusCode < 400 &&
            res.headers.location
          ) {
            const loc = res.headers.location.startsWith('http')
              ? res.headers.location
              : `https://www.falabella.com${res.headers.location}`;
            res.resume();
            return get(loc).then(resolve, reject);
          }
          let d = '';
          res.on('data', (c) => (d += c));
          res.on('end', () =>
            resolve({ status: res.statusCode, body: d })
          );
        }
      )
      .on('error', reject);
  });
}

function stripAccents(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function tokens(s) {
  return stripAccents(s)
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(
      (t) =>
        t.length > 2 &&
        ![
          'para',
          'con',
          'set',
          'juego',
          'pack',
          'aporte',
          'version',
          'compacta',
          'economico',
          'grande',
          'mediano',
          'mediana',
          'pequeno',
          'pequena',
          'living',
          'comedor',
          'cocina',
          'bano',
          'logia',
          'terraza',
          'dormitorio',
          'personas',
          'plazas',
          'piezas',
        ].includes(t)
    );
}

/** Query de búsqueda específica por producto */
function searchQuery(product) {
  let name = product.name || '';
  name = name
    .replace(/\(aporte[^)]*\)/gi, '')
    .replace(/\(set\)/gi, '')
    .replace(/versión compacta|versión económica|uno económico/gi, '')
    .replace(/\bTerraza\s*\d\b/gi, '')
    .replace(/\bBaño\s*\d\b/gi, '')
    .replace(/\blogia\b/gi, '')
    .replace(/\bdormitorio\s*(grande|mediano|pequeño)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  // quitar cantidades tipo "10 Tupperware" -> "Tupperware"
  name = name.replace(/^\d+\s+/, '');
  // quitar (6-8 personas) etc
  name = name.replace(/\(?\s*\d+\s*-\s*\d+\s*personas?\)?/gi, '');
  name = name.replace(/\s+/g, ' ').trim();

  // preferencias de color cuando aplica
  if (/toalla|cortina|alfombra|cojin|saban|cobertor|plumon|funda|mantel|individual|paño/i.test(name)) {
    if (!/azul|morado|lila|lavanda/i.test(name)) {
      name = `${name} azul`;
    }
  }

  return name;
}

function parsePrice(item) {
  const prices = item.prices || [];
  for (const p of prices) {
    const arr = p.price;
    if (Array.isArray(arr) && arr[0] != null) {
      const raw = String(arr[0]).replace(/\./g, '').replace(/,/g, '');
      const n = Number(raw);
      if (Number.isFinite(n) && n > 100) return n;
    }
  }
  return null;
}

function scoreMatch(productName, item) {
  const want = tokens(productName);
  const hay = tokens(`${item.displayName || ''} ${item.brand || ''}`);
  if (!want.length || !hay.length) return 0;

  let hits = 0;
  for (const t of want) {
    if (hay.some((h) => h.includes(t) || t.includes(h))) hits += 1;
  }
  let score = hits / want.length;

  // bonus if first significant token matches
  if (want[0] && hay.some((h) => h.includes(want[0]))) score += 0.25;

  // slight penalty if sponsored noise
  if (item.isSponsored) score -= 0.05;

  return score;
}

function pickBest(product, results) {
  if (!results?.length) return null;

  const queryName = searchQuery(product);
  const scored = results
    .map((item) => {
      const price = parsePrice(item);
      const nameScore = scoreMatch(queryName, item);
      const img = item.mediaUrls?.[0];
      const url = item.url;
      let score = nameScore * 10;

      if (!img || !url) score -= 100;
      if (price != null && price >= 10000 && price <= 20000) score += 3;
      else if (price != null && price >= 5000 && price <= 35000) score += 1;
      else if (price != null && price > 50000) score -= 2;

      return { item, price, nameScore, score, img, url };
    })
    .filter((x) => x.img && x.url && x.nameScore >= 0.25)
    .sort((a, b) => b.score - a.score);

  // prefer in-range price among good name matches
  const inRange = scored.filter(
    (x) => x.price != null && x.price >= 10000 && x.price <= 20000 && x.nameScore >= 0.35
  );
  if (inRange.length) return inRange[0];

  const goodName = scored.filter((x) => x.nameScore >= 0.4);
  if (goodName.length) return goodName[0];

  return scored[0] || null;
}

function clampPrice(p, fallback) {
  let n = Number(p);
  if (!Number.isFinite(n) || n <= 0) n = fallback || 12990;
  if (n < 10000) n = 10990;
  if (n > 20000) {
    // si el producto real es más caro, dejarlo en tope del rango de regalo
    n = 19990;
  }
  // estilo x990
  n = Math.floor(n / 1000) * 1000 + 990;
  if (n < 10000) n = 10990;
  if (n > 19990) n = 19990;
  return n;
}

async function searchFalabella(query) {
  const url = `https://www.falabella.com/falabella-cl/search?Ntt=${encodeURIComponent(query)}`;
  const { status, body } = await get(url);
  if (status !== 200) return { status, results: [] };

  const next = body.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/
  );
  if (!next) return { status, results: [] };

  try {
    const j = JSON.parse(next[1]);
    const results = j?.props?.pageProps?.results || [];
    return { status, results };
  } catch {
    return { status, results: [] };
  }
}

async function main() {
  const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
  let cache = {};
  if (!FORCE && fs.existsSync(cachePath)) {
    try {
      cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    } catch {
      cache = {};
    }
  }

  let ok = 0;
  let fail = 0;
  const failures = [];

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const key = `${p.room}::${p.name}`;
    const q = searchQuery(p);

    process.stdout.write(`[${i + 1}/${products.length}] ${p.name.slice(0, 40)}... `);

    if (!FORCE && cache[key]?.image && cache[key]?.link) {
      Object.assign(p, {
        image: cache[key].image,
        link: cache[key].link,
        price: cache[key].price,
        productName: cache[key].productName,
        brand: cache[key].brand,
        matchedFrom: cache[key].matchedFrom,
      });
      // display name with real product
      p.displayName = cache[key].displayName || p.name;
      ok++;
      console.log('CACHE', (cache[key].productName || '').slice(0, 40));
      continue;
    }

    let pick = null;
    let usedQuery = q;

    // try primary query
    let { results } = await searchFalabella(q);
    await sleep(600);
    pick = pickBest(p, results);

    // retry with shorter query (first 3-4 words)
    if (!pick || pick.nameScore < 0.35) {
      const short = q.split(/\s+/).slice(0, 4).join(' ');
      if (short !== q) {
        usedQuery = short;
        const r2 = await searchFalabella(short);
        await sleep(600);
        const pick2 = pickBest(p, r2.results);
        if (pick2 && (!pick || pick2.score > pick.score)) pick = pick2;
      }
    }

    if (pick) {
      const productName = pick.item.displayName;
      const brand = pick.item.brand || '';
      const realPrice = pick.price;
      const giftPrice = clampPrice(realPrice, p.price);

      p.image = pick.img;
      p.link = pick.url;
      p.price = giftPrice;
      p.productName = productName;
      p.brand = brand;
      p.matchedFrom = usedQuery;
      p.realPrice = realPrice;
      // Nombre visible: artículo pedido + producto real
      p.displayName = `${searchQuery(p)} · ${productName}`.slice(0, 120);

      cache[key] = {
        image: p.image,
        link: p.link,
        price: p.price,
        productName,
        brand,
        matchedFrom: usedQuery,
        displayName: p.displayName,
        realPrice,
      };

      ok++;
      console.log(
        'OK',
        productName.slice(0, 42),
        `| $${giftPrice}`,
        realPrice ? `(real ${realPrice})` : '',
        `sc=${pick.nameScore.toFixed(2)}`
      );
    } else {
      fail++;
      failures.push({ name: p.name, q });
      console.log('FAIL', q);
    }

    if (i % 10 === 0) {
      fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2));
      fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));
    }
  }

  // Aplicar displayName como name para la app (name es lo que se ve)
  for (const p of products) {
    if (p.displayName) {
      // Mantener habitación en el nombre del gift
      const room = p.room ? ` · ${p.room}` : '';
      // gifts-import añade room otra vez — aquí guardamos name sin room duplicado
      p.nameForGift = p.displayName;
    }
  }

  fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2));
  fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));

  console.log('\n=== RESULTADO ===');
  console.log('OK:', ok, 'FAIL:', fail);
  if (failures.length) {
    console.log('Sin match específico:');
    failures.forEach((f) => console.log(' -', f.name, '→', f.q));
  }

  const falabellaImgs = products.filter((p) =>
    /media\.falabella\.com|falabella/i.test(p.image || '')
  ).length;
  console.log('Imágenes Falabella:', falabellaImgs, '/', products.length);

  if (fail > products.length * 0.25) {
    console.error('Demasiados fallos.');
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
