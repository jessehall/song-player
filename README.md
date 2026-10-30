# Song Player

Compact, embeddable PWA. No build tools or dependencies.

## Manage songs

Edit `playlists.json`. Each playlist has a stable `id`, `name`, and `songs`. Each song has a stable `id`, `name`, and `url`. Put MP3s in `audio/` and use a relative URL such as `audio/song-v1.mp3`. Keep song IDs stable when renaming or reordering. Use a new filename when replacing audio, so offline copies update.

Ask Codex in this chat to make changes, commit, and push. GitHub Pages republishes the main branch automatically.

## Sharing

`?playlist=demos&song=animal-telep&t=83` selects a song at 1:23. Playback requires a tap. Share this moment copies the current position.

The Embed button copies an iframe using the currently selected playlist. Installation works from the standalone URL, not inside the iframe. On iPhone use Safari > Share > Add to Home Screen.

## Offline

Save offline downloads the selected playlist. Selected playlists sync on opening, refresh, and reconnecting. Added tracks download; removed tracks are deleted unless another saved playlist uses them. Shared songs use one cached copy. Download failures retain the saved playlist selection for retry. Browser storage can be evicted. External hosts need CORS access for offline saving. Uploaded files are public.

## Development

Run `python3 -m http.server 8080` here and visit localhost:8080. Service workers require HTTPS or localhost. Change the shell cache version in sw.js after app changes. Test offline in the installed app and verify audio seeking.

Optional song field `start` sets the default starting position in seconds. Explicit timestamp links override it.

To rename tracks manually, click Edit titles in the player, sign into GitHub, change the song name fields in playlists.json, and Commit changes. Keep id and url fields unchanged when only renaming.

Playlist and title changes are checked every minute while visible, when returning to the app, and when reconnecting. Current playback continues for unchanged audio URLs. GitHub Pages must finish publishing before changes appear.

## Automatic volume leveling

Playback uses measured EBU R128 integrated loudness stored in each song's `leveling` field. A Web Audio GainNode applies attenuation automatically, including cached audio, without modifying MP3s. The common target is at or below the quietest measured track, with at least 1 dB true-peak headroom. Songs without metadata play at their original level until analyzed. Tracks with a default start time are measured from that point.

After adding or replacing songs, run `python3 scripts/analyze-loudness.py --ffmpeg /path/to/ffmpeg`, or use a Python environment with `imageio-ffmpeg` installed and omit `--ffmpeg`. Re-run after changing a default start time. The script scans the entire current playlist before setting a common target.

Verify on a real iPhone, including screen lock, background playback, seeking, track changes, and offline playback, before relying on background audio behavior.
