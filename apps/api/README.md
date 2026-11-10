# API service

See [API.md](../../../docs/API.md), [SECURITY.md](../../../docs/SECURITY.md) and the root README. The service is a Node.js HTTP API backed by PostgreSQL. Set `DATABASE_URL` and `JWT_SECRET` before starting. It applies `database/migrations/001_initial.sql` on startup unless `AUTO_MIGRATE=false`.
