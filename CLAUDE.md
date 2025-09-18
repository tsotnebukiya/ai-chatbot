# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Goal

**Portfolio project for Mistral AI Software Engineer Internship application**. This chat application demonstrates full-stack development skills using Mistral AI's public API, following their best practices for submission.

### Mistral Internship Requirements

- **Mandatory**: Complete project submission with GitHub repository
- **Focus**: Chat application using Next.js with Mistral AI public API
- **Duration**: Represents 1+ hour of development work
- **Best Practices**: Detailed README, easy testing, clean code

### Key Technical Demonstrations

- **Mistral AI Integration**: Direct use of Mistral's chat API
- **Full-Stack Development**: Next.js 15, TypeScript, PostgreSQL
- **Real-time Features**: Streaming responses with AI SDK
- **Tool Augmentation**: Gmail integration and personal productivity tools
- **Production Quality**: Type safety, testing, documentation

### Testing Strategy

- **Easy to Test**: Clean project structure with clear setup instructions
- **Type Safety**: TypeScript strict mode for compile-time checks
- **Database**: Drizzle ORM with schema migrations
- **API Testing**: Well-structured API routes with proper error handling
- **Integration Testing**: Demonstrated through chat functionality

### Portfolio Differentiation

- **Mistral-Specific**: Uses Mistral AI models (not just OpenAI)
- **Practical Tools**: Real-world utility with Gmail integration
- **Modern Architecture**: Current best practices in AI application development
- **Complete Solution**: Authentication, database, real-time features

## Development Commands

### Build and Development

- `pnpm dev` - Start development server with turbo mode
- `pnpm build` - Build the production application
- `pnpm start` - Start production server
- `pnpm lint` - Run Biome linter with auto-fix
- `pnpm lint:fix` - Run Biome linter and formatter
- `pnpm format` - Run Biome formatter
- `npx tsc` - Run TypeScript type checking

### Database Operations

- `pnpm db:generate` - Generate Drizzle migrations
- `pnpm db:migrate` - Run database migrations
- `pnpm db:studio` - Open Drizzle studio for database inspection
- `pnpm db:push` - Push schema changes to database
- `pnpm db:pull` - Pull schema from database
- `pnpm db:check` - Check migration status
- `pnpm db:up` - Update database schema

### Testing

- `pnpm test` - Run Playwright tests (requires PLAYWRIGHT=True)

### Docker Development

- `docker-compose up` - Start development environment
- `docker-compose down` - Stop development environment

### Production Deployment

- **Automated CI/CD**: GitHub Actions deploy to Digital Ocean on main branch push
- **Quality Gates**: Lint/type checking required before deployment
- **Database**: Automatic migrations during deployment

## Architecture Overview

This is a Next.js AI chatbot application built with:

- **Framework**: Next.js 15 with App Router and React Server Components
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: BETTERAUTH
- **UI**: Radix UI components with Tailwind CSS and shadcn/ui
- **AI Integration**: Vercel AI SDK with support for OpenAI, Mistral, and XAI providers
- **Real-time Streaming**: Server-sent events (SSE) for chat streaming
- **File Upload**: Vercel Blob for file storage
- **Code Editor**: CodeMirror 6 with syntax highlighting

### Key Directory Structure

```
app/
├── (auth)/          # Authentication pages and API routes
├── (chat)/          # Chat interface and API routes
├── layout.tsx       # Root layout with providers
└── globals.css      # Global styles

components/
├── ui/              # Reusable UI components (shadcn/ui)
├── elements/        # Chat-specific UI elements
└── *.tsx            # Main app components

lib/
├── ai/              # AI tools and utilities
├── db/              # Database schema, queries, and migrations
└── *.ts             # Utility functions

hooks/               # Custom React hooks
```

### Database Schema

The application uses a PostgreSQL database with the following main tables:

- `User` - User authentication data
- `Chat` - Chat conversations with visibility settings
- `Message_v2` - Chat messages (supports message parts and attachments)
- `Vote_v2` - User feedback on messages
- `Document` - Document storage for various content types
- `Stream` - Real-time stream management

### Authentication

Uses BetterAuth with:

- **Email/Password Authentication**: Native credential-based login
- **Social OAuth**: Google and GitHub provider integration
- **Session Management**: Cookie-based sessions with PostgreSQL storage
- **Route Protection**: Middleware-based authentication checks
- **Database Integration**: Drizzle ORM adapter for user/session management
- **Security Features**: Rate limiting, secure cookies, CSRF protection

### Chat Streaming

Implements real-time chat streaming using:

- Vercel AI SDK's streaming capabilities
- Resumable streams for SSR
- SSE endpoints for real-time updates
- Message part system for complex content

### Environment Variables

Required environment variables (see .env.local):

- `POSTGRES_URL` - Database connection string
- `BETTER_AUTH_URL` - Application URL for auth
- `BETTER_AUTH_URL_SECRET` - Auth secret
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob storage token
- AI provider API keys (OpenAI, Mistral, XAI)

#### GitHub Secrets (Deployment)

- `DOCKERHUB_USERNAME` - Docker Hub username
- `DOCKERHUB_TOKEN` - Docker Hub access token
- `DEPLOY_HOST` - Digital Ocean droplet IP
- `DEPLOY_USER` - SSH username
- `SSH_KEY` - Private SSH key
- `POSTGRES_URL` - Production database
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob token
- `BETTER_AUTH_SECRET` - BETTERAUTH secret
- `MISTRAL_API_KEY` - Mistral AI key
- `BETTER_AUTH_URL` - Production URL

## Code Style and Conventions

- **Linting**: Uses Biome for linting and formatting
- **TypeScript**: Strict mode enabled with path aliases (@/\*)
- **Styling**: Tailwind CSS with custom theme
- **Components**: Radix UI + shadcn/ui pattern
- **Database**: Drizzle ORM with PostgreSQL
- **Testing**: Playwright for E2E tests

## Docker Configuration

- **Development**: `docker-compose.yml` with hot-reloading and local services
- **Production**: `docker-compose.prod.yml` with Docker Hub images and environment variables
- **Dockerfiles**: Multi-stage production build with security best practices
- **CI/CD**: GitHub Actions with quality gates and automatic deployment

## Important Notes

- The project uses `pnpm` as the package manager
- Database migrations use `pnpm db:push`
- Production deploys to Digital Ocean via GitHub Actions
- **Always run `npx tsc` after completing tasks to ensure TypeScript type safety**
