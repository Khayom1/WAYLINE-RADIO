# WAYLINE worker

The collector fetches configured HTTPS RSS/Atom feeds and inserts new stories into the pending editorial queue. When a TTS provider is configured, it also turns approved, fully translated information and announcements into MP3 files, one per language. Files are written to `TTS_OUTPUT_DIR/<company>/<language>/`. Share/mount this directory into the corresponding AzuraCast station media folders and assign those folders to playlists. See [deployment guide](../../docs/DEPLOYMENT.md).
