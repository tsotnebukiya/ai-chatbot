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

# Build arguments for database connection during build
ARG POSTGRES_URL
ENV POSTGRES_URL=${POSTGRES_URL}

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
CMD ["bun", "run", "server.js"]