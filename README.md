# WAYLINE RADIO

**Multilingual, multi-company internet radio for trucking and logistics teams.**

WAYLINE RADIO is designed around separate company stations (starting with CNU Radio and ETL Radio), a listener-friendly installable web app, a central control panel, an RSS information intake pipeline, and documented music-rights checks.

## Product capabilities in this repository

- Three interface/content languages: Tajik (`tg`), Russian (`ru`) and English (`en`).
- Public station directory and live audio playback through the integrated Icecast/FFmpeg broadcast engine.
- Private managed audio uploads, per-company playlists and same-origin HTTPS stream endpoints.
- Automatic HTTPS reverse proxy and versioned PostgreSQL migrations.
- PostgreSQL data model for companies, memberships, stations, categories, tracks, music rights, RSS sources, information items, announcements and audit events.
- Node.js API with signed sessions, scrypt password hashing, parameterized SQL and server-side company-membership checks.
- RSS/Atom collector. New stories enter a review queue; they are not automatically broadcast.
- Rights gate: music is not broadcast-eligible until a reviewer records the license, proof, commercial permission, streaming permission and valid term.
- Docker Compose deployment for API, PostgreSQL, Icecast, FFmpeg broadcaster, collector and Caddy HTTPS proxy.
- PWA manifest and service worker for installable mobile web access.

## Run locally with Docker

1. Copy `.env.example` to `.env`.
2. Set unique random hexadecimal values for `POSTGRES_PASSWORD`, `JWT_SECRET`, `ICECAST_SOURCE_PASSWORD` and `ICECAST_ADMIN_PASSWORD`; use `openssl rand -hex 32` (48 bytes for `JWT_SECRET`).
3. Set `PUBLIC_DOMAIN` to the real public hostname whose DNS points to the Linux host. `localhost` is only for local testing.
4. Allow inbound TCP ports 80 and 443 (and UDP 443 for HTTP/3). Do not expose PostgreSQL 5432 or Icecast 8000.
5. Run `docker compose up --build -d`; check with `docker compose ps` and `docker compose logs -f api icecast broadcaster`.
6. Use `https://YOUR_DOMAIN/` for the listener and `https://YOUR_DOMAIN/admin` for the control center. Caddy requests and renews the public TLS certificate when DNS and firewall configuration are correct.
5. Create the first administrator from a shell with access to the running database:

```bash
docker compose exec api node scripts/create-admin.mjs
```

6. Open `/admin`, select **Connect API**, and sign in using the administrator email/password created above. The control center also offers an isolated local demo mode.

## Mobile / Termux development

Requires Node.js 20+ and PostgreSQL. Install dependencies with `npm install`, set `DATABASE_URL` and `JWT_SECRET`, then run `npm start`. The database can be hosted remotely; the phone does not need to run PostgreSQL locally.

## RSS collection

Create an RSS/Atom source through `POST /api/v1/admin/sources`. The collector runs every five minutes by default. It only accepts HTTPS feeds, limits response size and time, and places newly discovered content into the pending review queue. Translate the approved story into all required languages before scheduling it.

## Live radio streaming

The repository now includes Icecast, an FFmpeg broadcaster worker, private audio storage and a same-origin stream proxy. Each active station receives its own mount using its station slug. Upload a track through the administration panel; the broadcaster polls every 15 seconds and only sends active tracks whose rights metadata passes the server-side policy and whose managed audio file exists. Supported formats are MP3, M4A, AAC, WAV, FLAC, OGG and WebM, with a 30 MB upload limit. External audio URLs are metadata only; the integrated broadcaster does not fetch or relay them.

The public player uses /stream/STATION-SLUG, so Icecast port 8000 does not need to be exposed publicly. Caddy handles HTTPS. Follow docs/BROADCASTING.md and set PUBLIC_DOMAIN to a real DNS name before deploying to the internet. The initial seeded stations are cnu-radio and etl-radio.

## Deployment boundaries

This repository provides the software and Docker deployment files, not a hosted radio service. A real public broadcast still requires a Linux server with Docker Compose, a domain and working DNS, reachable ports 80/443, valid secrets, audio content and legally sufficient rights for each recording and territory. No music catalog or music rights are supplied. Operators remain responsible for license verification, backups, server monitoring and compliance with local rules. RSS stories and announcements remain review content; automatic insertion of voice announcements into the live music schedule is not enabled. Voice synthesis requires a separately configured TTS provider key.

## License

The software is released under the MIT License. That software license does not grant rights to any music, recordings, news feeds, logos or other third-party content. See [LICENSE-MUSIC.md](LICENSE-MUSIC.md).

## Maintainer

Project: [Khayom1/WAYLINE-RADIO](https://github.com/Khayom1/WAYLINE-RADIO)

## Access control

Company permissions are resolved from the selected company's membership, not only from a user's global account role. A viewer membership is read-only even if the same account has elevated access elsewhere. Platform administrators retain platform-wide company access.

## Public API

- `GET /api/v1/health` — database-backed health check.
- `GET /api/v1/public/stations` — active public stations.
- `GET /api/v1/public/stations/:slug` — one active station.
- `GET /api/v1/public/announcements` — approved, scheduled and published announcements whose scheduled time has arrived.
- `POST /api/v1/auth/login` — sign in and receive a signed session.
- `/api/v1/admin/*` — authenticated company-scoped administration.

## Validation

Run syntax and policy tests locally:

```sh
npm install
npm run check
npm test
```

Android-only contributors can follow [the Termux testing guide](docs/TERMUX-TESTING.md). See [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md) before submitting changes.

## Project authorship

Maintainer and original project author: **Khayom Abdurahmonov**. The software is MIT-licensed; music, recordings, logos, news feeds and other third-party materials remain subject to their own rights and licenses.
