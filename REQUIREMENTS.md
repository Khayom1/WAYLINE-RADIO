# WAYLINE RADIO — product requirements

## Product definition
A multilingual multi-company radio platform for trucking and logistics businesses, starting with CNU Radio and ETL Radio.

## Confirmed product rules
- Tajik (`tg`), Russian (`ru`) and English (`en`) for listener and administration interfaces.
- Each company owns a separate station, catalogue, information sources and announcements.
- Mobile-first listener experience with PWA installation support.
- Music is organized by category and records artist, composer, rights holder, license, proof reference, commercial permission, streaming permission and expiry.
- A track is not broadcast-eligible until the rights fields are explicitly confirmed.
- RSS/Atom feeds can be collected automatically; items enter a human review queue.
- Company announcements and information require all three language versions before approval.
- Optional TTS can generate one audio file per language once configured.
- Real audio playback requires a live public stream URL from a media server such as AzuraCast.

## Implemented in this repository
- Responsive listener PWA shell and admin control center.
- Local demo data mode and API connection/login from the dashboard.
- Node.js API, PostgreSQL schema, company-membership checks, scrypt passwords and time-limited signed sessions.
- Company, station, track, feed, information and announcement endpoints.
- RSS/Atom collector with HTTPS-only input checks, response limits and review queue.
- Optional server-side TTS worker which creates language-specific MP3 files for a mounted AutoDJ media folder.
- Three-language UI strings and translation fields.
- Tests for broadcast-rights gating and feed URL validation.

## Requires environment / operator configuration
- PostgreSQL and a deployed API.
- TLS, domain, secrets and backups.
- TTS credentials and tested voices for the three languages.
- AzuraCast/Icecast deployment, station setup, media folders/playlists and public stream URLs.
- Actual license documents and permission from every rights holder.
- Verified RSS sources and a human editorial policy.

## Explicitly not claimed
- This source repository is not a hosted 24/7 radio service.
- No music catalogue or third-party rights have been supplied.
- The platform does not verify legal documents automatically.
- AI translation is not bundled. Operators provide/review the three language versions.
- TTS files are generated only when the optional provider is configured.
