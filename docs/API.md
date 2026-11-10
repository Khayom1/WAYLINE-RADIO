# WAYLINE RADIO API

Base path: `/api/v1`. JSON is used for API request/response bodies unless an audio upload is being sent. Admin calls require `Authorization: Bearer <token>` and an `X-Company-ID: <uuid>` header. Company membership is checked on the server for every admin request.

## Public
- `GET /health` — database and Icecast reachability.
- `GET /public/stations` — active public stations, stream type and live status.
- `GET /public/stations/:slug` — one active station.
- `GET /public/announcements?limit=10` — approved/scheduled/published announcements whose scheduled time has arrived.
- `GET /stream/:slug` — proxied live audio from the private Icecast mount.

## Authentication
- `POST /auth/login` — accepts `{ "email": "...", "password": "..." }`; returns a signed, time-limited token, user and permitted companies.

## Administration
- `GET /admin/dashboard`
- `GET /admin/companies`; `POST /admin/companies` (platform administrator only)
- `GET /admin/stations`; `PATCH /admin/stations/:id`
- `GET /admin/tracks`; `POST /admin/tracks`; `POST /admin/tracks/:id/audio`; `DELETE /admin/tracks/:id`
- `GET /admin/sources`; `POST /admin/sources`; `PATCH /admin/sources/:id`
- `GET /admin/information`; `PATCH /admin/information/:id`
- `GET /admin/announcements`; `POST /admin/announcements`; `PATCH /admin/announcements/:id`

## Managed audio upload
Create the track metadata first, then send the audio file as the raw request body to `POST /admin/tracks/:id/audio`. Set the media `Content-Type` and `X-Audio-Filename` headers. Uploads are limited to 30 MiB, checked against supported audio signatures and normalized to MP3 by FFmpeg. The broadcaster uses managed uploads; an external `audio_url` alone is not broadcast by the integrated engine.

## Rights and publication rules
A track is broadcast-eligible only when its rights metadata is complete and explicitly verified, its license is in date, its proof URL is safe HTTPS, and a normalized managed MP3 upload exists. The API stores declarations and proof references; it does not independently certify legal rights.

Information items and announcements must have complete Tajik, Russian and English title/body fields before approval. RSS items enter a pending review queue and are never automatically broadcast. Optional TTS output is stored separately and is not automatically inserted into the live music stream.

All company-owned reads and writes are scoped to the authenticated company membership.
