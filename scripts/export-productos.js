const fs = require('fs');
const path = require('path');

const products = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../data/productos-casa.json'), 'utf8')
);

const headers = [
  'name',
  'room',
  'price',
  'image',
  'link',
  'color_hint',
  'neededQuantity',
  'unlimited',
  'notes',
];

function escapeCsv(v) {
  const s = v == null ? '' : String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

const rows = products.map((p) => headers.map((h) => escapeCsv(p[h])).join(','));
const csv = [headers.join(','), ...rows].join('\n');
fs.writeFileSync(path.join(__dirname, '../data/productos-casa.csv'), '\ufeff' + csv, 'utf8');

const gifts = products.map((p) => {
  // Preferir nombre del producto real de tienda + habitación
  let label = p.productName
    ? `${p.name.replace(/\s*·\s*.*$/, '').trim()} — ${p.productName}`
    : p.name;
  if (p.room && !label.includes(p.room)) {
    label = `${label} · ${p.room}`;
  }
  return {
    name: label.slice(0, 160),
    image: p.image || '',
    link: p.link || '',
    price: Number(p.price) || 0,
    unlimited: false,
    neededQuantity: p.neededQuantity || 1,
    reservedCount: 0,
    reservedBy: null,
    reservedByAnimal: null,
    reservedByList: [],
  };
});

fs.writeFileSync(
  path.join(__dirname, '../data/gifts-import.json'),
  JSON.stringify(gifts, null, 2),
  'utf8'
);

const rooms = {};
let total = 0;
for (const p of products) {
  rooms[p.room] = (rooms[p.room] || 0) + 1;
  total += p.price;
}

console.log('Total productos:', products.length);
console.log('Suma precios CLP:', total.toLocaleString('es-CL'));
console.log('Precio min:', Math.min(...products.map((p) => p.price)));
console.log('Precio max:', Math.max(...products.map((p) => p.price)));
console.log('Por habitacion:', rooms);
console.log('Archivos: data/productos-casa.csv y data/gifts-import.json');
