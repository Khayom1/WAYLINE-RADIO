# Security baseline

- Passwords use Node.js scrypt with per-user random salts.
- Admin sessions are HMAC-signed and time-limited. Set a long random `JWT_SECRET` (32+ characters).
- Company membership is checked server-side on every admin request. The company ID supplied by the client is never treated as authorization.
- SQL values use parameterized queries.
- Login attempts are rate-limited in-process; use an edge/WAF rate limiter in multi-instance production.
- RSS collection accepts HTTPS only, rejects private/local hostnames and IPs, blocks redirects, and limits response size/time. For hostile environments, add DNS pinning / network egress controls at the infrastructure layer.
- Uploaded files are not accepted by this MVP. Use a private object-storage bucket and signed uploads before enabling user uploads.
- Only verified, unexpired tracks with explicit commercial and streaming permissions are eligible. Human review of the actual license and its scope remains mandatory.
- Keep database backups, TLS termination, secret rotation and monitoring outside the application process.
- Do not expose database credentials, JWT secrets, or media-server API keys in frontend code.
