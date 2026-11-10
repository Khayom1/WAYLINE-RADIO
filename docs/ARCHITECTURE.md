# WAYLINE RADIO — system architecture

## Runtime
- **Listener PWA:** static mobile-first frontend; plays a configured station stream using the browser audio element.
- **Admin control center:** demo-local storage by default; can authenticate to the Node API using a short-lived bearer token and selected company header.
- **API:** Node.js built-in HTTP server plus PostgreSQL driver.
- **Database:** PostgreSQL, with company ownership on all tenant-owned records.
- **Collector/TTS worker:** polls approved HTTPS RSS/Atom sources, records unique entries, then optionally synthesizes approved three-language content into MP3 files.
- **Media engine:** external AzuraCast/AutoDJ/Icecast-compatible service. The station public stream URL is stored per company.

## Tenant isolation
Each company has its own station, music metadata, sources, information items and announcements. Every admin endpoint requires a company ID and verifies platform-admin privileges or a company membership on the server. A browser-provided company ID is not considered authorization.

## Information pipeline
`HTTPS feed -> collector -> pending review -> translation in tg/ru/en -> human approval -> optional TTS -> per-company/language MP3 folders -> configured AutoDJ playlists -> public stream`

The collector does not republish arbitrary external content automatically. The editor must verify source terms, factual accuracy, translations and broadcast suitability.

## Music rights pipeline
Track metadata is stored alongside the artist, composer, license, proof reference, rights holder, commercial and streaming permissions, and expiry. A record is considered eligible only when required fields pass the software gate. Human legal/rights review remains necessary.

## Deployment
Docker Compose runs PostgreSQL, API and collector. The TTS output directory is mounted as a persistent volume and must be shared/mapped into the proper AzuraCast station media folders. Each company/language folder must be assigned to an AutoDJ playlist. See [DEPLOYMENT.md](DEPLOYMENT.md).

## Security
Parameterized SQL, scrypt password hashes, HMAC-signed expiring tokens, company membership checks, login throttling, body-size limits, HTTPS-only RSS, basic private-host rejection and audit logs are included. Production still requires TLS/reverse proxy, network egress restrictions, backups, WAF/rate limiting, secret rotation and operational monitoring.

## Known boundaries
No hosted services, AzuraCast instance, voice vendor, domain, certificates, media assets, or music permissions are supplied. Auto-translation and in-dashboard binary upload are not included. These are deployment/provider-dependent integrations, not operationally enabled by default.
