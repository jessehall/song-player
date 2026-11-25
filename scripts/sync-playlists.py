#!/usr/bin/env python3
"""Sync audio/<playlist name>/ folders into playlists.json; never modifies audio."""
from pathlib import Path
import hashlib,json,re,subprocess
root=Path(__file__).resolve().parent.parent
path=root/'playlists.json';data=json.loads(path.read_text())
old={p['name']:p for p in data['playlists']}
known={s['url']:s for p in data['playlists'] for s in p['songs']}
folders=sorted((root/'audio').iterdir(),key=lambda p:p.name.lower())
result=[]
# Retain playlist order, append any newly created folders.
names=list(old)+[p.name for p in folders if p.is_dir() and not p.name.startswith('.') and p.name not in old]
for name in names:
 folder=root/'audio'/name
 if not folder.is_dir():continue
 pl=old.get(name,{'id':re.sub('[^a-z0-9]+','-',name.lower()).strip('-') or hashlib.sha256(name.encode()).hexdigest()[:12],'name':name,'songs':[]})
 files={p.relative_to(root).as_posix():p for p in sorted(folder.iterdir(),key=lambda p:p.name.lower()) if p.is_file() and p.suffix.lower() in {'.mp3','.m4a','.wav','.aac','.ogg','.flac'}}
 songs=[]
 order=[s['url'] for s in pl['songs'] if s['url'] in files]+[url for url in files if not any(s['url']==url for s in pl['songs'])]
 for url in order:
  file=files[url]
  s=dict(known.get(url,{'id':re.sub('[^a-z0-9]+','-',file.stem.lower()).strip('-')+'-'+hashlib.sha256(url.encode()).hexdigest()[:8],'name':re.sub(r'[-_]+',' ',file.stem).strip(),'url':url}))
  info=subprocess.run(['afinfo',str(file)],capture_output=True,text=True,check=True)
  match=re.search(r'estimated duration:\s*([\d.]+)',info.stdout)
  if not match:raise ValueError(f'Cannot measure {file}')
  s['duration']=round(float(match.group(1)),3);songs.append(s)
 pl['songs']=songs;result.append(pl)
assert result,'No playlist folders found'
assert len({p['id'] for p in result})==len(result),'Duplicate playlist IDs'
data['playlists']=result
path.write_text(json.dumps(data,indent=2)+'\n')
for p in result:print(f'{p["name"]}: {len(p["songs"])} songs')
