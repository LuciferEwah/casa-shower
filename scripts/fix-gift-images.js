/**
 * Asigna imágenes verificadas por keyword y normaliza precios a $10.000–$19.990.
 * Reescribe data/productos-casa.json
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const U = (id) =>
  `https://images.unsplash.com/photo-${id}?w=600&h=600&fit=crop&auto=format`;

// IDs verificados (HTTP 200).
const IMG = {
  sofa: U('1555041469-a586c61ea9bc'),
  chair: U('1503602642458-232111445657'),
  officeChair: U('1580480055273-228ff5388ef8'),
  tv: U('1593359677879-a4bb92f829d1'),
  coffeeTable: U('1611269154421-4e27233ac5c7'),
  living: U('1493663284031-b7e3aefcae8e'),
  interior: U('1600585154340-be6161a56a0c'),
  lamp: U('1507473885765-e6ed057f782c'),
  pendant: U('1524484485831-a92ffc0de03f'),
  plant: U('1485955900006-10f4d324d411'),
  garden: U('1416879595882-3373a0480b5b'),
  curtains: U('1513694203232-719a280e022f'),
  speaker: U('1545454675-3531b543be5d'),
  vase: U('1578500494198-246f612d3b3d'),
  dining: U('1617806118233-18e1de247200'),
  tableSetting: U('1414235077428-338989a2e8c0'),
  mirror: U('1618220179428-22790b461013'),
  fridge: U('1571175443880-49e1d25b2bc5'),
  microwave: U('1585659722983-3a675dabf23d'),
  coffee: U('1517668808822-9ebb02f2a0e6'),
  toast: U('1509440159596-0249088772ff'),
  kitchen: U('1556911220-bff31c812dba'),
  kitchen2: U('1556912173-46c336c7fd55'),
  kitchenTools: U('1610701596007-11502861dcfa'),
  utensils: U('1556909114-f6e7ad7d3136'),
  cooking: U('1556910103-1c02745aae4d'),
  cutlery: U('1590794056226-79ef3a8147e1'),
  knives: U('1593618998160-e34014e67546'),
  cuttingBoard: U('1594041680534-e8c8cdebd659'),
  containers: U('1584568694244-14fbdf83bd30'),
  blender: U('1570222094114-d054a817e56b'),
  mixer: U('1578022761797-b8636ac1773c'),
  cups: U('1514228742587-6b1558fcca3d'),
  wine: U('1510812431401-41d2bd2722f3'),
  champagne: U('1547595628-c61a29f496f0'),
  beer: U('1608270586620-248524c67de9'),
  drinks: U('1514362545857-3bc16c4c7d1b'),
  spices: U('1596040033229-a9821ebd058d'),
  salad: U('1512621776951-a57141f2eefd'),
  foodPlate: U('1540189549336-e6e99c3679fe'),
  foodPrep: U('1606925797300-0b35e9d1794e'),
  dishes: U('1565183997392-2f6f122e5912'),
  kitchenware: U('1600566752355-35792bedcfea'),
  sandwich: U('1528735602780-2552fd46c7af'),
  juice: U('1621506289937-a8e4df240d0b'),
  butter: U('1589985270826-4b7bb135bc9d'),
  cheese: U('1452195100486-9cc805987862'),
  rice: U('1586201375761-83865001e31c'),
  fruit: U('1610832958506-aa56368176cf'),
  thermos: U('1602143407151-7111542de6e8'),
  bed: U('1505693416388-ac5ce068fe85'),
  bedding: U('1631049307264-da0ec9d70304'),
  pillows: U('1584100936595-c0654b55a2e2'),
  desk: U('1518455027359-f3f8164ba6bd'),
  shoes: U('1543163521-1bf539c55dd2'),
  manicure: U('1604654894610-df63bc536371'),
  ringLight: U('1611162617474-5b21e879e113'),
  clinic: U('1519494026892-80bbd2d6fd0d'),
  outdoor: U('1600210492486-724fe5c67fb0'),
  lights: U('1513506003901-1e6a229e2d15'),
  cleaning: U('1581578731548-c64695cc6952'),
  laundry: U('1582735689369-4fe89db7114c'),
  washer: U('1626806787461-102c1bfaaea1'),
  vacuum: U('1558317374-067fb5f30001'),
  towels: U('1631889993959-41b4e9c6e3c5'),
  bathroom: U('1584622650111-993a426fbf0a'),
  skincare: U('1600857062241-98e5dba7f214'),
  aroma: U('1608571423902-eed4a5ad8108'),
  grill: U('1555939594-58d7cb561ad1'),
  tablecloth: U('1615874959474-d609969a20ed'),
  dining2: U('1467003909585-2f8a72700288'),
  food: U('1504674900247-0877df9cc836'),
};

// Más específico primero.
const RULES = [
  [/crema/i, 'skincare'],
  [/jab[oó]n/i, 'skincare'],
  [/toalla/i, 'towels'],
  [/alfombra.*ba[nñ]o|ba[nñ]o antideslizante/i, 'bathroom'],
  [/forro de ba|cortina.*ba|set de ba/i, 'bathroom'],
  [/escobilla|esquinero|dispensador.*jab|porta cepillo|repisa/i, 'bathroom'],
  [/difusor|incienso|varitas|aroma|porta incienso/i, 'aroma'],
  [/sof[aá]/i, 'sofa'],
  [/sill[oó]n/i, 'sofa'],
  [/silla.*ergon|taburete/i, 'officeChair'],
  [/silla/i, 'chair'],
  [/televisor|\btv\b/i, 'tv'],
  [/rack|mueble a[eé]reo|estanter|librero/i, 'interior'],
  [/mesa de centro/i, 'coffeeTable'],
  [/mesa de comedor|mesa de manicura|mesa peque/i, 'dining'],
  [/mesa/i, 'dining'],
  [/puff/i, 'living'],
  [/cuadro|porta.*foto|retrato/i, 'living'],
  [/espejo/i, 'mirror'],
  [/l[aá]mpara colgante/i, 'pendant'],
  [/l[aá]mpara|velador|ring light|lupa/i, 'lamp'],
  [/planta|maceta|florero/i, 'plant'],
  [/cortina/i, 'curtains'],
  [/aire acondicionado/i, 'interior'],
  [/m[uú]sica|parlante/i, 'speaker'],
  [/pa[nñ]o de centro|mantel|individual|camino/i, 'tablecloth'],
  [/mini\s*bar|carrito/i, 'drinks'],
  [/refrigerador|refri/i, 'fridge'],
  [/microondas/i, 'microwave'],
  [/hervidor|tetera/i, 'coffee'],
  [/cafetera|espumador/i, 'coffee'],
  [/tostadora/i, 'toast'],
  [/plato|vajilla|taz[oó]n|fuente de ensalada/i, 'foodPlate'],
  [/cubierto|organizador de cubierto/i, 'cutlery'],
  [/cuchillo/i, 'knives'],
  [/olla|sart[eé]n|bater[ií]a|fuente para horno/i, 'cooking'],
  [/utensilio|esp[aá]tula|cuchar[oó]n|pinza de cocina|pelador|cuchara de palo|mezclador|batidor/i, 'utensils'],
  [/basurero/i, 'cleaning'],
  [/organizador|despensa|contenedor|tupperware|herm[eé]tico/i, 'containers'],
  [/secaplatos|colador|rallador|embudo|centrifuga|mortero/i, 'kitchenTools'],
  [/servilletero|porta nova|porta toalla/i, 'tableSetting'],
  [/exprimidor|jugo/i, 'juice'],
  [/licuadora/i, 'blender'],
  [/batidora|mini pimer|pimer/i, 'mixer'],
  [/sandwich|sanguch/i, 'sandwich'],
  [/tazas?\b/i, 'cups'],
  [/copa.*vino|vino/i, 'wine'],
  [/champagn|champagne|champang/i, 'champagne'],
  [/chopero|cerveza/i, 'beer'],
  [/vaso/i, 'drinks'],
  [/azucarero|pimientero|salero|ali[nñ]o|especiero|frasco.*especia|molinillo/i, 'spices'],
  [/mantequill/i, 'butter'],
  [/queso/i, 'cheese'],
  [/tabla de cortar/i, 'cuttingBoard'],
  [/bandeja|bowl|bolbil/i, 'dishes'],
  [/arrocera|arroz/i, 'rice'],
  [/canasto.*fruta|fruta/i, 'fruit'],
  [/huevero/i, 'food'],
  [/hielera|cooler|termo/i, 'thermos'],
  [/pa[nñ]o.*cocina|cortador/i, 'kitchen'],
  [/jarro/i, 'drinks'],
  [/cama|colch[oó]n/i, 'bed'],
  [/s[aá]bana|plum[oó]n|cobertor|funda/i, 'bedding'],
  [/coj[ií]n/i, 'pillows'],
  [/cl[oó]set|colgador|zapatero/i, 'shoes'],
  [/escritorio|alargador/i, 'desk'],
  [/camilla|podolog|esterilizador/i, 'clinic'],
  [/manicura|esmalte/i, 'manicure'],
  [/parrilla|asado/i, 'grill'],
  [/terraza|exterior|cenicero|pala|pinzas para ropa/i, 'outdoor'],
  [/led|luces/i, 'lights'],
  [/lavadora|secadora|tendedero|cesto.*ropa|ropa sucia/i, 'laundry'],
  [/mopa|escoba|soporte para|aspiradora/i, 'cleaning'],
  [/alfombra/i, 'living'],
  [/ba[nñ]o/i, 'bathroom'],
  [/cocina/i, 'kitchen'],
];

const ROOM_FALLBACK = {
  Living: 'living',
  Comedor: 'dining2',
  Cocina: 'kitchen',
  'Dormitorio grande': 'bed',
  'Dormitorio mediano': 'desk',
  'Dormitorio pequeño': 'manicure',
  'Terraza 1': 'outdoor',
  'Terraza 2': 'outdoor',
  Logia: 'laundry',
  'Baño 1': 'bathroom',
  'Baño 2': 'bathroom',
};

function pickImage(product) {
  const name = product.name || '';
  for (const [re, key] of RULES) {
    if (re.test(name) && IMG[key]) return IMG[key];
  }
  const roomKey = ROOM_FALLBACK[product.room] || 'interior';
  return IMG[roomKey] || IMG.interior;
}

/** Precios solo entre 10000 y 19990, estilo ...990 */
function clampPrice(p) {
  let n = Number(p) || 10000;
  if (n < 10000) {
    const t = (n - 5000) / 5000;
    n = 10000 + Math.round(Math.max(0, Math.min(1, t)) * 5) * 1000;
  }
  if (n > 20000) n = 19990;
  n = Math.floor(n / 1000) * 1000 + 990;
  if (n < 10000) n = 10990;
  if (n > 19990) n = 19990;
  return n;
}

