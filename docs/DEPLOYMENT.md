# Deployment and radio-engine setup

## App services
Run the API, PostgreSQL and collector with Docker Compose. The API applies the SQL migration on startup. Create a platform admin with `node scripts/create-admin.mjs` inside the API container.

## HTTPS
Put the API behind a reverse proxy with a valid TLS certificate. Keep PostgreSQL private. Set `CORS_ORIGIN` to the exact public origin. Use unique secrets and regular database backups.

## AzuraCast / AutoDJ
WAYLINE does not bundle a third-party streaming server. AzuraCast provides an AutoDJ based on Liquidsoap and Icecast/Shoutcast-compatible public streams. Set each WAYLINE station's `stream_url` to that station's public listener URL. Store the AzuraCast API key only on the server if you build a management integration; never put it in browser JavaScript.

To make the generated announcement audio available to an AzuraCast AutoDJ:
1. Set `TTS_API_KEY`, `TTS_API_URL`, `TTS_MODEL` and the three voice variables in the server environment.
2. Set `TTS_OUTPUT_HOST_DIR` to a durable host directory and mount that same directory into the corresponding AzuraCast station media directory. The worker writes company/language folders under `TTS_OUTPUT_DIR`.
3. In AzuraCast Media Manager, assign each company/language folder to the appropriate playlist. AutoDJ only plays files that belong to a playlist.
4. Confirm the stream is audible and verify playlist scheduling in AzuraCast before enabling the public station URL.

Approved information/announcements are converted into one MP3 per language. The spoken content begins with a disclosure that the narration is AI-generated. Newly generated files are written to per-company/per-language folders; an operator must add those folders to AutoDJ playlists. No audio is generated until a TTS provider is configured. Translations must be reviewed and completed first. OpenAI currently documents that `gpt-4o-mini-tts` will shut down on January 6, 2027; the Speech API example here is a temporary adapter and must be migrated before that date. The documented successor is a Realtime API model, not a drop-in `/v1/audio/speech` replacement.

AzuraCast docs: [API authentication](https://www.azuracast.com/docs/developers/apis/) · [Media management and AutoDJ playlists](https://www.azuracast.com/docs/user-guide/media-management/). OpenAI TTS docs: [Text to speech](https://developers.openai.com/api/docs/guides/text-to-speech).

## Required production checks
- Test each public stream URL from a mobile network.
- Confirm each company has an isolated station, playlists and media path.
- Confirm RSS sources are reliable and permitted for automated reuse.
- Check voice pronunciation for Tajik, Russian and English before broadcast.
- Monitor the collector and TTS worker logs.
- Set data retention, backup and incident-response rules.
