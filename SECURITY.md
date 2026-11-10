# Security Policy

## Supported version

Security fixes are applied to the latest code on the default branch. Deployments should use a reviewed, pinned commit and keep Node.js and PostgreSQL supported and patched.

## Reporting a vulnerability

Do not publish credentials, private feed URLs, personal data, or an exploitable vulnerability in a public issue. Use GitHub's private vulnerability reporting for this repository when available. Include:
- affected commit or release;
- impact and realistic attack scenario;
- minimal reproduction steps;
- suggested mitigation, if known.

Please allow maintainers reasonable time to investigate and release a fix before public disclosure.

## Deployment requirements

- Set a unique random `JWT_SECRET` with at least 32 characters.
- Use a strong database password and TLS for remote database connections.
- Keep `.env`, database dumps, audio files, API keys, and admin credentials out of Git.
- Serve production traffic only over HTTPS.
- Restrict database network access to the API and worker.
- Review every music license and feed source before use.
- Do not expose PostgreSQL directly to the public internet.

## Scope

The RSS collector accepts HTTPS feeds and applies URL/IP checks. Network-level egress filtering is still recommended because DNS answers can change between validation and connection. The application is not a substitute for a hardened network boundary.
