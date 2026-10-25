/* ETIB: работа без сети. При наличии интернета страницы берутся свежие, без сети — из копии на телефоне. */
const V='etib-v55';
const FILES=['./','index.html','catalog.html','sales.html','trainer.html','memo.html',
  'etib-ui.css','etib-ui.js','trainer-data.js','rabbit.js','pron.js','tips.js','helper.js','helper-data.json','dobby-learn.json',
  'manifest.webmanifest','icons/favicon.svg','icons/icon-192.png','icons/icon-512.png','icons/icon-maskable-512.png','icons/apple-touch-icon.png'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(V).then(c=>Promise.all(FILES.map(f=>c.add(f).catch(()=>{})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
/* сначала сеть (с проверкой свежести, максимум 4 секунды), без сети или при медленной сети — копия на телефоне */
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
  e.respondWith(caches.open(V).then(c=>{
    const net=fetch(r,{cache:'no-cache'}).then(res=>{if(res&&res.ok)c.put(r,res.clone());return res});
    const wait=new Promise((_,no)=>setTimeout(no,4000));
    return Promise.race([net,wait]).catch(()=>c.match(r,{ignoreSearch:true}).then(hit=>hit||net.catch(()=>Response.error())))}))});
