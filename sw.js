/* Schrijfbureau: keeps the app on this device so it opens without internet.
   Your writing is not stored here; it lives on your device and in your Dropbox. */
const CACHE='schrijfbureau-v1';
const CORE=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./apple-touch-icon.png'];
const LIBS=['https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js','https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js','https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js','https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js','https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(CACHE).then(async c=>{ await c.addAll(CORE); for(const u of LIBS){ try{ await c.add(new Request(u,{mode:'cors'})); }catch(x){} } }).then(()=>self.skipWaiting())); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch',e=>{
  const req=e.request; if(req.method!=='GET') return;
  const u=new URL(req.url);
  if(/dropbox(api)?\.com$/.test(u.hostname)) return;              // syncing always goes straight to Dropbox
  if(u.origin===location.origin){                                   // the app itself: newest when online, saved copy when offline
    e.respondWith(fetch(req).then(r=>{ if(r.ok){ const cp=r.clone(); caches.open(CACHE).then(c=>c.put(req,cp)); } return r; })
      .catch(()=>caches.match(req,{ignoreSearch:true}).then(r=>r||caches.match('./index.html'))));
    return;
  }
  if(/cdn\.jsdelivr\.net|fonts\.(googleapis|gstatic)\.com/.test(u.hostname)){  // libraries and fonts: saved copy first
    e.respondWith(caches.match(req).then(r=>r||fetch(req).then(n=>{ if(n.ok||n.type==='opaque'){ const cp=n.clone(); caches.open(CACHE).then(c=>c.put(req,cp)); } return n; })));
  }
});
