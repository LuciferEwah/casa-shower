/**
 * Busca fotos REALES del artículo (no stock genérico) vía Openverse (Flickr CC).
 * Reescribe data/productos-casa.json
 *
 *   node scripts/fetch-real-product-images.js
 *   node scripts/fetch-real-product-images.js --force   // ignora cache
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const FORCE = process.argv.includes('--force');
const UA = 'CasaShowerGiftList/1.0 (local catalog rebuild)';
const productsPath = path.join(__dirname, '../data/productos-casa.json');
const cachePath = path.join(__dirname, '../data/image-cache-openverse.json');

function getJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(
        url,
        {
          headers: {
            'User-Agent': UA,
            Accept: 'application/json',
          },
        },
        (res) => {
          let d = '';
          res.on('data', (c) => (d += c));
          res.on('end', () => {
            try {
              resolve({ status: res.statusCode, data: JSON.parse(d) });
            } catch {
              resolve({ status: res.statusCode, data: null });
            }
          });
        }
      )
      .on('error', reject);
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function cleanName(name) {
  return String(name || '')
    .replace(/\(aporte[^)]*\)/gi, '')
    .replace(/\(set\)/gi, '')
    .replace(/versión compacta|versión económica|uno económico/gi, '')
    .replace(/\b\d+\s*plazas\b/gi, '')
    .replace(/\bTerraza\s*\d\b/gi, '')
    .replace(/\bBaño\s*\d\b/gi, '')
    .replace(/\blogia\b/gi, '')
    .replace(/\b\d+\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** keyword → Openverse query (inglés, objeto real) */
