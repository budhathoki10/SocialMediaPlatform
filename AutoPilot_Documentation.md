# AutoPilot — Social Media Automation SaaS
### Full Project Documentation

---

## 1. Project Overview

**AutoPilot** is a SaaS (Software as a Service) web platform that automates a user's entire social media and developer presence. Once a user connects their accounts and sets their preferences during a one-time onboarding process, the platform runs on its own — posting content, replying to comments, sharing tech news, and broadcasting GitHub activity — with no further manual effort required.

**One-line description:**
> A dashboard where users connect LinkedIn, Twitter/X, Instagram, GitHub, Reddit, and Dev.to once, and the app automatically posts, replies, and shares content forever — on autopilot.

---

## 2. The Problem It Solves

| Problem | How AutoPilot Solves It |
|---|---|
| Posting consistently on social media takes daily effort | App posts automatically based on saved preferences |
| Developers want to share their work but forget to | GitHub activity is auto-posted to LinkedIn |
| Replying to every comment takes time | AI generates and posts replies automatically |
| Staying updated with tech news and sharing it takes effort | App fetches news daily and posts it with an AI caption |
| Managing 5+ platforms separately is exhausting | Everything is managed from a single dashboard |

---

## 3. Who This Is For

- Developers who want to build a personal brand without spending time on it
- Content creators managing multiple platforms
- Small businesses wanting consistent online presence
- Anyone who wants "set it and forget it" social media management

---

## 4. Core Features

### 4.1 Account Connections
Users connect any combination of: LinkedIn, Twitter/X, Instagram, GitHub, Reddit, Dev.to — using OAuth 2.0 (secure login via the platform itself, no passwords stored).

### 4.2 One-Time Onboarding
A 4-step setup wizard:
1. Connect platforms
2. Set posting preferences (tone, auto-reply, news sources)
3. Choose plan (Free or Pro)
4. Done — redirected to dashboard

### 4.3 Tech News Auto-Posting
- Fetches latest articles from HackerNews, TechCrunch, Dev.to, ProductHunt
- AI generates a caption automatically
- Posts to selected platforms at the user's chosen time daily

### 4.4 GitHub Activity Broadcasting
- Listens to GitHub webhooks (push, PR opened, PR merged, new repo)
- Automatically posts a summary to LinkedIn, e.g. *"Just pushed 3 commits to project-x 🚀"*

### 4.5 Auto-Reply to Comments
- Detects new comments on a user's posts via platform webhooks/APIs
- AI generates a reply matching the user's chosen tone
- Posts the reply automatically

### 4.6 AI Caption Generator
- User provides a topic
- AI writes a ready-to-post caption, optimized per platform

### 4.7 Manual Post Composer
- Write once, select multiple platforms, post now or schedule
- Live preview of how the post will look on each platform

### 4.8 Analytics Dashboard
- Tracks posts published, engagement, top platform, time saved
- Charts: posts per day, engagement comparison, platform breakdown

---

## 5. Free vs Pro Plan

| Feature | Free | Pro |
|---|---|---|
| Connected platforms | 2 | Unlimited |
| Scheduled posts/month | 5 | Unlimited |
| Tech news auto-post | 1/day | Unlimited, custom sources |
| AI captions/month | 10 | Unlimited |
| Auto-reply bot | ❌ | ✅ |
| GitHub automation | ❌ | ✅ |
| Multi-platform posting | ❌ | ✅ |
| Analytics | Basic | Full + export |
| Price | $0 | $12/month or $99/year |

---

## 6. How Automation Actually Works (Behind the Scenes)

### 6.1 Scheduled / Queued Posts
```
User writes post + picks time
        ↓
Saved to PostgreSQL database
        ↓
BullMQ creates a job in Redis with that exact timestamp
        ↓
Background worker triggers at that time
        ↓
Worker calls the relevant platform's API
        ↓
Post goes live → status updated to "Published"
```

### 6.2 Fully Automatic Events (No Queue Needed)
```
GitHub push happens
        ↓
GitHub sends a webhook to AutoPilot's server instantly
        ↓
Server formats a message ("Just pushed X commits...")
        ↓
Posts immediately to LinkedIn via API
```

The same instant pattern applies to auto-replies (new comment → webhook → AI reply → post reply).

### 6.3 Daily Recurring Jobs (Tech News)
A cron job runs every day at the user's chosen time:
```
Cron triggers at 9:00 AM
        ↓
Fetch latest articles from news APIs
        ↓
AI generates a caption for the top article
        ↓
Post to user's selected platforms
```

---

## 7. Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React + Tailwind CSS | Dashboard UI |
| Charts | Recharts | Analytics graphs |
| Backend | Node.js + Express | API server, business logic |
| Job Queue | BullMQ + Redis | Scheduling and background jobs |
| Database | PostgreSQL | Users, posts, schedules, analytics |
| Cache | Redis | API response caching, rate-limit protection |
| Auth (platforms) | OAuth 2.0 | Connect LinkedIn/Twitter/GitHub/etc. securely |
| Auth (app) | JWT | User login session for AutoPilot itself |
| AI | OpenAI API | Caption generation, auto-replies |
| News Sources | HackerNews API, RSS (TechCrunch, Dev.to, ProductHunt) | Tech news feed |
| Payments | Stripe | Free vs Pro subscriptions |
| Hosting | Vercel (frontend) + Railway/Render (backend) | Deployment |

