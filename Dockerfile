FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
# next.config.ts bakes the /api rewrite target (API_URL) and the public site
# URL (metadataBase, sitemap, robots) into the build, so both must be set here.
ARG API_URL
ARG NEXT_PUBLIC_SITE_URL
ENV API_URL=$API_URL NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ARG API_URL
ARG NEXT_PUBLIC_SITE_URL
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Runtime copies for server components (lib/server-api.ts reads API_URL per
# request); `docker run -e API_URL=…` can still override it.
ENV API_URL=$API_URL NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
