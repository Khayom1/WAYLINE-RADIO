# Contributing to WAYLINE RADIO

WAYLINE RADIO is an open-source, multilingual radio platform for transport and logistics teams.

## Languages

User-facing interface and announcement workflows must preserve all three languages:
- Tajik (`tg`)
- Russian (`ru`)
- English (`en`)

When adding visible interface text, add translations for all three languages in the same change.

## Development requirements

- Node.js 20 or newer.
- PostgreSQL 16 for API integration.
- Keep secrets and real music files out of commits.
- Use parameterized SQL for database queries.
- Scope every company-owned query by the authenticated company ID.
- Enforce permissions using the selected company's membership role.
- Never bypass music-rights checks for convenience.

## Checks

```sh
npm install
npm run check
npm test
```

For API integration, configure `DATABASE_URL` and a random `JWT_SECRET`, apply the migration, then run `npm start`.

## Pull requests

Include a concise problem statement, implementation summary, screenshots for UI changes, test output, and any migration or deployment notes. Do not claim a real stream works unless it has been tested against a configured streaming server.