const QUERY_RULES = [
  [/crema/i, 'hand cream bottle product'],
  [/jab[oó]n de cortes[ií]a|jabones de cortes[ií]a/i, 'bar of soap hotel'],
  [/jab[oó]n|dispensador de jab/i, 'soap dispenser bottle bathroom'],
  [/toalla.*cuerpo|toallas de cuerpo/i, 'bath towel folded product'],
  [/toalla.*mano/i, 'hand towel bathroom product'],
  [/toalla.*pie/i, 'bath mat towel'],
  [/toalla.*invitado|juego de toallas|toalla/i, 'bath towels set product'],
  [/alfombra.*ba[nñ]o|ba[nñ]o antideslizante/i, 'bathroom floor mat'],
  [/forro de ba|cortina de ba|cortina.*ba/i, 'shower curtain'],
  [/set de ba[nñ]o/i, 'bathroom accessories set'],
  [/escobilla/i, 'toilet brush and holder'],
  [/esquinero de ducha/i, 'shower caddy shelf'],
  [/porta cepillo/i, 'toothbrush holder ceramic'],
  [/repisa/i, 'bathroom shelf wall'],
  [/difusor/i, 'reed diffuser sticks bottle'],
  [/porta incienso/i, 'incense holder stick'],
  [/incienso/i, 'incense sticks pack'],
  [/sof[aá]/i, 'sofa furniture product'],
  [/sill[oó]n de terraza|sillones de terraza/i, 'patio outdoor armchair'],
  [/sill[oó]n/i, 'armchair furniture product'],
  [/silla ergon|sillas ergon/i, 'ergonomic office chair'],
  [/silla de terraza|sillas de terraza/i, 'outdoor patio chair'],
  [/silla/i, 'dining chair wood furniture'],
  [/taburete/i, 'rolling stool office'],
  [/televisor/i, 'flat screen television'],
  [/rack/i, 'tv stand media console'],
  [/mesa de centro/i, 'coffee table furniture'],
  [/mesa de comedor/i, 'dining table wood'],
  [/mesa de manicura/i, 'manicure table nail station'],
  [/mesa peque[nñ]a de exterior|mesa de exterior/i, 'outdoor patio table'],
  [/mesa/i, 'wooden table furniture'],
  [/puff/i, 'round pouf ottoman'],
  [/cuadro para fotos|porta.*foto/i, 'photo picture frame'],
  [/cuadro/i, 'framed wall art picture'],
  [/espejo/i, 'wall mirror frame'],
  [/l[aá]mpara colgante/i, 'pendant lamp light fixture'],
  [/l[aá]mpara de pie/i, 'floor lamp standing'],
  [/l[aá]mpara de escritorio/i, 'desk lamp'],
  [/l[aá]mpara de velador|velador/i, 'bedside table lamp'],
  [/ring light|lupa/i, 'LED ring light'],
  [/l[aá]mpara/i, 'table lamp light'],
  [/planta de exterior|plantas de exterior/i, 'outdoor potted plant'],
  [/planta/i, 'indoor potted plant houseplant'],
  [/maceta/i, 'ceramic flower pot'],
  [/florero/i, 'glass flower vase'],
  [/cortina/i, 'window curtains drapes'],
  [/aire acondicionado/i, 'air conditioner unit'],
  [/m[uú]sica|parlante/i, 'bluetooth portable speaker'],
  [/pa[nñ]o de centro|camino/i, 'table runner cloth'],
  [/mantel/i, 'tablecloth dining'],
  [/individual/i, 'placemat table setting'],
  [/porta vaso|posavaso/i, 'drink coasters set'],
  [/mini\s*bar|carrito/i, 'bar cart minibar'],
  [/refrigerador/i, 'refrigerator fridge appliance'],
  [/microondas/i, 'microwave oven kitchen'],
  [/hervidor/i, 'electric kettle'],
  [/cafetera/i, 'coffee maker machine'],
  [/tostadora/i, 'toaster kitchen appliance'],
  [/juego de platos|platos/i, 'dinner plates set'],
  [/cubiertos/i, 'cutlery set silverware'],
  [/ollas/i, 'cooking pots set stainless'],
  [/sartenes/i, 'frying pans set'],
  [/utensilios de cocina/i, 'kitchen utensils set'],
  [/basurero.*pedal|basurero con pedal/i, 'pedal trash bin'],
  [/basurero/i, 'kitchen trash can'],
  [/organizadores? de despensa/i, 'pantry storage containers'],
  [/organizadores? de cajones/i, 'drawer organizer'],
  [/organizadores? de cl[oó]set/i, 'closet storage organizer'],
  [/organizadores? de escritorio/i, 'desk organizer tray'],
  [/organizador de cubiertos/i, 'cutlery drawer tray'],
  [/secaplatos/i, 'dish drying rack'],
  [/servilletero/i, 'napkin holder'],
  [/porta nova|porta toalla de papel/i, 'paper towel holder'],
  [/exprimidor/i, 'citrus juicer electric'],
  [/licuadora/i, 'blender kitchen appliance'],
  [/mini pimer|pimer|inmersi[oó]n/i, 'immersion stick blender'],
  [/batidora/i, 'electric hand mixer'],
  [/sandwich|sanguch/i, 'sandwich press maker'],
  [/tazones?/i, 'ceramic bowls set'],
  [/tazas?/i, 'coffee mugs ceramic set'],
  [/copas de vino|copa.*vino/i, 'wine glasses set'],
  [/champagne|champang/i, 'champagne flute glasses'],
  [/chopero/i, 'beer glass pint'],
  [/vasos/i, 'drinking glasses set'],
  [/azucarero/i, 'sugar bowl'],
  [/mantequillero/i, 'butter dish'],
  [/cuchillos para asado/i, 'steak knives set'],
  [/cuchillos/i, 'kitchen knives set'],
  [/tabla de cortar.*madera/i, 'wooden cutting board'],
  [/tabla de cortar/i, 'cutting board kitchen'],
  [/rallador/i, 'cheese grater kitchen'],
  [/mortero/i, 'mortar and pestle'],
  [/colador/i, 'kitchen colander strainer'],
  [/esp[aá]tula/i, 'kitchen spatula'],
  [/cuchar[oó]n/i, 'soup ladle'],
  [/pinza de cocina|pinza/i, 'kitchen tongs'],
  [/pelador/i, 'vegetable peeler'],
  [/b[aá]scula/i, 'kitchen scale digital'],
  [/abridor de latas/i, 'can opener'],
  [/abridor de vino/i, 'wine corkscrew'],
  [/tupperware|contenedores herm/i, 'food storage containers plastic'],
  [/arrocera/i, 'rice cooker'],
  [/salero/i, 'salt shaker'],
  [/pimientero/i, 'pepper grinder mill'],
  [/ali[nñ]os/i, 'oil and vinegar bottles'],
  [/bandejas?/i, 'serving tray'],
  [/fuente para horno/i, 'baking dish ceramic oven'],
  [/fuente de ensalada/i, 'salad serving bowl'],
  [/bowl|bolbil/i, 'stainless steel mixing bowl'],
  [/tetera/i, 'tea kettle'],
  [/canasto.*fruta/i, 'fruit basket'],
  [/huevero/i, 'egg holder carton ceramic'],
  [/hielera/i, 'ice bucket'],
  [/termo/i, 'thermos flask bottle'],
  [/cooler el[eé]ctrico/i, 'electric cooler'],
  [/cucharas de palo/i, 'wooden spoons kitchen'],
  [/mezclador|batidor manual/i, 'wire whisk'],
  [/espumador/i, 'milk frother'],
  [/pa[nñ]os de cocina/i, 'kitchen towels dishcloth'],
  [/cortador de queso/i, 'cheese slicer'],
  [/cortadores?/i, 'cookie cutters set'],
  [/centr[ií]fuga/i, 'salad spinner'],
  [/molinillos?/i, 'spice grinder'],
  [/especiero/i, 'spice rack'],
  [/frascos de especias/i, 'spice jars glass'],
  [/embudo/i, 'kitchen funnel'],
  [/jarro de vidrio/i, 'glass pitcher'],
  [/cama/i, 'bed frame furniture'],
  [/colch[oó]n/i, 'mattress bed'],
  [/veladores?/i, 'nightstand bedside table'],
  [/s[aá]banas?/i, 'bed sheets folded'],
  [/plum[oó]n/i, 'duvet comforter'],
  [/cobertor/i, 'bed blanket'],
  [/fundas?/i, 'pillowcase bedding'],
  [/cojines?/i, 'throw pillows decorative'],
  [/colgadores?/i, 'clothes hangers'],
  [/escritorios?/i, 'office desk furniture'],
  [/alargadores?|zapatilla el[eé]ctrica/i, 'power strip'],
  [/estanter[ií]a/i, 'bookshelf shelf unit'],
  [/librero/i, 'bookcase furniture'],
  [/zapatero/i, 'shoe rack'],
  [/camilla de podolog/i, 'medical exam chair'],
  [/estantes? para esmaltes/i, 'nail polish rack'],
  [/esterilizador/i, 'sterilizer box UV'],
  [/parrilla a gas/i, 'gas barbecue grill'],
  [/luces? LED/i, 'LED string fairy lights'],
  [/ceniceros?/i, 'ashtray'],
  [/mopa/i, 'floor mop'],
  [/escoba/i, 'broom cleaning'],
  [/pinzas para ropa/i, 'clothes pegs clips'],
  [/soporte para pala|pala(?!.*ropa)/i, 'garden shovel'],
  [/soporte para mopa|soporte para escoba/i, 'broom holder wall'],
  [/lavadora/i, 'washing machine laundry'],
  [/secadora/i, 'clothes dryer machine'],
  [/mueble a[eé]reo/i, 'wall cabinet cupboard'],
  [/tendedero/i, 'clothes drying rack'],
  [/cesto para ropa/i, 'laundry basket'],
  [/aspiradora/i, 'vacuum cleaner'],
  [/alfombra/i, 'area rug carpet'],
];

