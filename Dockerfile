FROM oven/bun:alpine AS base

# Stage 1: Install dependencies
FROM base AS deps
WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++ 

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Stage 2: Build the application
FROM base AS builder
WORKDIR /app

# Build arguments - all environment variables available during build
ARG POSTGRES_URL
ENV POSTGRES_URL=$POSTGRES_URL
ARG BETTER_AUTH_SECRET
ENV BETTER_AUTH_SECRET=$BETTER_AUTH_SECRET
ARG BETTER_AUTH_URL
ENV BETTER_AUTH_URL=$BETTER_AUTH_URL
ARG REDIS_URL
ENV REDIS_URL=$REDIS_URL
ARG BLOB_READ_WRITE_TOKEN
ENV BLOB_READ_WRITE_TOKEN=$BLOB_READ_WRITE_TOKEN
ARG MISTRAL_API_KEY
ENV MISTRAL_API_KEY=$MISTRAL_API_KEY
ARG GOOGLE_CLIENT_ID
ENV GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID
ARG GOOGLE_CLIENT_SECRET
ENV GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET
ARG TAVILY_API_KEY
ENV TAVILY_API_KEY=$TAVILY_API_KEY

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

# Stage 3: Production server
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["bun", "server.js"]