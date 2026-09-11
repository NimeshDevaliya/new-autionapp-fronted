# Cricket Auction Admin

Next.js 16 admin panel for running live cricket player auctions, managing
squads across seasons and following tournament statistics. Talks to the
`auction-backend` API, which runs as its own project.

## Requirements

- Node.js 22+
- The API running and reachable (default `http://localhost:3005`)

## Setup

```bash
npm install
cp .env.example .env.local
```

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Base URL of the API, e.g. `http://localhost:3005/api` |
| `NEXT_PUBLIC_WS_URL` | WebSocket URL, e.g. `ws://localhost:3005/ws` |

Both are public by design — no secret belongs in this app. Authentication is a
bearer token issued by the API and held in `localStorage`.

## Running

```bash
npm run dev     # http://localhost:3000
npm run build
npm start
```

Sign in with the credentials created by the API's seed script
(`admin@medianv.com` / `Admin@12345` in development).

## Checks

```bash
npm run typecheck
npm run lint
npm run build
```

## Structure

```
src/
├── app/
│   ├── login/            sign-in
│   └── (admin)/          authenticated shell: dashboard, auctions,
│                         tournaments, teams, players, results,
│                         statistics, admins, settings
├── components/
│   ├── ui/               button, field, panel, table, modal, badge,
│   │                     tabs, avatar, states
│   ├── auction/          bid panel, team purse card, player card, bid history
│   └── layout/           admin shell, global search
├── hooks/                auth, auction socket, toast mutation
├── lib/
│   ├── api/              one module per API resource
│   ├── api-client.ts     axios instance, token handling, error normalising
│   └── query-keys.ts     single source of truth for cache keys
└── types/                API response types
```

## Conventions

- **Server state lives in TanStack Query**, never in global client state. Query
  keys come from `lib/query-keys.ts` so invalidation always matches.
- **Mutations go through `useToastMutation`**, which reports success or failure
  as a toast and invalidates the affected keys.
- **Every screen handles four states**: loading, error with a retry, empty, and
  loaded. A failed request never leaves a blank page.
- **Forms use React Hook Form with Zod resolvers.** Server-side validation
  errors come back per-field and are shown inline.
- Money is quoted in lakhs and rendered with `formatMoney()`, which rolls over
  to crore at 100.

## Live auction screen

The console keeps itself current over a WebSocket: when the server reports a
change, the auction state is refetched, so every open screen follows the same
bidding without reloads. If the socket drops it reconnects with backoff and
falls back to polling in the meantime — the header shows which is in use.

Layout is three columns on desktop, two on tablet and stacked on phones, with
touch-sized controls throughout.

## Design

Dark-first, because auctions run on a projector in a dim room. Colour tokens
are defined in `app/globals.css`: `ink` for the page, `surface` steps for
panels, and four semantic hues — `amber` for money and the live bid, `pitch`
for sold, `ball` for unsold, `sky` for information. Team colours are treated as
data, never decoration. Type is Barlow Condensed for figures and Barlow for UI,
with tabular numerals anywhere numbers change.