function queryFor(product) {
  const name = product.name || '';
  for (const [re, q] of QUERY_RULES) {
    if (re.test(name)) return q;
  }
  return `${cleanName(name)} product photo`;
}

/** palabras del query para score de relevancia en el título */
function scoreResult(result, query) {
  const title = `${result.title || ''} ${result.tags?.map((t) => t.name).join(' ') || ''}`.toLowerCase();
  const words = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  let score = 0;
  for (const w of words) {
    if (title.includes(w)) score += 2;
  }
  // prefer product-like
  if (/product|bottle|set|appliance|furniture|kitchen|bathroom/.test(title)) score += 1;
  // penalize junk
  if (/meme|hillary|transformer|hose|cat|dog|person|woman|man sitting/.test(title)) score -= 5;
  // prefer decent size
  const w = result.width || 0;
  const h = result.height || 0;
  if (w >= 400 && h >= 400) score += 2;
  if (w < 200 || h < 200) score -= 3;
  return score;
}

async function searchOpenverse(query, usedUrls, preferIndex = 0) {
  const url =
    'https://api.openverse.org/v1/images/?q=' +
    encodeURIComponent(query) +
    '&page_size=12&license=cc0,pdm,by,by-sa&mature=false';

  const { status, data } = await getJson(url);
  if (status === 429) {
    await sleep(3000);
    return searchOpenverse(query, usedUrls, preferIndex);
  }
  if (status !== 200 || !data?.results?.length) return null;

  const ranked = data.results
    .filter((r) => r.url && /^https?:\/\//.test(r.url))
    .map((r) => ({ r, score: scoreResult(r, query) }))
    .filter((x) => x.score >= 0)
    .sort((a, b) => b.score - a.score);

  if (!ranked.length) {
    // take best of raw if all scored low
    const any = data.results.filter((r) => r.url);
    if (!any.length) return null;
    const pick = any[preferIndex % any.length];
    return { url: pick.url, title: pick.title, query, score: 0 };
  }

  // prefer unused among top scorers
  const unused = ranked.filter((x) => !usedUrls.has(x.r.url));
  const pool = unused.length ? unused : ranked;
  const pick = pool[Math.min(preferIndex, pool.length - 1)].r;
  return {
    url: pick.url,
    title: pick.title,
    query,
    score: scoreResult(pick, query),
  };
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

  const usedUrls = new Set();
  const queryCount = {};
  let ok = 0;
  let fail = 0;
  const failures = [];

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const q = queryFor(p);
    const productKey = `${p.room}::${p.name}`;
    queryCount[q] = (queryCount[q] || 0) + 1;
    const preferIndex = (queryCount[q] - 1) % 8;

    process.stdout.write(`[${i + 1}/${products.length}] ${p.name.slice(0, 42)}... `);

    let result = null;
    if (!FORCE && cache[productKey]?.url) {
      result = cache[productKey];
      console.log('CACHE', (result.title || '').slice(0, 40));
    } else {
      result = await searchOpenverse(q, usedUrls, preferIndex);
      await sleep(350);
      if (!result) {
        const broad = cleanName(p.name).split(/\s+/).slice(0, 3).join(' ');
        result = await searchOpenverse(broad, usedUrls, preferIndex);
        await sleep(350);
      }
      if (result) cache[productKey] = result;
    }

    if (result?.url) {
      p.image = result.url;
      usedUrls.add(result.url);
      const mlQ = cleanName(p.name)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, ' ')
        .trim()
        .replace(/\s+/g, '-');
      p.link = `https://listado.mercadolibre.cl/${mlQ}`;
      ok++;
      if (!String(result.title || '').startsWith('CACHE')) {
        console.log('OK', (result.title || '').slice(0, 45), `sc=${result.score ?? '?'}`);
      }
    } else {
      fail++;
      failures.push({ name: p.name, q });
      console.log('FAIL', q);
    }

    if (i % 15 === 0) {
      fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2));
      fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));
    }
  }

  fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2));
  fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));

  console.log('\n=== RESULTADO ===');
  console.log('OK:', ok, 'FAIL:', fail);
  if (failures.length) {
    failures.slice(0, 30).forEach((f) => console.log(' -', f.name, '→', f.q));
    if (failures.length > 30) console.log(' ...', failures.length - 30, 'más');
  }

  if (fail > products.length * 0.1) {
    console.error('Demasiados fallos; revisa antes de importar.');
    process.exit(1);
  }
  console.log('Listo para: node scripts/export-productos.js && node scripts/import-gifts.js casa-luci --clear');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