---

## 8. Required Accounts & Setup Before Starting

Before development begins, the following accounts/API keys are needed:

| Service | Why Needed | Free Tier Available? |
|---|---|---|
| LinkedIn Developer App | OAuth + posting API | Yes |
| Twitter/X Developer App | OAuth + posting API | Limited free tier |
| GitHub OAuth App | Connect GitHub + webhooks | Yes |
| Instagram (via Meta Developer) | OAuth + posting | Yes |
| Reddit App (script type) | OAuth + posting | Yes |
| Dev.to API Key | Publish articles | Yes |
| OpenAI API Key | AI captions/replies | Paid (small cost) |
| Stripe Account | Payments | Yes (test mode free) |
| Redis instance (Upstash) | Queue + cache | Yes (free tier) |
| PostgreSQL (Supabase/Neon) | Database | Yes (free tier) |

---

## 9. System Architecture Diagram (Text Form)

```
                ┌─────────────┐
                │   React UI   │
                │  (Frontend)  │
                └──────┬──────┘
                       │ REST API
                ┌──────▼──────┐
                │  Node.js +   │
                │   Express    │
                └──┬───┬───┬──┘
       ┌───────────┘   │   └────────────┐
       ▼                ▼                ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ PostgreSQL  │  │   Redis +    │  │  External    │
│ (Users,     │  │   BullMQ     │  │  APIs:       │
│  Posts,     │  │ (Job Queue + │  │ LinkedIn,    │
│  Schedules) │  │  Cache)      │  │ Twitter,     │
└─────────────┘  └─────────────┘  │ GitHub, etc. │
                                    └─────────────┘
```

---

## 10. Database Schema (Simplified)

| Table | Key Fields |
|---|---|
| **users** | id, email, password_hash, plan, created_at |
| **connected_accounts** | id, user_id, platform, access_token, refresh_token |
| **posts** | id, user_id, content, platforms[], status, scheduled_time |
| **preferences** | user_id, tone, auto_reply_enabled, news_sources[] |
| **auto_reply_logs** | id, user_id, platform, comment, reply, timestamp |
| **github_events** | id, user_id, repo, event_type, posted_at |
| **analytics** | id, user_id, platform, post_id, engagement_count |

---

## 11. Development Roadmap (Time-Separated)

> **Total Estimated Time: 8–10 weeks** (working consistently, part-time pace)

### Week 1 — Foundation Setup
- Set up Node.js + Express backend
- Set up React + Tailwind frontend
- Set up PostgreSQL database and define schema
- Set up Redis instance
- Build basic JWT login/signup for AutoPilot itself

### Week 2 — OAuth Integrations (Part 1)
- Implement GitHub OAuth (easiest to start with)
- Implement LinkedIn OAuth
- Store access tokens securely in database
- Build "Connected Accounts" UI

### Week 3 — OAuth Integrations (Part 2)
- Implement Twitter/X OAuth
- Implement Reddit and Dev.to API key connections
- Implement Instagram via Meta Developer setup
- Finish onboarding wizard (4-step flow) UI

### Week 4 — Manual Post Composer
- Build post creation UI (text + media upload)
- Implement "Post Now" functionality calling each platform's API
- Build live preview component per platform

### Week 5 — Scheduling System
- Integrate BullMQ + Redis for job queue
- Build "Schedule Post" feature with date/time picker
- Build worker process that publishes posts at scheduled time
- Build Scheduled Posts page (calendar + list view)

### Week 6 — AI Integration
- Connect OpenAI API
- Build AI caption generator (topic → caption)
- Build AI auto-reply generator
- Add tone selection (Professional/Casual/Technical/Humorous)

### Week 7 — Automation Features
- Build tech news fetcher (HackerNews, TechCrunch, Dev.to RSS)
- Build daily cron job for auto-posting news
- Build GitHub webhook listener for activity broadcasting
- Build auto-reply listener (comment detection → AI reply → post)

### Week 8 — Analytics Dashboard
- Build analytics data collection (track posts, engagement)
- Build charts using Recharts (line chart, bar chart, donut chart)
- Build "Recent Activity" timeline feed

### Week 9 — Payments & Plan Limits
- Integrate Stripe for Free vs Pro subscriptions
- Implement feature gating (limit posts, hide Pro features for Free users)
- Build Settings → Billing page

### Week 10 — Polish, Testing & Deployment
- Fix bugs, test all automation flows end-to-end
- Add loading states, empty states, error handling
- Deploy frontend to Vercel, backend to Railway/Render
- Final testing with real connected accounts

---

## 12. Suggested Build Order (Priority Tips)

1. Start with **GitHub OAuth + GitHub automation** — it's the easiest API to work with and gives you a working demo fast.
2. Build the **manual post composer** before the scheduler — get posting working first, automation second.
3. Save **AI features** for the middle phase — they're quick wins once the core post-sending works.
4. Leave **Stripe/payments** for last — get the product working fully before adding paywalls.
5. Test with **your own accounts first** before inviting other testers.

---

## 13. Summary

AutoPilot is a real, launchable SaaS product that automates social media presence end-to-end. It combines OAuth integrations, background job processing, AI content generation, real-time webhooks, and subscription billing — covering nearly every skill expected of a modern full-stack developer, while also being a genuine business opportunity.

**Motto:** *Set it once. AutoPilot handles the rest.*
