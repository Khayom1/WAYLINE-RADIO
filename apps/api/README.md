# API service

The API is the Node.js HTTP service backed by PostgreSQL. Set `DATABASE_URL` and a unique random `JWT_SECRET` of at least 32 characters before starting.

At startup, the service applies all unapplied SQL files in `database/migrations/` in filename order using an advisory lock and the `schema_migrations` table, unless `AUTO_MIGRATE=false`.

The API serves the listener and admin web applications, public station/announcement endpoints, authenticated company-scoped administration, managed audio uploads and the same-origin `/stream/:slug` proxy. The Icecast service and FFmpeg broadcaster are separate Compose services. See [API.md](../../docs/API.md), [ARCHITECTURE.md](../../docs/ARCHITECTURE.md), [BROADCASTING.md](../../docs/BROADCASTING.md), [DEPLOYMENT.md](../../docs/DEPLOYMENT.md) and [SECURITY.md](../../docs/SECURITY.md).
