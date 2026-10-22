const SHELL='song-player-shell-v12';
const FILES=['./','index.html','style.css?v=12','app.js?v=10','manifest.webmanifest','icon.svg','icon-192.png','icon-512.png','images/ios-share.png','images/ios-home-screen.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(SHELL).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('song-player-shell-')&&k!==SHELL).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
 const u=new URL(e.request.url);
 if(e.request.method!=='GET'||u.origin!==location.origin||u.pathname.endsWith('/playlists.json')||u.pathname.includes('/audio/'))return;
 if(e.request.mode==='navigate'){e.respondWith(fetch(e.request).catch(()=>caches.match(new URL('./',self.registration.scope).href)));return;}
 if(FILES.some(f=>new URL(f,self.registration.scope).href===u.href))e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
});
