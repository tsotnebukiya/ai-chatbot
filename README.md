# AI Chatbot

A production‑ready AI chatbot built with **Next.js 15**, **Vercel AI SDK**, and **Mistral**—with optional tools, auth, and one‑command self‑hosting.

## Project Overview

Enhanced Vercel AI SDK chatbot with Mistral integration, tool augmentation, and automated self‑hosting.

## Key Features

- **🤖 Mistral**: `mistral-large-latest` (conversations), `magistral-medium-2506` (complex reasoning), `mistral-small-latest` (title generation)
- **🔧 Tools**: Gmail (read/send/list), Web Search (Tavily), Weather (current conditions)
- **🔐 Auth**: BetterAuth (email/password, Google OAuth w/ refresh), secure sessions in PostgreSQL
- **🚀 Runtime**: streaming responses, resumable SSR streams, file uploads (Vercel Blob), message persistence (PostgreSQL)
- **🏠 Ops**: Dockerized, Nginx reverse proxy, Let’s Encrypt TLS, health checks & monitoring

## Technology Stack

Next.js 15 (App Router, RSC) • TypeScript (strict) • Vercel AI SDK • Mistral API • Drizzle ORM + PostgreSQL • BetterAuth • Radix UI + shadcn/ui + Tailwind • Bun • Docker/Compose • Nginx (SSL/TLS)

## Vercel Deployment

1. **Import** the repo into Vercel (Framework: Next.js).
2. **Set env vars** (table below). Use your Vercel URL for `BETTER_AUTH_URL` (e.g., `https://your-app.vercel.app`).
3. **Provision** PostgreSQL; optionally Redis for resumable streams. Deploy.

### Environment Variables

| Variable                                    | Required | Purpose                                                |
| ------------------------------------------- | -------- | ------------------------------------------------------ |
| `POSTGRES_URL`                              | Yes      | PostgreSQL connection (chat history, user data)        |
| `BETTER_AUTH_URL`                           | Yes      | App URL for BetterAuth callbacks (e.g., Vercel URL)    |
| `BETTER_AUTH_SECRET`                        | Yes      | Token signing secret (e.g., `openssl rand -base64 32`) |
| `MISTRAL_API_KEY`                           | Yes      | Mistral API access for chat                            |
| `REDIS_URL`                                 | Optional | Enables **resumable streaming context**                |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Optional | **Google OAuth (BetterAuth)** and **Gmail tool**       |
| `TAVILY_API_KEY`                            | Optional | **Web Search** tool                                    |
| `BLOB_READ_WRITE_TOKEN`                     | Optional | **File attachments** in AI chat (Vercel Blob)          |

## Self‑Hosting Deployment

### Prerequisites

- Ubuntu 22.04+ server
- Domain name pointing to the server

### Quick Start

```bash
ssh root@your_server_ip
curl -o ~/deploy.sh https://raw.githubusercontent.com/tsotnebukiya/ai-chatbot/main/scripts/deploy.sh
chmod +x ~/deploy.sh
./deploy.sh
```

When prompted, provide: domain, Let’s Encrypt email, **Mistral API key**, and optionally Google OAuth keys, Tavily API key, Vercel Blob token.

> **Important**: In `next.config.ts`, ensure `output: 'standalone'` is enabled for self‑hosting.

### What the Deployment Script Does

- **System**: installs Docker/Compose, configures 1GB swap, opens HTTP/HTTPS firewall rules
- **TLS**: obtains Let’s Encrypt certs, sets HTTPS redirect, auto‑renewal
- **App**: clones repo, generates envs, builds & starts containers, runs migrations, configures health checks

### Architecture (Self‑hosted)

- **Next.js app**: multi‑stage Docker build with standalone output
- **PostgreSQL**: persistent storage + health checks
- **Redis** (optional): caching/enhanced streaming
- **Migration service**: separate container for schema updates
- **Nginx**: SSL termination, rate limiting
- **Network isolation**: custom Docker network

### Update

```bash
curl -o ~/update.sh https://raw.githubusercontent.com/tsotnebukiya/ai-chatbot/main/scripts/update.sh
chmod +x ~/update.sh
./update.sh
```

## Important Configuration Notes

- **Database**: Drizzle ORM (type‑safe), automatic migrations on deployment; schemas in `lib/db/schema.ts`

## License

MIT.
