#!/usr/bin/env python3
"""Measure playlist audio with ffmpeg and store non-destructive playback gain.
Run with a Python environment containing imageio-ffmpeg, or pass --ffmpeg.
"""
import argparse,json,math,re,subprocess
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
parser=argparse.ArgumentParser();parser.add_argument('--ffmpeg');args=parser.parse_args()
if args.ffmpeg:ffmpeg=args.ffmpeg
else:
 import imageio_ffmpeg
 ffmpeg=imageio_ffmpeg.get_ffmpeg_exe()
root=Path(__file__).resolve().parent.parent
p=root/'playlists.json';data=json.loads(p.read_text());songs={s['url']:s for pl in data['playlists'] for s in pl['songs']}
def measure(item):
 url,s=item;path=root/url
 if not path.is_file():raise ValueError(f'Local audio required: {url}')
 command=[ffmpeg,'-hide_banner','-nostats']
 # Measure only the portion played by default.
 if s.get('start'):command+=['-ss',str(s['start'])]
 command+=['-i',str(path),'-af','loudnorm=I=-18:TP=-1:LRA=50:print_format=json','-f','null','-']
 r=subprocess.run(command,capture_output=True,text=True,check=True)
 m=re.search(r'\{\s*"input_i".*?\}',r.stderr,re.S)
 if not m:raise ValueError(f'No loudness result: {url}')
 d=json.loads(m.group());lufs=float(d['input_i']);peak=float(d['input_tp'])
 if not all(map(math.isfinite,[lufs,peak])):raise ValueError(f'Unmeasurable audio: {url}')
 return url,lufs,peak
with ThreadPoolExecutor(max_workers=3) as pool:measured=list(pool.map(measure,songs.items()))
# A shared target at or below the quietest song avoids amplification and clipping.
target=min(-18.0,min(lufs+min(0,-1-peak) for _,lufs,peak in measured))
lookup={url:{'integratedLufs':round(lufs,2),'truePeakDbtp':round(peak,2),'gainDb':round(min(0,target-lufs,-1-peak),2)} for url,lufs,peak in measured}
for pl in data['playlists']:
 for s in pl['songs']:s['leveling']=lookup[s['url']]
data['leveling']={'targetLufs':round(target,2),'method':'EBU R128 integrated loudness; attenuation only'}
p.write_text(json.dumps(data,indent=2)+'\n')
for url,lufs,peak in measured:print(f'{lufs:6.1f} LUFS  {lookup[url]["gainDb"]:6.1f} dB  {url}',flush=True)
print(f'Target {target:.2f} LUFS',flush=True)
