# WAYLINE RADIO API

Base path: `/api/v1`. JSON is used for request and response bodies. Admin calls require `Authorization: Bearer <token>` and an `X-Company-ID: <uuid>` header. Company membership is checked on the server for every request.

## Public
- `GET /health` — service and database status.
- `GET /public/stations` — active public stations.
- `GET /public/stations/:slug` — one station, including its configured stream URL.

## Authentication
- `POST /auth/login` — `{ "email": "...", "password": "..." }`. Returns a short-lived signed token, user and permitted companies.

## Administration
- `GET /admin/dashboard`
- `GET /admin/companies`; `POST /admin/companies` (platform administrator only)
- `GET /admin/stations`; `PATCH /admin/stations/:id`
- `GET /admin/tracks`; `POST /admin/tracks`; `DELETE /admin/tracks/:id`
- `GET /admin/sources`; `POST /admin/sources`; `PATCH /admin/sources/:id`
- `GET /admin/information`; `PATCH /admin/information/:id`
- `GET /admin/announcements`; `POST /admin/announcements`; `PATCH /admin/announcements/:id`

Track records require artist, title, license type, and audio URL. A track is eligible for broadcasting only when license verification, commercial rights and internet streaming rights are all explicitly true and the license has not expired. The API stores declarations and proof references; it does not independently certify legal rights.

Announcements must contain title and body in Tajik, Russian and English before they can be approved. RSS items enter the pending queue and are never auto-published.
