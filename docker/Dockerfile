# Build static export (Next.js output: 'export') → serve static files
FROM oven/bun:alpine AS deps

WORKDIR /app

COPY package.json bun.lock ./

RUN bun install --frozen-lockfile

FROM oven/bun:alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_API_BASE_URL

ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NODE_OPTIONS=--max-old-space-size=8192

RUN bun run build

FROM oven/bun:alpine AS runner

RUN apk add --no-cache curl

WORKDIR /app

COPY --from=builder /app/out ./out

ENV PORT=3333
EXPOSE 3333

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3333/ || exit 1

# -s: SPA fallback (tương đương nginx try_files → index.html)
CMD ["bunx", "serve@latest", "out", "-s", "-l", "3333"]
