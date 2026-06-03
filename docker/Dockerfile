# Build static export (Next.js output: 'export') → serve with nginx
FROM oven/bun:alpine AS deps

WORKDIR /app

COPY package.json bun.lock ./

RUN bun install --frozen-lockfile

FROM oven/bun:alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_KNOWLEDGE_API_BASE_URL

ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_KNOWLEDGE_API_BASE_URL=$NEXT_PUBLIC_KNOWLEDGE_API_BASE_URL
ENV NODE_OPTIONS=--max-old-space-size=8192

RUN bun run build

FROM nginx:alpine AS runner

RUN apk add --no-cache curl

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/out /usr/share/nginx/html

ENV PORT=3000
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
