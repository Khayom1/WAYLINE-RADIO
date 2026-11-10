# Security baseline

- Passwords use Node.js scrypt with per-user random salts.
- Admin sessions are HMAC-signed and time-limited. Set a long random `JWT_SECRET` (32+ characters).
- Company membership is checked server-side on every admin request. The company ID supplied by the client is never treated as authorization.
- SQL values use parameterized queries; database schema changes use ordered, advisory-locked migrations.
- Login attempts are rate-limited in-process; use an edge/WAF rate limiter in multi-instance production.
- JSON request bodies and audio uploads have explicit size limits.
- Managed audio uploads are signature-checked, stored under generated private filenames and normalized by FFmpeg before the broadcaster can use them.
- RSS collection accepts credential-free HTTPS only, pins validated public DNS answers, rejects private/reserved addresses and redirects, and limits response size/time. Network egress filtering is still recommended.
- Browser responses include restrictive content/security headers. Keep the API behind Caddy or another correctly configured TLS reverse proxy.
- Only verified, unexpired tracks with explicit commercial and streaming permissions and a managed audio file are eligible. Human review of the actual license and its scope remains mandatory.
- Keep database backups, TLS termination, secret rotation, monitoring and incident response outside the application process.
- Do not expose database credentials, JWT secrets, Icecast source credentials, TTS API keys or media-server admin keys in frontend code.
- Do not expose PostgreSQL or the Icecast source/admin interface directly to the public internet.
