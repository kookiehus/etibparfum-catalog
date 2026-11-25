/* ETIB: работа без сети. При наличии интернета страницы берутся свежие, без сети — из копии на телефоне. */
const V='etib-v122';
const FILES=['./','index.html','catalog.html','sales.html','trainer.html','memo.html',
  'etib-ui.css','etib-ui.js','trainer-data.js','rabbit.js','pron.js','tips.js','cards.js','cards.css','card-ui.js','helper.js','helper-data.json','dobby-learn.json','shop.jpg','staff.jpg','qr.jpg',
  'manifest.webmanifest','welcome-9x16.png','favicon.svg','icon-192.png','icon-512.png','icon-maskable-512.png','apple-touch-icon.png'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(V).then(c=>Promise.all(FILES.map(f=>c.add(f).catch(()=>{})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
/* страницы, скрипты и данные — сначала из сети (свежие), без сети — из копии; картинки — из копии, в фоне обновляем */
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
  const isImg=/\.(webp|png|jpe?g|svg|gif)$/i.test(new URL(r.url).pathname);
  e.respondWith(caches.open(V).then(c=>{
    if(!isImg)return fetch(r).then(res=>{if(res&&res.ok)c.put(r,res.clone());return res}).catch(()=>c.match(r,{ignoreSearch:true}).then(h=>h||Response.error()));
    return c.match(r,{ignoreSearch:true}).then(hit=>{
      const net=fetch(r).then(res=>{if(res&&res.ok)c.put(r,res.clone());return res}).catch(()=>hit||Response.error());
      return hit||net})}))});
