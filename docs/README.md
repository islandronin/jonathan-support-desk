# Jonathan Support Desk

A multi-tenant customer support desk for Jonathan Green's product portfolio.
Customers submit tickets via the web or by emailing a product-specific
address; agents triage and respond in-app; admins manage products and
agent assignments.

## Tech Stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind v4
- **Backend:** [Convex](https://convex.dev) (database, queries, mutations, scheduled actions, HTTP routes, file storage)
- **Auth:** `@convex-dev/auth` Password provider, role-based (`customer` | `agent` | `admin`)
- **Email:** SendGrid (outbound notifications + Inbound Parse webhook)
- **Notifications:** Telegram bot (new-ticket alerts to ops channel)
- **Markdown:** `react-markdown` + `remark-gfm` for ticket message rendering
- **Icons:** `lucide-react`
- **Deployment:** Vercel (frontend) + Convex Cloud (backend)

## Repository Layout

```
.
├── src/
│   ├── app/                          Next.js App Router
│   │   ├── (authenticated)/          Routes that require auth
│   │   │   ├── admin/                Admin dashboard, products, agents, settings
│   │   │   ├── agent/                Agent dashboard + ticket detail
│   │   │   ├── tickets/              Customer ticket list, detail, new
│   │   │   ├── dashboard/            Customer dashboard
│   │   │   └── layout.tsx
│   │   ├── login/                    Login page
│   │   ├── register/                 Register page
│   │   ├── support/                  Public landing + per-product page
│   │   ├── ConvexClientProvider.tsx  Wraps app in ConvexProviderWithAuth
│   │   ├── SearchBar.tsx
│   │   ├── layout.tsx                Root layout, Inter font
│   │   └── page.tsx                  Public landing
│   ├── components/
│   │   ├── layout/                   Navbar, RoleRedirect
│   │   ├── tickets/                  GuestTicketForm, MessageThread, AttachmentUpload, MarkdownBody
│   │   └── ui/                       StatusBadge, LoadingSpinner, EmptyState
│   ├── lib/
│   └── middleware.ts                 Convex auth middleware
├── convex/
│   ├── schema.ts                     Database tables (see docs/architecture.md)
│   ├── auth.ts                       Auth config + createOrUpdateUser
│   ├── auth.config.ts                JWT issuer config
│   ├── http.ts                       Inbound email + open-tickets HTTP routes
│   ├── tickets.ts                    Ticket CRUD + processInboundEmail
│   ├── admin.ts                      Admin queries/mutations (products, agents, dashboard)
│   ├── users.ts                      User queries + role updates
│   ├── files.ts                      Storage upload URLs
│   ├── email.ts                      SendGrid outbound + Telegram notifications
│   ├── ticketApi.ts                  Internal query for the open-tickets endpoint
│   ├── seed.ts                       Admin/counter seed + product seed
│   └── _generated/                   Convex codegen (committed)
├── public/                           Static assets
├── graphify-out/                     Knowledge graph (see ./graphify.md or graphify-out/GRAPH_REPORT.md)
└── .claude/settings.json             PreToolUse hook that points future sessions at the graph
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Symlink or copy `.env.local` from the main repo. Required variables:

| Var | Used by | Purpose |
|---|---|---|
| `CONVEX_DEPLOYMENT` | Convex CLI | Selects deployment for `npx convex dev` |
| `NEXT_PUBLIC_CONVEX_URL` | Browser | Convex client connection URL |
| `NEXT_PUBLIC_CONVEX_SITE_URL` | Browser | Convex site URL for HTTP routes |

Backend-only env vars (set in Convex dashboard, not `.env.local`):

| Var | Used by | Purpose |
|---|---|---|
| `CONVEX_SITE_URL` | `auth.config.ts` | JWT issuer domain for Convex Auth |
| `APP_URL` | `email.ts` | Base URL used in outbound email links |
| `SENDGRID_API_KEY` | `email.ts` | SendGrid API auth |
| `SENDGRID_FROM_EMAIL` | `email.ts`, `http.ts` | Sender address (also used for inbound loop prevention) |
| `SENDGRID_FROM_NAME` | `email.ts` | Sender display name |
| `TELEGRAM_BOT_TOKEN` | `email.ts` | Telegram bot for new-ticket alerts |
| `TELEGRAM_CHAT_ID` | `email.ts` | Telegram chat to post into |
| `TICKET_API_KEY` | `http.ts` `/api/open-tickets` | Bearer key required by external pollers |

### 3. Run dev

```bash
npx convex dev   # in one terminal
npm run dev      # in another
```

Open http://localhost:3000.

### 4. Seed (first-time only)

The `seed.ts` file exposes `seedAdminAndCounter` and `seedProducts` as
internal mutations — run them once via the Convex dashboard's Functions tab.

## Deployment

- **Frontend:** Vercel auto-deploys from `main` (production) and `staging`.
- **Backend:** `npx convex dev --once` deploys functions to the configured
  deployment. Production uses `npx convex deploy` (gated — see project rules).
- **SendGrid:** Inbound Parse points at `https://<convex-site>/api/email/inbound`.

## Per-session housekeeping

- Read `graphify-out/GRAPH_REPORT.md` before grepping the codebase.
- After structural code changes, run `graphify update .` (AST-only, no API cost).
- See root `CLAUDE.md` for the Archive Protocol used at end-of-session.

## Further reading

- [`docs/architecture.md`](./architecture.md) — schema, HTTP routes, data flow, deploy pipeline
