# WAYLINE RADIO

**Multilingual, multi-company internet radio for trucking and logistics teams.**

WAYLINE RADIO is designed around separate company stations (starting with CNU Radio and ETL Radio), a listener-friendly installable web app, a central control panel, an RSS information intake pipeline, and documented music-rights checks.

## Product capabilities in this repository

- Three interface/content languages: Tajik (`tg`), Russian (`ru`) and English (`en`).
- Public station directory and audio playback when a real stream URL is configured.
- PostgreSQL data model for companies, memberships, stations, categories, tracks, music rights, RSS sources, information items, announcements and audit events.
- Node.js API with signed sessions, scrypt password hashing, parameterized SQL and server-side company-membership checks.
- RSS/Atom collector. New stories enter a review queue; they are not automatically broadcast.
- Rights gate: music is not broadcast-eligible until a reviewer records the license, proof, commercial permission, streaming permission and valid term.
- Docker Compose deployment for API, PostgreSQL and collector.
- PWA manifest and service worker for installable mobile web access.

## Run locally with Docker

1. Copy `.env.example` to `.env`.
2. Set a strong `POSTGRES_PASSWORD` and a random `JWT_SECRET` (at least 32 characters) in `.env`.
3. Run `docker compose up --build -d`.
4. Open `http://localhost:8080` for the listener app and `http://localhost:8080/admin` for the control center.
5. Create the first administrator from a shell with access to the running database:

```bash
docker compose exec api node scripts/create-admin.mjs
```

6. Open `/admin`, select **Connect API**, and sign in using the administrator email/password created above. The control center also offers an isolated local demo mode.

## Mobile / Termux development

Requires Node.js 20+ and PostgreSQL. Install dependencies with `npm install`, set `DATABASE_URL` and `JWT_SECRET`, then run `npm start`. The database can be hosted remotely; the phone does not need to run PostgreSQL locally.

## RSS collection

Create an RSS/Atom source through `POST /api/v1/admin/sources`. The collector runs every five minutes by default. It only accepts HTTPS feeds, limits response size and time, and places newly discovered content into the pending review queue. Translate the approved story into all required languages before scheduling it.

## Real radio streaming

The listener app plays an actual audio stream only when a station has a valid `stream_url`. This repository does not bundle a streaming server or a licensed music catalogue. Deploy and configure an Icecast/AzuraCast-compatible streaming service, then set the station's public stream URL. Do not label a station live until the stream has been tested externally.

## Important boundaries

This is a deployable application foundation, not a hosted radio service. No cloud instance, domain, TLS certificate, media server, TTS vendor, feed credentials or music licenses are supplied by the repository. RSS collection is automatic after deployment and source configuration; story approval is intentionally human-controlled. Three-language announcements are stored separately and require complete translations before approval. Translation is entered and reviewed by an editor; an automatic translation provider is not configured. Voice synthesis requires a separately configured TTS key. The current example uses the Speech API model `gpt-4o-mini-tts`, which OpenAI has scheduled to shut down on January 6, 2027; replace the worker adapter before that date.

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
- `GET /api/v1/public/announcements` — approved and published announcements whose scheduled time has arrived.
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
