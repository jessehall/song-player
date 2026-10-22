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
