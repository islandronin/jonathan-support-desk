# Architecture

## Database (Convex schema)

All tables are defined in `convex/schema.ts`. Auth tables (`users` is overridden,
plus the standard `authAccounts`, `authSessions`, etc. from `@convex-dev/auth`)
are spread in via `...authTables`.

| Table | Indexes | Purpose |
|---|---|---|
| `users` | `by_email`, `by_role` | Account record. `role` is one of `customer` \| `agent` \| `admin`. `emailConfirmed` flag for inbound-email account creation. |
| `products` | `by_slug`, `by_active` | Product catalog. Each ticket belongs to one product; `slug` drives `/support/[slug]` routes. |
| `agentProducts` | `by_agent`, `by_product` | Join table: which agents handle which products. Drives ticket assignment + agent visibility. |
| `tickets` | `by_customer`, `by_status`, `by_assignedAgent`, `by_product`, `by_ticketNumber` | Top-level ticket. `ticketNumber` is human-readable, allocated from the `counters` table. Status: `open` \| `in_progress` \| `awaiting_customer` \| `resolved` \| `closed`. |
| `messages` | `by_ticket`, `by_author` | Thread of messages on a ticket. `source` is `web` \| `email` \| `api`. `isInternal` hides agent-only notes from customers. `attachments[]` references `_storage` IDs. `emailMessageId` deduplicates inbound replies. |
| `counters` | `by_name` | Monotonic counters (currently just `ticketNumber`). |

Convex's built-in `_storage` table holds attachment blobs.

## HTTP routes (`convex/http.ts`)

The Convex deployment exposes HTTP routes at `${NEXT_PUBLIC_CONVEX_SITE_URL}`.

### `POST /api/email/inbound` — SendGrid Inbound Parse webhook

Accepts `multipart/form-data` (default) or `application/json`. Body
extraction tries fields in order:

1. `text` (plain text)
2. `html` (stripped of tags via `stripHtml()`)
3. `email` (raw MIME — parsed by `extractBodyFromRawEmail()`, including
   `quoted-printable` decoding)

Loop prevention runs three checks; any match returns 200 without writing:

- `X-JonathanSupport-Origin: system` request header
- Same header inside the email's own `headers` field
- Sender email equals `SENDGRID_FROM_EMAIL`

After parsing, calls `internal.tickets.processInboundEmail`. Quoted reply
text is best-effort stripped (`stripQuotedReply()` cuts at first `On … wrote:`,
`--- Original Message ---`, `>` line, `From:`, or `Sent:` marker; if cutting
leaves nothing, original body is kept).

**Always returns 200.** SendGrid retries on 4xx/5xx, which would create
duplicates.

### `GET /api/open-tickets` — second-brain bot polling

Auth: `x-api-key` header must equal `TICKET_API_KEY` env var. Returns 401
otherwise.

Response shape (per ticket):

```json
{
  "_id": "...",
  "ticketNumber": 42,
  "subject": "...",
  "status": "open",
  "customerEmail": "...",
  "customerName": "...",
  "productName": "...",
  "productSlug": "...",
  "body": "<first message body>",
  "createdAt": 1730000000000
}
```

Backed by `internal.ticketApi.getOpenTicketsWithBody`.

### Convex Auth routes

`auth.addHttpRoutes(http)` mounts the standard `@convex-dev/auth` JWT routes
(`/api/auth/*`).

## Convex functions

### `convex/auth.ts`

Wraps `convexAuth` with a Password provider. The `createOrUpdateUser`
callback links accounts by lowercase email and defaults new accounts to
`role: "customer"`.

### `convex/tickets.ts`

| Export | Kind | Notes |
|---|---|---|
| `listProducts`, `getProductBySlug` | query | Public catalog reads |
| `listCustomerTickets`, `getTicket`, `getTicketMessages` | query | Customer-visible reads (auth-gated) |
| `listAgentTickets` | query | Filtered to `agentProducts` for the calling agent |
| `createTicket`, `addMessage` | mutation | Allocates `ticketNumber` from `counters`; sends notifications via `email.ts` |
| `updateTicketStatus`, `assignTicket`, `unassignTicket` | mutation | Agent/admin operations |
| `processInboundEmail` | internalMutation | Called from `http.ts`; finds-or-creates user by email, attaches message to existing thread when subject matches, otherwise opens a new ticket |

### `convex/admin.ts`

Admin dashboard + product/agent management. `requireAdmin()` guard pattern
runs at the top of each handler.

### `convex/users.ts`

