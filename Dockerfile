# syntax=docker/dockerfile:1.6
############################################################
# 1️⃣  deps – install *all* dependencies
############################################################
FROM node:20-alpine AS deps
WORKDIR /app

# Global pnpm (cached layer)
RUN npm i -g pnpm@10.6.5

# Copy lockfiles / manifests and install dev + prod deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile        # dev deps needed for build

############################################################
# 2️⃣  build – compile the Next.js application
############################################################
FROM node:20-alpine AS build
WORKDIR /app

# pnpm CLI for this stage
RUN npm i -g pnpm@10.6.5

# Bring in dependencies and source code
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build (creates .next/)
RUN pnpm run build

############################################################
# 3️⃣  runtime – minimal image to serve the app
############################################################
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=3000

# Copy build artifacts and only the pruned prod deps
COPY --from=build /app/.next       ./.next
COPY --from=build /app/public      ./public
COPY --from=deps  /app/node_modules ./node_modules
COPY --from=deps  /app/package.json ./package.json

# Optional: prune dev-deps to shrink the image
RUN npm i -g pnpm@10.6.5 && pnpm prune --prod

EXPOSE 3000

# ⬇️ Start the built-in Next.js server (Option A)
CMD ["node_modules/.bin/next", "start", "-p", "3000"]
