# ─── Stage 1: build ──────────────────────────────────────────────────────────
FROM oven/bun:1.3-alpine AS builder

WORKDIR /app

# Install all deps (devDeps are needed for the Vite/TanStack build)
COPY package.json bun.lock bunfig.toml ./
RUN bun install --frozen-lockfile

# Copy source and build
COPY . .
RUN bun run build

# ─── Stage 2: production ─────────────────────────────────────────────────────
FROM oven/bun:1.3-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
# Coolify injects PORT; default to 3000
ENV PORT=3000

# Install only runtime dependencies (no devDeps)
COPY package.json bun.lock bunfig.toml ./
RUN bun install --production --frozen-lockfile

# Copy the built output from the builder stage
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["bun", "dist/server/server.js"]