`currentUser`, `listAgents`, `listAllUsers`, `searchByEmail`, `getUser` queries
plus `updateUserRole` mutation (admin-only).

### `convex/files.ts`

`generateUploadUrl` (mutation) + `getFileUrl` (query) wrappers around
Convex storage for ticket attachments.

### `convex/email.ts`

Outbound notifications. Two transports:

- **SendGrid:** `sendEmail()` posts to SendGrid v3 API. Stamps the
  `X-JonathanSupport-Origin: system` header for loop prevention.
- **Telegram:** posts to `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`
  with `TELEGRAM_CHAT_ID`. Skips silently if either env var is unset.

`getAgentEmails(productId)` looks up assigned agents via `agentProducts`.

### `convex/seed.ts`

`seedAdminAndCounter` and `seedProducts` are internal mutations meant to
be invoked manually from the Convex dashboard for first-time setup.

## Frontend

### Routing

- `/` — public landing
- `/login`, `/register` — auth pages
- `/support` — public product catalog
- `/support/[slug]` — product-specific landing with embedded `GuestTicketForm`
- `/(authenticated)/dashboard` — customer dashboard
- `/(authenticated)/tickets`, `/(authenticated)/tickets/[id]`, `/(authenticated)/tickets/new`
- `/(authenticated)/agent/dashboard`, `/(authenticated)/agent/tickets/[id]`
- `/(authenticated)/admin/dashboard|products|agents|settings`

`(authenticated)/layout.tsx` wraps protected routes; `RoleRedirect`
component sends users to their role-appropriate dashboard.

### State

- `ConvexClientProvider.tsx` wraps the app in `ConvexProviderWithAuth`.
- All data is fetched with `useQuery` / mutated with `useMutation`.
- No client-side state library (Redux/Zustand) — Convex reactivity covers it.

### Middleware

`src/middleware.ts` is the standard `@convex-dev/auth/nextjs/server`
middleware that enforces auth on `(authenticated)/*` routes.

## Credentials

- `.env.local` is symlinked from the main repo at
  `/Users/server/Documents/CursorProjects/jonathan-support-desk/.env.local`.
  It only holds Convex client config; secrets live in the Convex dashboard.
- Convex deployment-scoped env vars are set via the Convex dashboard
  under **Settings → Environment Variables** for the active deployment.
- SendGrid Inbound Parse is configured in the SendGrid dashboard pointing
  at `${NEXT_PUBLIC_CONVEX_SITE_URL}/api/email/inbound`.
- Telegram bot is provisioned via @BotFather; `TELEGRAM_CHAT_ID` is the
  ops-channel ID.

## Deployment pipeline

| Env | Branch | Vercel | Convex |
|---|---|---|---|
| Local | any | `npm run dev` | `npx convex dev` |
| Staging | `staging` | auto-deploy | `npx convex dev --once` against `STAGING_BRANCH` deployment |
| Production | `main` | auto-deploy | `npx convex deploy` (manual, gated) |

Project rules require staging QA before any cherry-pick to `main`. See root
`CLAUDE.md` for the worktree → staging → main flow and which git operations
need explicit approval.

## External integrations

| System | Direction | Path | Auth |
|---|---|---|---|
| SendGrid (outbound) | egress | `convex/email.ts → api.sendgrid.com/v3/mail/send` | `SENDGRID_API_KEY` |
| SendGrid Inbound Parse | ingress | `POST /api/email/inbound` | none (loop prevention only) |
| Telegram Bot API | egress | `convex/email.ts → api.telegram.org/bot.../sendMessage` | `TELEGRAM_BOT_TOKEN` |
| Second-brain bot | ingress | `GET /api/open-tickets` | `x-api-key: TICKET_API_KEY` |

## Operational gotchas

- **SendGrid inbound `text` field can be empty** even when the original email
  had a body — multipart-only mailers strip it. The fallback chain
  (text → html → raw MIME) exists for that reason. Don't simplify.
- **Quoted-printable** decoding is required for `email` (Raw MIME) field;
  base64 attachments inside MIME parts are intentionally NOT decoded — only
  the body text is extracted.
- **`/api/email/inbound` always returns 200** — checking for failures means
  reading the Convex logs, not the SendGrid event log.
- **Ticket numbers** come from a single counter row (`counters` table where
  `name = "ticketNumber"`). Concurrent ticket creation is fine because
  Convex mutations are serialized per document.
- **Agent visibility** is enforced server-side in `listAgentTickets` via
  `agentProducts`. Don't trust the frontend to filter.
- **Loop prevention** has three layers because each handles a different
  vendor's behavior — keep all three.
