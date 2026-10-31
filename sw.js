/* ETIB: работа без сети.
   Страницы и файлы сначала берутся из копии на телефоне (мгновенно), а в фоне тихо обновляются —
   свежее покажется при следующем открытии. Без интернета всё работает из копии.

   Как обновлять:
   • поменяли страницы/картинки — ничего делать не нужно, обновится само;
   • добавили НОВЫЙ файл или поменяли этот sw.js — допишите файл в список FILES и увеличьте номер V (etib-v74, etib-v75…). */
const V = 'etib-v74';
const PREFIX = 'etib-';            // удаляем только свои старые копии (на github.io у одного адреса может быть несколько сайтов)

/* Что сохранить на телефон при установке. Если какого-то файла нет — он просто пропускается, установка не ломается. */
const FILES = [
  './', 'index.html', 'catalog.html', 'sales.html', 'trainer.html', 'memo.html',
  'etib-ui.css', 'etib-ui.js', 'etib-fx.css', 'etib-fx.js',
  'trainer-data.js', 'rabbit.js', 'pron.js', 'tips.js', 'helper.js', 'helper-data.json', 'dobby-learn.json',
  'fonts/fonts.css', 'fonts/manrope-cyrillic.woff2', 'fonts/manrope-latin.woff2',
  'fonts/playfair-display-cyrillic.woff2', 'fonts/playfair-display-latin.woff2', 'fonts/playfair-sc.woff2',
  'welcome-9x16.webp', 'shop.webp', 'staff.webp', 'qr.webp',
  'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png'
];
/* Старые shop.jpg, staff.jpg, qr.jpg, welcome-9x16.png, fonts/playfair-sc.woff страницы больше не используют —
   они лежат на сайте для совместимости и сохраняются на телефон, только если их кто-то откроет. */
/* Картинки ароматов из каталога (папка img/) перечислены в img/list.json — его пишет perf-extract-catalog-images.py. */
const IMG_LIST = 'img/list.json';

/* Картинки с отпечатком содержимого в имени (img/…-0123456789.webp) никогда не меняются: берём из копии и не перекачиваем. */
const FOREVER = /\/img\/[^/]*[0-9a-f]{10}\.(webp|avif|jpe?g|png)$/;

const ok = res => res && res.status === 200 && res.type === 'basic';   // без «непрозрачных», частичных (206) и ошибок
const key = url => { const u = new URL(url, self.location.href); u.search = ''; u.hash = ''; return u.href };

async function save(cache, url, res) {
  if (!ok(res)) return;
  try {
    /* ответ после переадресации нельзя отдавать странице как есть — сохраняем «чистую» копию */
    if (res.redirected) res = new Response(await res.blob(), { status: res.status, statusText: res.statusText, headers: res.headers });
    await cache.put(key(url), res);
  } catch (e) { /* место кончилось — не страшно */ }
}
async function grab(cache, url) {
  try { await save(cache, url, await fetch(new Request(url, { cache: 'reload' }))) } catch (e) { /* нет файла/сети — пропускаем */ }
}
async function grabAll(cache, list, n) {          // по n файлов параллельно, чтобы не душить слабую сеть
  const q = list.slice();
  await Promise.all(Array.from({ length: n }, async () => { while (q.length) await grab(cache, q.shift()) }));
}

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(V);
    await grabAll(c, FILES, 4);
    try {
      const r = await fetch(IMG_LIST, { cache: 'reload' });
      if (r.ok) await grabAll(c, (await r.json()).map(f => 'img/' + f), 6);
    } catch (e) { /* списка картинок нет — значит, картинки ещё внутри catalog.html */ }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith(PREFIX) && k !== V).map(k => caches.delete(k)));
    if (self.registration.navigationPreload) { try { await self.registration.navigationPreload.enable() } catch (e) {} }
    await self.clients.claim();
  })());
});

/* не перекачивать один и тот же файл чаще раза в минуту (страница может просить его несколько раз подряд) */
const fresh = new Map();
function due(url) {
  const t = Date.now(), last = fresh.get(url) || 0;
  if (t - last < 60000) return false;
  fresh.set(url, t); return true;
}

self.addEventListener('fetch', e => {
  const r = e.request, url = new URL(r.url);
  if (r.method !== 'GET' || url.origin !== self.location.origin) return;   // чужие сайты и отправка форм — мимо
  if (r.headers.has('range')) return;                                      // частичные запросы (видео/аудио) — напрямую в сеть
  const nav = r.mode === 'navigate';
  const wantFresh = !nav && (r.cache === 'no-cache' || r.cache === 'reload' || r.cache === 'no-store');

  e.respondWith((async () => {
    const c = await caches.open(V);
    const hit = await c.match(key(r.url)) || await c.match(r, { ignoreSearch: true });

    /* сеть: для страниц берём уже начатую браузером загрузку (navigation preload), чтобы не качать дважды */
    const net = async () => {
      let res = nav ? await e.preloadResponse : null;
      if (!res) res = await fetch(r);
      await save(c, r.url, res.clone());
      return res;
    };

    if (wantFresh) {                                   // страница явно просит свежее (например, dobby-learn.json): сначала сеть
      try { return await net() } catch (err) { return hit || Response.error() }
    }
    if (hit) {
      if (nav || (!FOREVER.test(url.pathname) && due(key(r.url)))) e.waitUntil(net().catch(() => {}));   // тихо обновляем копию в фоне
      return hit;
    }
    try { return await net() } catch (err) {
      if (nav) { const home = await c.match(key('index.html')); if (home) return home }   // без сети на неизвестной странице — главная
      return Response.error();
    }
  })());
});
