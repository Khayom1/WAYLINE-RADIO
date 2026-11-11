#!/usr/bin/env bash
set -euo pipefail

: "${POSTGRES_PASSWORD:?}"
: "${JWT_SECRET:?}"
: "${ICECAST_SOURCE_PASSWORD:?}"
: "${ICECAST_ADMIN_PASSWORD:?}"

cat > .env <<EOF
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
API_HOST_PORT=8080
PUBLIC_DOMAIN=localhost
ICECAST_SOURCE_PASSWORD=${ICECAST_SOURCE_PASSWORD}
ICECAST_ADMIN_PASSWORD=${ICECAST_ADMIN_PASSWORD}
BROADCAST_POLL_MS=5000
BROADCAST_BITRATE=128k
MEDIA_DIR=/var/wayline-media
DATABASE_URL=postgresql://wayline:${POSTGRES_PASSWORD}@db:5432/wayline
PORT=8080
NODE_ENV=production
ICECAST_INTERNAL_URL=http://icecast:8000
CORS_ORIGIN=
JWT_SECRET=${JWT_SECRET}
TOKEN_TTL_SECONDS=43200
AUTO_MIGRATE=true
COLLECTOR_INTERVAL_MS=300000
COLLECTOR_MAX_ITEMS_PER_SOURCE=25
TTS_API_URL=
TTS_API_KEY=
TTS_MODEL=
TTS_VOICE_TG=alloy
TTS_VOICE_RU=alloy
TTS_VOICE_EN=alloy
TTS_OUTPUT_DIR=/var/wayline-tts
EOF

cleanup() {
  docker compose down -v --remove-orphans || true
}
trap cleanup EXIT

docker compose up --build -d
for attempt in $(seq 1 50); do
  if curl -fsS http://127.0.0.1:8080/api/v1/health >/tmp/wayline-health.json; then
    break
  fi
  sleep 2
done
node -e "const h=require('/tmp/wayline-health.json');if(!h.ok||h.streaming_engine!=='connected')process.exit(1);console.log('API and Icecast are healthy')"

printf 'ci-admin@example.test\nWaylineCITestPassword123!\nplatform_admin\n' |
  docker compose exec -T api node scripts/create-admin.mjs

LOGIN="$(curl -fsS -X POST http://127.0.0.1:8080/api/v1/auth/login \
  -H 'content-type: application/json' \
  --data '{"email":"ci-admin@example.test","password":"WaylineCITestPassword123!"}')"
TOKEN="$(LOGIN_JSON="$LOGIN" node -e "process.stdout.write(JSON.parse(process.env.LOGIN_JSON).token)")"
COMPANY_ID="$(LOGIN_JSON="$LOGIN" node -e "const d=JSON.parse(process.env.LOGIN_JSON);const c=d.companies.find(x=>x.slug==='cnu');if(!c)process.exit(2);process.stdout.write(c.id)")"

TRACK="$(curl -fsS -X POST http://127.0.0.1:8080/api/v1/admin/tracks \
  -H "authorization: Bearer ${TOKEN}" \
  -H "x-company-id: ${COMPANY_ID}" \
  -H 'content-type: application/json' \
  --data '{"title":"WAYLINE CI Test Tone","artist":"WAYLINE Test Suite","license_type":"Original synthetic test audio","license_proof_url":"https://example.invalid/wayline-ci-test-license","rights_holder":"WAYLINE CI Test Suite","commercial_allowed":true,"streaming_allowed":true,"license_verified":true}')"
TRACK_ID="$(TRACK_JSON="$TRACK" node -e "process.stdout.write(JSON.parse(process.env.TRACK_JSON).track.id)")"

API_CONTAINER="$(docker compose ps -q api)"
docker exec "$API_CONTAINER" ffmpeg -nostdin -hide_banner -loglevel error \
  -f lavfi -i 'sine=frequency=440:duration=8' -ar 44100 -ac 2 -c:a libmp3lame -b:a 128k \
  /tmp/wayline-ci-tone.mp3
docker cp "$API_CONTAINER:/tmp/wayline-ci-tone.mp3" /tmp/wayline-ci-tone.mp3

curl -fsS -X POST "http://127.0.0.1:8080/api/v1/admin/tracks/${TRACK_ID}/audio" \
  -H "authorization: Bearer ${TOKEN}" \
  -H "x-company-id: ${COMPANY_ID}" \
  -H 'content-type: audio/mpeg' \
  -H 'x-audio-filename: wayline-ci-tone.mp3' \
  --data-binary @/tmp/wayline-ci-tone.mp3 >/tmp/wayline-upload.json
node -e "const r=require('/tmp/wayline-upload.json');if(!r.broadcast_eligible)process.exit(1);console.log('Managed audio normalized and eligible')"

STREAM_OK=0
for attempt in $(seq 1 40); do
  CODE="$(curl -sS --max-time 3 -o /tmp/wayline-live-stream.mp3 -w '%{http_code}' \
    http://127.0.0.1:8080/stream/cnu-radio 2>/dev/null || true)"
  if [ "$CODE" = "200" ] && [ -s /tmp/wayline-live-stream.mp3 ]; then
    STREAM_OK=1
    break
  fi
  sleep 1
done
if [ "$STREAM_OK" -ne 1 ]; then
  docker compose logs api icecast broadcaster
  echo "Live audio endpoint did not return an MP3 stream" >&2
  exit 1
fi
echo "Live Icecast/FFmpeg stream smoke test passed"
