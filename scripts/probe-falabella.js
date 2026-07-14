const https = require('https');

function get(url) {
  return new Promise((resolve, reject) => {
    https
      .get(
        url,
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept-Language': 'es-CL,es;q=0.9',
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

function parsePrice(item) {
  const prices = item.prices || [];
  for (const p of prices) {
    const arr = p.price;
    if (Array.isArray(arr) && arr[0] != null) {
      // Can be "13.990" or "13990" or 13990
      const raw = String(arr[0]).replace(/\./g, '').replace(/,/g, '');
      const n = Number(raw);
      if (n > 100) return n; // CLP
      // if small number like 13.99 meant as 13990 with dot thousands
      const withDot = String(arr[0]);
      if (withDot.includes('.') && Number(withDot.replace(/\./g, '')) > 100) {
        return Number(withDot.replace(/\./g, ''));
      }
    }
  }
  return null;
}

(async () => {
  const body = await get(
    'https://www.falabella.com/falabella-cl/search?Ntt=hervidor+electrico'
  );
  const next = body.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/
  );
  const j = JSON.parse(next[1]);
  const results = j.props.pageProps.results || [];
  console.log('count', results.length);
  for (const item of results.slice(0, 6)) {
    console.log({
      name: item.displayName,
      priceRaw: item.prices?.[0]?.price,
      price: parsePrice(item),
      img: item.mediaUrls?.[0],
      url: item.url,
    });
  }
})().catch(console.error);
