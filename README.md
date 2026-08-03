# AutoPilot — Social Media Automation

A Next.js dashboard that connects your social accounts once and automates what comes after: drafting and scheduling posts, turning GitHub activity into LinkedIn posts, and handling Instagram DM/comment replies with an AI-assisted draft-and-approve inbox.

**Status:** actively in development. Some integrations listed below are fully working end-to-end (LinkedIn, GitHub, Instagram); others are UI placeholders not wired up yet (see [Not Yet Implemented](#not-yet-implemented)).

---

## 1. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) + React 19, served behind a thin Express wrapper (`app.js`) |
| Database | MongoDB via Mongoose |
| Job queue | BullMQ + Redis (`ioredis`) — used for GitHub → AI post-draft generation |
| App auth | NextAuth.js (Google login) |
| Platform auth | Hand-rolled OAuth 2.0 flows per platform (LinkedIn, GitHub, Instagram) |
| AI | OpenAI SDK pointed at an NVIDIA NIM endpoint (`nvidia/nemotron-3-ultra-*` by default) — used for post drafting and auto-reply drafting |
| News source | [newsdata.io](https://newsdata.io/) |
| Styling / motion | Tailwind CSS 4, `motion` (Framer Motion), GSAP, Lenis |

The Express wrapper exists only to expose a `/express-health` check and to keep webhook request bodies unparsed (Next.js API routes read the raw stream themselves to verify signatures) — everything else is handled by Next's own request handler.

---

## 2. What's Actually Implemented

### 2.1 Account Connections
Real OAuth 2.0 connect/disconnect flows for:
- **LinkedIn** — connect, disconnect, status check, and actual publishing
- **GitHub** — connect, disconnect, status check, and a webhook listener
- **Instagram** — connect, disconnect, status check, DM/comment webhook, and a Graph API reply sender

The product is intentionally focused on LinkedIn, Instagram, WhatsApp, and GitHub.

### 2.2 Create Post / Scheduled Posts
- Manual composer writes a post and either publishes immediately or schedules it for a future time.
- **Only LinkedIn actually publishes right now** — every other platform's publish route (`/api/share/[platform]`) returns `"Posting to {platform} isn't available yet."` by design, so nothing silently fails or fakes success.
- Scheduling isn't a real cron: `app.js` runs an in-process `setInterval` every 60 seconds that hits `/api/cron`, which publishes any post whose `scheduled_time` has passed. A `CRON_SECRET` can gate that endpoint if it's called externally instead (e.g. a hosting platform's cron).
- Posts auto-expire 10 days after creation via a MongoDB TTL index (`lib/post-retention-config.js`), and a periodic cleanup also drains any stale BullMQ jobs.

### 2.3 GitHub → AI Draft Pipeline
1. GitHub sends a webhook (push / PR) to `/api/auth/github/webhook`.
2. The event is enqueued as a BullMQ job (`lib/queue.js`).
3. A worker (`lib/working.js`) picks it up, calls the NVIDIA-backed model (`lib/postgenerator.js`) to draft a LinkedIn-style post from the commit/PR context, and saves it as a **draft** `Post` (status `draft`) — it is *not* auto-published. The user reviews and schedules/publishes it manually.

### 2.4 Tech News Feed
- `/api/news` proxies newsdata.io for a query.
- The user picks an article from the feed and schedules it (`/api/news/schedule`); it becomes a normal `Post` with `source: "tech_news"` and goes through the same LinkedIn-only publish path as any other scheduled post. There's no fully-automatic "post news every morning" job yet.

### 2.5 Instagram Auto-Reply (Draft Inbox + Optional Auto-Send Agent)
This is the most built-out feature. Flow for every incoming DM/comment:

1. **Webhook in** (`/api/auth/instagram/webhook`) — Instagram delivers the event; the sender's profile is looked up via the Graph API.
2. **Deterministic gatekeeping** (`lib/auto-reply-rules.js`, no AI involved) — spam pattern match, contact-filter eligibility, excluded keywords, business-hours window, and a rolling 24h per-contact reply limit. Any of these can short-circuit the draft to `needs_review` or `blocked`.
3. **Fast-path templates** — greetings, small talk, and FAQ-shaped messages are matched by regex and answered from a template (tone/emoji/sign-off configurable per user), with confidence recorded as 100%.
4. **AI fallback for anything unclear** — a single one-shot call to the NVIDIA model returns `{action, draft, confidence, reason}` as JSON. If confidence is below the user's configured threshold, it's routed to a human instead of auto-sent.
5. **Draft Inbox** (`/dashboard/socials/instagram`) — every draft (ready, needs-review, or blocked) lands here, grouped by conversation, with a confidence-percentage badge per message. From here a human can approve, reject, or edit any draft (editing clears the confidence badge, since it no longer reflects AI-generated text) — singly or in bulk.
6. **Optional full auto-send** — if the account owner has both the auto-reply agent and Instagram platform permission enabled in Settings, any draft that comes back `tone: "ready"` is sent immediately via the Graph API without waiting for approval. Anything less certain always waits for a human.

### 2.6 Auto-Reply Settings
Per-user configuration (`/dashboard/auto-reply`, backed by `AutoReplySettings`) covers: enable/disable the agent, tone, AI semantic analysis toggle, spam filtering, per-platform send permission, contact filtering (mutual connections / verified only), keyword exclusions, human-fallback confidence threshold, and response style (emoji usage, length, greeting style, sign-off, link/CTA policy, max replies per contact per 24h, business-hours awareness).

### 2.7 Feedback
Logged-in users can submit feedback (`/dashboard/feedback` → `POST /api/feedback`), stored per user in MongoDB.

---

## 3. Data Model (MongoDB / Mongoose)

| Collection | Purpose |
|---|---|
| `users` | App account (email, name, plan, timezone) |
| `connected_accounts` | One per (user, platform) OAuth connection — tokens, profile snapshot |
| `preferences` | Default tone, auto-reply toggle, news sources, posting time |
| `posts` | Manual/scheduled/GitHub-draft/news posts; TTL-expires 10 days after creation |
| `post_platforms` | Per-platform publish status for a post |
| `instagram_drafts` | One row per DM/comment: message, AI draft, confidence, tone, status (pending/approved/rejected/sent) |
| `auto_reply_settings` | Per-user auto-reply configuration (see 2.6) |
| `auto_reply_logs` | Record of replies actually sent |
| `auto_reply_rules` | Legacy keyword→template rules (superseded by `auto_reply_settings` + the rule engine) |
| `github_events` | GitHub webhook events linked to the draft post they generated |
| `analytics` | Per-post engagement snapshots (likes/comments/shares) |
| `feedback` | User-submitted feedback messages |

---

## 4. Environment Variables

Set these in a local `.env` (never commit real values — `.env*` is gitignored).

| Variable | Used for |
|---|---|
| `MONGODB_URI`, `MONGODB_DB` | MongoDB connection |
| `REDIS_URL` | BullMQ job queue |
| `PORT`, `HOSTNAME` | Local server binding |
| `NEXTAUTH_URL`, `NEXTAUTH_SECRET` | NextAuth session handling |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | App login (NextAuth Google provider) |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | GitHub OAuth connect |
| `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` | LinkedIn OAuth connect + publish |
| `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET`, `INSTAGRAM_WEBHOOK_VERIFY_TOKEN`, `INSTAGRAM_REPLIED_ACCESSTOKEN` | Instagram OAuth (native "Instagram API with Instagram Login" flow), webhook verification, sender profile lookups |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | WhatsApp webhook verification only — no connect flow or message processing exists yet |
| `NVIDIA_API_KEY`, `NVIDIA_BASE_URL`, `NVIDIA_MODEL`, `NVIDIA_TEMPERATURE`, `NVIDIA_TOP_P`, `NVIDIA_MAX_TOKENS`, `NVIDIA_REASONING_BUDGET` | AI drafting (posts + auto-replies) |
| `NEWS_API_KEY` | newsdata.io tech news feed |
| `CRON_SECRET` | Optional bearer/query auth for `/api/cron` |

---

## 5. Getting Started

```bash
npm install
npm run dev
```

Requires a reachable MongoDB instance and Redis instance (both referenced via env vars above). `npm run dev` starts the combined Express + Next.js server (`app.js`) via nodemon, which also boots the BullMQ worker and the internal scheduled-post poller.

Health checks:
- `GET /api/health` — app + MongoDB
- `GET /express-health` — MongoDB + Redis status from the Express layer

---

## 6. Not Yet Implemented

- Publishing surfaces outside LinkedIn, Instagram, WhatsApp, and GitHub are intentionally out of scope.
- Billing / Free vs Pro plan enforcement — the "Upgrade to Pro" button is a placeholder.
- Fully automatic (no-human-pick) daily tech news posting.
- Analytics ingestion from the actual platform APIs (the `analytics` collection exists but nothing currently writes real engagement data into it).
