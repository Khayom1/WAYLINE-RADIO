# Live broadcasting runbook

## What runs the radio

The API accepts private managed audio uploads. The broadcaster worker checks every active station and its company's tracks, applies the same rights policy as the API, writes an FFmpeg concat playlist and starts an FFmpeg source process. That process re-encodes audio to MP3 and sends it to the private Icecast service. Listeners connect to the API at /stream/STATION-SLUG; the API proxies the stream from Icecast.

The seeded stations are cnu-radio and etl-radio. A newly created company gets a station and the broadcaster automatically discovers it through the database.

## Prepare production secrets

Use unique hexadecimal secrets so the Icecast startup template can safely substitute them:

- POSTGRES_PASSWORD: openssl rand -hex 32
- JWT_SECRET: openssl rand -hex 48
- ICECAST_SOURCE_PASSWORD: openssl rand -hex 32
- ICECAST_ADMIN_PASSWORD: openssl rand -hex 32

Do not commit .env or send these secrets in a public issue. Use a real domain in PUBLIC_DOMAIN and make its A/AAAA records point to the server. Open inbound TCP 80/443 and optionally UDP 443. Leave 5432 and 8000 private.

## Start and inspect

Run docker compose up --build -d, then docker compose ps. Inspect api, icecast and broadcaster logs if a mount does not appear. The API health endpoint reports database and Icecast reachability at /api/v1/health. A healthy Icecast service alone does not mean that a station has a source connected.

## Upload an authorized track

1. Connect the administration panel to the API.
2. Select a company and add track metadata.
3. Provide the original license evidence as an HTTPS URL, rights holder and exact license type.
4. Confirm the commercial and internet-streaming permissions only after checking the actual license and relevant territory.
5. Leave the public audio URL blank when using a managed upload.
6. Press Upload audio beside the track and choose the local audio file. The API accepts up to 30 MiB and checks the media signature as well as the declared extension.
7. Once the track passes the rights policy and the uploaded file exists, the broadcaster will include it during its next poll (normally within 15 seconds).

A track without the required rights flags, evidence, current term or managed file is not sent to Icecast. An external URL by itself is not loaded by the broadcaster.

## Test playback

Use the listener page and press Play. Direct mount endpoints are /stream/cnu-radio and /stream/etl-radio (replace the slug for other stations). A station with no eligible uploaded tracks returns HTTP 503 and remains off air.

## Common failures

- Icecast container unhealthy: inspect the Icecast logs and confirm both ICECAST passwords are set and contain only letters, numbers, underscore or hyphen.
- Broadcaster restarts: inspect FFmpeg output in broadcaster logs; verify the audio file is a supported playable format and the license fields pass policy checks.
- Upload returns 415: the browser's audio type or file signature does not match a supported format.
- Upload returns 413: file exceeds 30 MiB.
- Stream endpoint returns 503: there is no active FFmpeg source for that station yet, or Icecast is unreachable.
- Public HTTPS fails: check PUBLIC_DOMAIN DNS, firewall access to TCP 80/443 and Caddy logs.
- No sound in mobile browser: press Play (autoplay is intentionally not assumed), test the mount in another browser, and check the server's FFmpeg/Icecast logs.

## Operations

Back up the PostgreSQL volume and the wayline_media volume together. Do not delete either volume during an upgrade. Monitor disk usage: uploaded files persist in the media volume. Archived tracks are removed from the live playlist but their file is retained for recovery and may be removed later using a reviewed retention policy.

The app does not yet insert RSS stories or announcement TTS clips into the music playlist. It also does not provide per-track scheduled playback, crossfade, DJ controls, advertising insertion or audience analytics. Those are separate broadcast features, not assumptions about the current engine.
