# WAYLINE RADIO — product requirements

## Product definition
A multilingual multi-company internet radio platform for trucking and logistics businesses, starting with CNU Radio and ETL Radio.

## Confirmed product rules
- Tajik (`tg`), Russian (`ru`) and English (`en`) for listener and administration interfaces and editorial content.
- Each company owns a separate station, music catalogue, information sources and announcements.
- Mobile-first listener experience with PWA installation support and desktop browser compatibility.
- Music records artist, composer, rights holder, license, proof reference, commercial permission, streaming permission and expiry.
- A track is not broadcast-eligible until every rights condition and a managed audio upload are present.
- RSS/Atom feeds can be collected automatically; items enter a human review queue.
- Company announcements and information require all three language versions before approval.
- Optional TTS can generate one audio file per language after approval when a provider is configured.
- The integrated Icecast/FFmpeg engine broadcasts managed, rights-cleared MP3 tracks through a same-origin HTTPS stream endpoint.

## Implemented in this repository
- Responsive listener PWA shell and admin control center.
- Local demo data mode and API connection/login from the dashboard.
- Node.js API, PostgreSQL schema, versioned migrations, company-membership checks, scrypt passwords and time-limited signed sessions.
- Company, station, track, feed, information and announcement endpoints.
- Bounded managed audio upload, audio-signature checks and FFmpeg normalization.
- Icecast service, continuous FFmpeg broadcaster and public stream proxy.
- RSS/Atom collector with DNS-pinned HTTPS retrieval, response limits and review queue.
- Optional server-side TTS worker that creates language-specific MP3 files.
- Three-language UI strings and translation fields.
- Unit/policy tests and a Docker smoke-test workflow intended to exercise an actual synthetic audio broadcast.

## Requires environment / operator configuration
- Linux host with Docker Engine and Docker Compose.
- PostgreSQL, public domain/DNS, TLS, firewall and strong deployment secrets.
- Tested audio files and legally sufficient rights from every relevant rights holder.
- Verified RSS sources and a human editorial policy.
- TTS credentials and tested voices for all three languages if voice generation is wanted.
- Backups, monitoring, updates and tested restore procedures.

## Explicitly not claimed
- This source repository is not a hosted 24/7 radio service.
- No music catalogue, third-party rights, server, domain or voice-vendor credentials are supplied.
- The platform does not verify legal documents automatically.
- AI translation is not bundled; operators provide and review all three language versions.
- TTS files are generated separately and are not yet automatically inserted into the integrated live music playlist.
- Crossfade, per-track scheduling, DJ controls, advertising insertion and audience analytics are not implemented.
