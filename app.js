const $ = id => document.getElementById(id);
const audio = $('audio');
const AUDIO_CACHE = 'song-player-audio-v1';
let data, playlist, song, objectURL, pendingTime = 0, installPrompt, syncing = false;
let saved = JSON.parse(localStorage.getItem('saved-playlists') || '[]');
const params = new URLSearchParams(location.search);
if (params.get('embed') === '1') document.body.classList.add('embedded');
const status = text => $('status').textContent = text;
const seconds = value => { const n = Math.max(0, Math.floor(Number(value) || 0)); return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`; };
const urlFor = s => new URL(s.url, location.href).href;
function validData(d) {
  if (!Array.isArray(d.playlists) || !d.playlists.length) throw Error('No playlists found.');
  const ids = new Set();
  for (const p of d.playlists) {
    if (!p.id || ids.has(p.id) || typeof p.name !== 'string' || !Array.isArray(p.songs)) throw Error('Invalid playlist.');
    ids.add(p.id);
    const songIds = new Set();
    for (const s of p.songs) {
      if (!s.id || songIds.has(s.id) || typeof s.name !== 'string' || !s.url || !['http:', 'https:'].includes(new URL(s.url, location.href).protocol)) throw Error('Invalid song.');
      songIds.add(s.id);
    }
  }
  return d;
}
async function load(initial = false) {
  try {
    let d;
    try {
      const r = await fetch('playlists.json', {cache:'no-store'});
      if (!r.ok) throw Error('Playlist unavailable');
      d = validData(await r.json());
      localStorage.setItem('playlist-data', JSON.stringify(d));
    } catch(e) {
      const previous = localStorage.getItem('playlist-data');
      if (!previous) throw e;
      d = validData(JSON.parse(previous));
      status('Using your saved playlist');
    }
    data = d;
    const id = initial ? params.get('playlist') : playlist?.id;
    playlist = data.playlists.find(p => p.id === id) || data.playlists[0];
    $('playlist').replaceChildren(...data.playlists.map(p => new Option(p.name,p.id)));
    $('playlist').value = playlist.id;
    if (initial) {
      const target = params.get('song');
      if (target && !playlist.songs.some(s => s.id === target)) {
        playlist = data.playlists.find(p => p.songs.some(s => s.id === target)) || playlist;
        $('playlist').value = playlist.id;
      }
      await selectSong(playlist.songs.find(s => s.id === target) || playlist.songs[0], false, params.has('t') ? Math.max(0, Number(params.get('t')) || 0) : undefined);
    } else if (song) {
      const updated = data.playlists.flatMap(p => p.songs).find(s => s.id === song.id);
      if (!updated) await selectSong(playlist.songs[0]);
      else if (urlFor(updated) !== urlFor(song)) await selectSong(updated);
      else {song = updated; $('title').textContent = song.name;}
    }
    await render();
    await syncSaved();
  } catch(e) {status(`Could not load playlists: ${e.message}`);}
}
async function render() {
  $('summary').textContent = `${playlist.songs.length} ${playlist.songs.length === 1 ? 'song' : 'songs'}`;
  $('save').textContent = saved.includes(playlist.id) ? '✓ Saved · Remove' : '↓ Save offline';
  const cache = await caches.open(AUDIO_CACHE);
  const nodes = await Promise.all(playlist.songs.map(async (s,i) => {
    const b = document.createElement('button'); b.className = 'track' + (s.id === song?.id ? ' active' : '');
    const number = document.createElement('span'); number.className = 'number'; number.textContent = s.id === song?.id ? '♫' : String(i+1).padStart(2,'0');
    const name = document.createElement('span'); name.className='track-name'; name.textContent=s.name;
    const badge = document.createElement('span'); badge.className='badge'; badge.textContent = await cache.match(urlFor(s)) ? 'Offline' : '';
    b.append(number,name,badge); b.onclick = () => selectSong(s,true); return b;
  }));
  if (!nodes.length) { const p=document.createElement('p');p.textContent='No songs here yet.';nodes.push(p); }
  $('tracks').replaceChildren(...nodes);
  for (const id of ['play','seek','previous','next','back','forward','share','share-song']) $(id).disabled = !song;
}
let selection = 0;
async function selectSong(s, autoplay = false, time = undefined) {
  const token = ++selection;
  audio.pause();
  song=s; pendingTime=time ?? Math.max(0, Number(s?.start) || 0);
  if (objectURL) {URL.revokeObjectURL(objectURL);objectURL=null;}
  $('title').textContent=s?.name || 'Choose a song';
  if (!s) {audio.removeAttribute('src');audio.load();await render();return;}
  const r=await (await caches.open(AUDIO_CACHE)).match(urlFor(s));
  const blob = r ? await r.blob() : null;
  if (token !== selection) return;
  if (blob) objectURL=URL.createObjectURL(blob);
  audio.src=objectURL || urlFor(s);
  audio.load();
  if ('mediaSession' in navigator) navigator.mediaSession.metadata=new MediaMetadata({title:s.name,artist:'Wiener Dawg playah',album:playlist.name});
  await render();
  if (autoplay) await play();
}
async function play(){try{await audio.play();}catch(e){status('Tap Play to start. Check your connection if this song is not saved.');}}
function move(delta) { const index=playlist.songs.findIndex(s => s.id===song?.id); const s=playlist.songs[(index+delta+playlist.songs.length)%playlist.songs.length];if(s)selectSong(s,true); }
async function syncSaved() {
  if (syncing || !data) return;
  syncing=true; $('save').disabled=true;
  try {
    const cache=await caches.open(AUDIO_CACHE);
    const required=new Map(data.playlists.filter(p=>saved.includes(p.id)).flatMap(p=>p.songs).map(s=>[urlFor(s),s]));
    let failures=0, count=0;
    for (const [url,s] of required) {
      if (!await cache.match(url)) {
        status(`Saving ${++count}: ${s.name}…`);
        try {const r=await fetch(url,{mode:'cors',cache:'no-store'});if(!r.ok || r.status===206 || r.type==='opaque' || (r.headers.get('content-type') || '').includes('text/html'))throw Error('Audio unavailable');await cache.put(url,r);}
        catch(e){failures++;}
      }
    }
    for (const r of await cache.keys()) if(!required.has(r.url))await cache.delete(r);
    saved=saved.filter(id=>data.playlists.some(p=>p.id===id));localStorage.setItem('saved-playlists',JSON.stringify(saved));
    status(failures ? `${failures} song(s) could not save. Refresh to retry.` : navigator.onLine ? 'Up to date' : 'Offline · playing saved songs');
    await render();
  } catch(e){status('Offline storage unavailable or full. Try freeing space.');}
  finally{syncing=false;$('save').disabled=false;}
}
$('playlist').onchange=async()=>{playlist=data.playlists.find(p=>p.id===$('playlist').value);await render();};
$('save').onclick=async()=>{const id=playlist.id;if(saved.includes(id))saved=saved.filter(x=>x!==id);else{saved.push(id);navigator.storage?.persist?.().catch(()=>{});}localStorage.setItem('saved-playlists',JSON.stringify(saved));await syncSaved();};
$('refresh').onclick=()=>load();
$('play').onclick=()=>audio.paused?play():audio.pause();
$('previous').onclick=()=>move(-1);$('next').onclick=()=>move(1);
$('back').onclick=()=>audio.currentTime=Math.max(0,audio.currentTime-10);
$('forward').onclick=()=>audio.currentTime=Math.min(audio.duration || 0,audio.currentTime+10);
$('seek').oninput=()=>{if(Number.isFinite(audio.duration))audio.currentTime=Number($('seek').value);};
audio.onloadedmetadata=()=>{audio.currentTime=Math.min(pendingTime,Number.isFinite(audio.duration)?audio.duration:pendingTime);pendingTime=0;$('seek').max=audio.duration || 0;$('duration').textContent=seconds(audio.duration);};
audio.ontimeupdate=()=>{$('seek').value=audio.currentTime;$('elapsed').textContent=seconds(audio.currentTime);};
audio.onplay=()=>{$('play-symbol').setAttribute('d','M6 5h4v14H6zM14 5h4v14h-4z');$('play').setAttribute('aria-label','Pause');};
audio.onpause=()=>{$('play-symbol').setAttribute('d','M8 5l11 7-11 7z');$('play').setAttribute('aria-label','Play');};
audio.onended=()=>move(1);audio.onerror=()=>status('This song could not load. Connect to the internet or save it offline first.');
function shareURL(){const u=new URL('./',location.href);const owner=playlist.songs.some(s=>s.id===song.id)?playlist:data.playlists.find(p=>p.songs.some(s=>s.id===song.id));u.searchParams.set('playlist',owner.id);u.searchParams.set('song',song.id);u.searchParams.set('t',Math.floor(audio.currentTime));return u;}
async function copy(text,message){try{await navigator.clipboard.writeText(text);status(message);}catch(e){window.prompt('Copy this:',text);}}
$('share-song').onclick=()=>{const u=shareURL();u.searchParams.delete('t');copy(u.href,'Song link copied');};
$('share').onclick=()=>copy(shareURL().href,`Link copied at ${seconds(audio.currentTime)}`);
$('embed').onclick=()=>{const u=new URL('./',location.href);u.searchParams.set('playlist',playlist.id);u.searchParams.set('embed','1');copy(`<iframe src="${u.href.replaceAll('&','&amp;')}" title="Wiener Dawg playah" width="100%" height="600" style="border:0" allow="autoplay; clipboard-write"></iframe>`,'Embed code copied');};
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;});
$('install').onclick=async()=>{if(installPrompt){await installPrompt.prompt();installPrompt=null;}else $('help').showModal();};$('close').onclick=()=>$('help').close();
window.addEventListener('online',()=>load());window.addEventListener('offline',()=>status('Offline · playing saved songs'));
if ('mediaSession' in navigator) {for (const [name,fn] of Object.entries({play,pause:()=>audio.pause(),previoustrack:()=>move(-1),nexttrack:()=>move(1),seekto:d=>audio.currentTime=d.seekTime}))try{navigator.mediaSession.setActionHandler(name,fn);}catch(e){}}
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>status('Offline app setup failed. Refresh to retry.'));
load(true);

// Close the install guide only when the tap lands outside its bounds.
$('help').addEventListener('click', event => {
  if (event.target !== $('help')) return;
  const bounds = $('help').getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) $('help').close();
});

// Sync playlist edits while the player is visible without restarting playback.
let autoRefreshRunning = false;
let lastAutoRefresh = 0;
async function autoRefresh() {
  if (document.visibilityState !== 'visible' || !navigator.onLine || autoRefreshRunning || syncing || Date.now() - lastAutoRefresh < 10000) return;
  autoRefreshRunning = true;
  lastAutoRefresh = Date.now();
  try { await load(); }
  finally { autoRefreshRunning = false; }
}
setInterval(autoRefresh, 60000);
document.addEventListener('visibilitychange', autoRefresh);
window.addEventListener('focus', autoRefresh);
