# Song Player

Keep the UI compact and easy to navigate. This is a buildless GitHub Pages PWA.

Manage playlists in playlists.json. Each song needs a stable id, name, and url. Keep IDs stable when renaming or reordering. Store uploaded MP3 files in audio/. Give replaced recordings a new filename so existing offline downloads update.

After changing application code, bump the SHELL cache version in sw.js. Do not change AUDIO_CACHE unless intentionally migrating audio storage. Saved playlists share one cached copy of each audio URL.

Run node --check app.js and node --check sw.js. Check that relative audio paths and manifest icons exist. Verify playback, timestamp links, playlist selection, and offline saving in a browser when available.

The user manages this project through the originating Codex chat. Commit and push requested playlist updates to main, then check the Pages deployment. Do not delete audio files still referenced by any playlist.
