# Song Player

Keep the UI compact and easy to navigate. This is a buildless GitHub Pages PWA.

Manage playlists in playlists.json. Each song needs a stable id, name, and url. Keep IDs stable when renaming or reordering. Store uploaded MP3 files in audio/. Give replaced recordings a new filename so existing offline downloads update.

After changing application code, bump the SHELL cache version in sw.js. Do not change AUDIO_CACHE unless intentionally migrating audio storage. Saved playlists share one cached copy of each audio URL.

Run node --check app.js and node --check sw.js. Check that relative audio paths and manifest icons exist. Verify playback, timestamp links, playlist selection, and offline saving in a browser when available.

The user manages this project through the originating Codex chat. Verify requested changes, then commit and push to main and check the Pages deployment. No local review or separate approval is needed unless Jesse asks for it. Do not delete audio files still referenced by any playlist.

Preserve original audio. Play recordings at their original level; do not add volume leveling or loudness processing.

Playlist folders live at audio/<playlist name>/. When Jesse says sync, run python3 scripts/sync-playlists.py, verify paths/durations, and publish the playlist and relevant audio changes. Ignore loose files directly in audio/. Preserve existing stable song IDs, titles, order, and start times. New tracks append unless Jesse specifies otherwise.