function httpOk(url) {
  return new Promise((resolve) => {
    https
      .get(url, { headers: { 'User-Agent': 'casa-shower-image-check' } }, (res) => {
        res.resume();
        const ok =
          res.statusCode === 200 &&
          String(res.headers['content-type'] || '').startsWith('image/');
        resolve(ok);
      })
      .on('error', () => resolve(false));
  });
}

async function main() {
  const file = path.join(__dirname, '../data/productos-casa.json');
  const products = JSON.parse(fs.readFileSync(file, 'utf8'));

  const uniqueUrls = [...new Set(Object.values(IMG))];
  console.log(`Validando ${uniqueUrls.length} URLs del diccionario...`);
  const bad = [];
  for (const url of uniqueUrls) {
    const ok = await httpOk(url);
    if (!ok) bad.push(url);
  }
  if (bad.length) {
    console.error('URLs inválidas en diccionario:', bad);
    process.exit(1);
  }
  console.log('Diccionario OK.');

  let priceChanges = 0;
  const imageCounts = {};

  for (const p of products) {
    const prevPrice = p.price;
    p.price = clampPrice(p.price);
    if (p.price !== prevPrice) priceChanges++;

    p.image = pickImage(p);
    imageCounts[p.image] = (imageCounts[p.image] || 0) + 1;
  }

  const prices = products.map((p) => p.price);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);

  if (minP < 10000 || maxP > 20000) {
    console.error('Precios fuera de rango', minP, maxP);
    process.exit(1);
  }

  fs.writeFileSync(file, JSON.stringify(products, null, 2), 'utf8');

  console.log(`Productos: ${products.length}`);
  console.log(`Precios cambiados: ${priceChanges}`);
  console.log(`Precio min/max: ${minP} / ${maxP}`);
  console.log(`Imágenes únicas usadas: ${Object.keys(imageCounts).length}`);

  const cremas = products.filter((p) => /crema/i.test(p.name));
  for (const c of cremas) {
    console.log('CREMA:', c.name, '→ skincare?', c.image === IMG.skincare, 'price', c.price);
    if (c.image !== IMG.skincare) {
      console.error('ERROR: crema sin imagen skincare');
      process.exit(1);
    }
  }

  console.log('Escrito:', file);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
