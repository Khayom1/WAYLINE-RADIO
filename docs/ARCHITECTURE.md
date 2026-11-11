# WAYLINE RADIO — system architecture

## Runtime
- **Listener PWA:** mobile-first static web app that discovers active stations and plays their live stream through the browser audio element.
- **Admin control center:** local demo mode or authenticated API mode. API sessions are held in session storage and every admin request includes the selected company ID.
- **API:** Node.js HTTP server, PostgreSQL driver, versioned SQL migrations, managed audio upload/normalization, public station endpoints and same-origin stream proxy.
- **Database:** PostgreSQL; company-owned stations, tracks, feed sources, information, announcements and audit records are scoped by company membership.
- **Collector:** polls approved HTTPS RSS/Atom sources, pins validated public DNS addresses, limits downloads and inserts new items into a human review queue.
- **Optional TTS:** when configured, creates one MP3 per language for approved, fully translated information and announcements. Generated files are stored separately and are not automatically inserted into the live music stream.
- **Broadcast engine:** FFmpeg broadcaster polls active stations, selects rights-cleared managed MP3 uploads and sends a continuous playlist to the private Icecast service.
- **Edge:** Caddy terminates public HTTPS and proxies traffic to the API. PostgreSQL, Icecast and the API host port are not exposed publicly by the Compose configuration.

## Live audio path
`Admin upload -> bounded file validation -> FFmpeg normalization -> private media volume -> rights policy -> broadcaster -> Icecast mount -> API /stream/:slug proxy -> listener PWA`

The integrated engine currently broadcasts music tracks only. It does not provide crossfade, per-track scheduling, live DJ controls, advertising insertion or automatic TTS/news playout.

## Tenant isolation
Each company has one station and its own track catalogue, feed sources, information items and announcements. Admin endpoints require a selected company and verify either platform-admin privileges or membership in that company. The client-supplied company ID is a selector, never proof of authorization.

## Information pipeline
`HTTPS RSS/Atom -> DNS-pinned collector -> pending review -> editor translation in tg/ru/en -> human approval -> optional TTS files`

Collected content is not automatically published or inserted into the live music playlist. Editors must review source terms, accuracy, translations and broadcast suitability.

## Music rights pipeline
A track requires explicit verification, commercial permission, internet-streaming permission, a rights holder, license type, HTTPS proof reference, a valid term and a normalized managed audio upload. The software gate checks recorded metadata; human review remains mandatory and the application does not certify legal rights.

## Deployment
Docker Compose runs PostgreSQL, API, Icecast, FFmpeg broadcaster, collector and Caddy. Persistent volumes hold database data, uploaded media, generated TTS files and Caddy state. See [DEPLOYMENT.md](DEPLOYMENT.md) and [BROADCASTING.md](BROADCASTING.md).

## Security
Parameterized SQL, scrypt password hashes, HMAC-signed expiring sessions, company-membership checks, login throttling, bounded request bodies, upload validation, security headers and DNS-pinned HTTPS feed retrieval are included. Production still requires a correctly configured domain/TLS, strong secrets, restricted host access, tested backups, egress controls, monitoring and incident response.

## Known boundaries
No hosted radio service, domain, server, music catalogue, third-party content rights or TTS credentials are supplied. AI translation is not bundled. The integrated broadcaster currently plays music only; TTS playout, advanced scheduling and audience analytics remain future work.
