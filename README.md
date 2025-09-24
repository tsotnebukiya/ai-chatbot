# AI Chatbot

Next.js AI chatbot application with Mistral AI integration, featuring real-time chat streaming, authentication, and database persistence.

## Features

- Real-time chat with streaming responses
- User authentication with BetterAuth
- PostgreSQL database with Drizzle ORM
- File upload support with Vercel Blob
- Gmail integration and productivity tools
- Responsive UI with shadcn/ui components

## Self Host

### Prerequisites

- Linux Ubuntu server (tested on Ubuntu 22.04+)

### Quickstart

1. SSH into your server:

   ```bash
   ssh root@your_server_ip
   ```

2. Download and run the deployment script:

   ```bash
   curl -o ~/deploy.sh https://raw.githubusercontent.com/tsotnebukiya/ai-chatbot/main/scripts/deploy.sh
   chmod +x ~/deploy.sh
   ./deploy.sh
   ```

3. The script will:
   - Install Docker and Docker Compose
   - Set up swap space for memory management
   - Clone the repository
   - Prompt for API keys (Vercel Blob, Mistral)
   - Generate secure passwords and secrets
   - Build and start all services
   - Configure database migrations

### Updating

To update your deployment with the latest changes:

```bash
curl -o ~/update.sh https://raw.githubusercontent.com/tsotnebukiya/ai-chatbot/main/scripts/update.sh
chmod +x ~/update.sh
./update.sh
```

### Architecture

The deployment includes:

- **Next.js Application**: Multi-stage Docker build with standalone output
- **PostgreSQL Database**: Persistent storage with health checks
- **Redis Cache**: In-memory caching with persistence
- **Migration Service**: Separate container for database migrations
- **Network Isolation**: Custom Docker network for service communication

### Environment Variables

The deployment script automatically generates:

- Database credentials (random password)
- BetterAuth secret (32-byte base64)
- BetterAuth URL (auto-detected public IP)
- Prompts for external API keys securely

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: BetterAuth
- **UI**: shadcn/ui + Tailwind CSS
- **AI**: Vercel AI SDK
- **Package Manager**: Bun
- **Containerization**: Docker + Docker Compose

## License

MIT
