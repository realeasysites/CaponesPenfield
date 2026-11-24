# Capone's Italian Eatery — Penfield, NY

Website for Capone's Italian Eatery (1811 Penfield Rd, Penfield, NY 14526). Built by [Real Easy Sites](https://getrealeasysites.com).

## Stack
Node 20+ · Express · SQLite (better-sqlite3 12.11.1). Server-rendered pages, no build step.

- `/` home · `/menu` full menu · `/catering` catering request form · `/admin` dashboard
- Menu and settings are seeded once from `data/menu.json` and `data/site.json`, then edited in the dashboard.
- Online ordering, delivery, rewards, gift cards and the app link out to the restaurant's existing ordering system (links editable in the dashboard).

## Dashboard (`/admin`)
Password-only login. Tabs: **Catering requests** (status + delete), **Menu** (edit / add / remove items), **Hours & links** (top banner, hours, order links, phone, email).

## Environment
| Var | Purpose |
| --- | --- |
| `ADMIN_PASSWORD` | Dashboard password (required) |
| `SESSION_SECRET` | Optional cookie signing secret |
| `DB_PATH` | SQLite path (use a persistent disk in production, e.g. `/var/data/capones.db`) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `NOTIFY_EMAIL` | Optional email alert on new catering requests |

## Run
```
npm install
ADMIN_PASSWORD=yourpass npm start
```
