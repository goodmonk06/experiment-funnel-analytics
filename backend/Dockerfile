FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY packages/sdk-node/package*.json ./packages/sdk-node/ 2>/dev/null || true
COPY packages/sdk-browser/package*.json ./packages/sdk-browser/ 2>/dev/null || true

# Install dependencies
RUN npm ci --workspace=backend

# Build stage
FROM base AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/backend/node_modules ./backend/node_modules

# Copy source code
COPY backend ./backend
COPY package*.json ./

# Generate Prisma client
WORKDIR /app/backend
RUN npx prisma generate

# Build application
RUN npm run build

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 fastify

# Copy built application
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/package*.json ./
COPY --from=builder /app/backend/prisma ./prisma

USER fastify

EXPOSE 3001

ENV PORT 3001

CMD ["node", "dist/index.js"]
