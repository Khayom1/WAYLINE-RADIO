# Deployment and radio-engine setup

## Included production stack

The Docker Compose stack contains:
- PostgreSQL 16 for persistent company, user, station, track and publishing data;
- the WAYLINE API and mobile-first listener/admin web applications;
- Icecast 2 as the streaming server;
- an FFmpeg broadcaster that builds a continuous loop from each company's rights-cleared, uploaded MP3 library;
- a collector for HTTPS RSS/Atom feeds and optional text-to-speech generation;
- Caddy as the public HTTPS reverse proxy.

The built-in broadcaster currently plays music tracks only. It does not yet insert generated information or announcement audio into the music playlist. Those generated files are stored separately for editorial/AutoDJ workflows. Do not describe TTS announcements as live until an actual playout integration has been configured and tested.

## First deployment

1. Use a Linux host with Docker Engine and the Docker Compose plugin. A stable public IP and a domain name are required for public HTTPS.
2. Copy `.env.example` to `.env`. Set a real `PUBLIC_DOMAIN`, unique strong PostgreSQL and Icecast passwords, and a random `JWT_SECRET` of at least 32 characters. Use long random hexadecimal passwords for Icecast; the bundled entrypoint deliberately restricts password characters.
3. Keep `.env` private and outside Git. Restrict SSH and firewall access; do not expose PostgreSQL or the Icecast source/admin interface directly to the public internet.
4. Start the stack with `docker compose up -d --build`, then check `docker compose ps` and `docker compose logs --tail=100 api icecast broadcaster collector caddy`.
5. Create the first platform administrator with `docker compose exec api npm run create-admin`. Use a unique email and a strong password. The password prompt is currently visible in the interactive terminal; run it in a trusted administrative session.
6. Sign in at `https://YOUR_DOMAIN/admin`. Select a company, create a track record, upload an audio file, and complete the rights metadata. The broadcaster accepts only normalized managed MP3 uploads whose rights flags, proof URL and expiry pass the policy checks.
7. Open the listener at `https://YOUR_DOMAIN/`. Confirm the station reports live, then play it from a separate device/network. Check the stream again after restarting the stack.

## Audio rights

A track is blocked unless the rights holder, license type, HTTPS proof URL, commercial permission, internet-streaming permission and verification flag are present. A valid upload is also required. The system checks recorded metadata; it cannot independently determine whether a license document is authentic, covers the relevant territory, or authorizes the intended use. Obtain and retain written permission where needed.

## Optional external streaming / AutoDJ

A station may instead point to an externally managed HTTP(S) stream such as an AzuraCast station. The external streaming service then owns its playlists and playout schedule. Never put provider API keys in browser JavaScript.

## RSS and TTS

The collector accepts credential-free HTTPS feed URLs, resolves and pins public DNS answers, rejects private/reserved addresses, blocks redirects and caps response size. Network-level outbound firewall/egress filtering is still recommended.

TTS is optional. Configure `TTS_API_URL`, `TTS_API_KEY`, `TTS_MODEL` and the three voice variables. Generated files are written under `TTS_OUTPUT_DIR` in company/language folders. They are not automatically included in the bundled FFmpeg music stream. A production operator must review translations, pronunciation and the target playout workflow before using generated audio.

## Operations

- Back up PostgreSQL and the `wayline_media` and `wayline_tts` volumes. Test restore procedures, not only backup creation.
- Monitor API, collector, broadcaster, Icecast and Caddy logs.
- Check disk space, CPU, memory, TLS certificate renewal and stream availability.
- Keep Node.js, PostgreSQL, Icecast, FFmpeg and Docker images patched.
- Test public streams over mobile data and Wi-Fi after every deployment.
- Review source-feed terms and music permissions before use.
- Keep the API host and database private behind the reverse proxy. The Compose API port binds to loopback by default.
- The Compose file's default `PUBLIC_DOMAIN=localhost` is for local testing only; configure a real domain before public launch.

## Validation

Run `npm run check` and `npm test` before deployment. The CI workflow also builds the Docker stack, creates a synthetic licensed test track, uploads it and verifies that the managed Icecast endpoint returns audio. A passing CI smoke test proves the synthetic test path, not legal clearance or production uptime for real music.
