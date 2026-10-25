/* ETIB: работа без сети. При наличии интернета страницы берутся свежие, без сети — из копии на телефоне. */
const V='etib-v62';
const FILES=['./','index.html','catalog.html','sales.html','trainer.html','memo.html',
  'etib-ui.css','etib-ui.js','trainer-data.js','rabbit.js','pron.js','tips.js','helper.js','helper-data.json','dobby-learn.json','shop.jpg','staff.jpg','qr.jpg',
  'manifest.webmanifest','logo-splash.png','icons/favicon.svg','icons/icon-192.png','icons/icon-512.png','icons/icon-maskable-512.png','icons/apple-touch-icon.png'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(V).then(c=>Promise.all(FILES.map(f=>c.add(f).catch(()=>{})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
/* сначала копия на телефоне (мгновенно), в фоне тихо обновляем — свежее покажется при следующем открытии */
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
  e.respondWith(caches.open(V).then(c=>c.match(r,{ignoreSearch:true}).then(hit=>{
    const net=fetch(r).then(res=>{if(res&&res.ok)c.put(r,res.clone());return res}).catch(()=>hit||Response.error());
    return hit||net})))});
