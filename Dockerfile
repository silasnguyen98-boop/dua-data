# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build
COPY . .
RUN npm run build

# ── Stage 2: Production ─────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Copy built artifacts and production dependencies
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Patch server.js: process.env.HOSTNAME is the OS hostname, not our var.
# Replace it with our custom BIND_HOST (set via docker-compose environment).
RUN sed -i "s/process\.env\.HOSTNAME/process.env.BIND_HOST/" server.js

USER nextjs

EXPOSE 3000

ENV PORT=3000

CMD ["node", "server.js"]
