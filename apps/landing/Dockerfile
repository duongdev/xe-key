# Build from the repo root: docker build -f apps/landing/Dockerfile .
FROM node:24-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH NEXT_TELEMETRY_DISABLED=1
RUN corepack enable
WORKDIR /repo

FROM base AS prune
COPY . .
RUN pnpm dlx turbo@2.11.10 prune @xekey/landing --docker

FROM base AS build
# Public key, inlined into the client bundle at build. The secret key never goes here.
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY
# Site origin (e.g. https://xekey.app) and public contact email; the build fails without them.
ARG SITE_URL
ARG CONTACT_EMAIL
COPY --from=prune /repo/out/json/ ./
COPY --from=prune /repo/.npmrc ./
RUN pnpm install --frozen-lockfile --ignore-scripts
COPY --from=prune /repo/out/full/ ./
RUN pnpm --filter @xekey/landing build

FROM node:24-slim AS run
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=build --chown=node:node /repo/apps/landing/.next/standalone ./
COPY --from=build --chown=node:node /repo/apps/landing/.next/static ./apps/landing/.next/static
COPY --from=build --chown=node:node /repo/apps/landing/public ./apps/landing/public
USER node
EXPOSE 3000
CMD ["node", "apps/landing/server.js"]
