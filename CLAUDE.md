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

## Architecture Overview

This is a Next.js AI chatbot application built with:

- **Framework**: Next.js 15 with App Router and React Server Components
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: NextAuth.js v5 (beta)
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

Uses NextAuth.js with:

- Custom authentication providers
- Guest access mode
- Session management via SessionProvider
- Protected routes via middleware

### Chat Streaming

Implements real-time chat streaming using:

- Vercel AI SDK's streaming capabilities
- Resumable streams for SSR
- SSE endpoints for real-time updates
- Message part system for complex content

### Environment Variables

Required environment variables (see .env.local):

- `POSTGRES_URL` - Database connection string
- `NEXTAUTH_URL` - Application URL for auth
- `NEXTAUTH_SECRET` - Auth secret
- AI provider API keys (OpenAI, Mistral, XAI)

## Code Style and Conventions

- **Linting**: Uses Biome for linting and formatting
- **TypeScript**: Strict mode enabled with path aliases (@/\*)
- **Styling**: Tailwind CSS with custom theme
- **Components**: Radix UI + shadcn/ui pattern
- **Database**: Drizzle ORM with PostgreSQL
- **Testing**: Playwright for E2E tests

## Important Notes

- The project uses `pnpm` as the package manager
- Database migrations are managed through Drizzle Kit
- The application supports both private and public chat visibility
- Message system supports attachments and structured content parts
- Real-time streaming requires proper session management
- **Always run `npx tsc` after completing tasks to ensure TypeScript type safety**
