# Android / Termux validation

This workflow validates the repository on an Android phone without requiring a local desktop computer.

## 1. Install dependencies

```sh
pkg update
pkg install nodejs-lts git
cd ~/WAYLINE-RADIO
npm install
```

Node.js 20 or newer is required.

## 2. Static checks

```sh
npm run check
npm test
```

These checks do not require PostgreSQL, a radio stream, or API credentials.

## 3. API integration

The API requires PostgreSQL. On a phone, use a trusted remote PostgreSQL instance rather than trying to run a production database inside Termux.

Set environment variables in the current shell (do not commit them):

```sh
export DATABASE_URL='postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require'
export PGSSLMODE=require
export JWT_SECRET="$(node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))")"
export PORT=8080
npm start
```

Open a second Termux session and check:

```sh
curl -i http://127.0.0.1:8080/api/v1/health
curl -i http://127.0.0.1:8080/
curl -i http://127.0.0.1:8080/admin
curl -i http://127.0.0.1:8080/api/v1/public/stations
curl -i http://127.0.0.1:8080/api/v1/public/announcements
```

## 4. Browser checks

Open the local listener and admin pages in the Android browser. Check all three languages, narrow-screen layout, API sign-in, company switching, and station selection.

## 5. External dependencies still required

Termux alone cannot prove production readiness. Separately validate:
- PostgreSQL availability, migration, backup and restore;
- a real Icecast/AzuraCast-compatible stream URL;
- audio playback over mobile data and Wi-Fi;
- feed collector behavior against trusted public feeds;
- TLS, DNS and firewall rules;
- music license evidence and actual broadcast permissions.

Do not publish a station as live until the real stream has been tested.
