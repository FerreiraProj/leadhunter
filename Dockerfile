# syntax=docker/dockerfile:1

# ---- Build stage ----
FROM node:20-alpine AS builder
WORKDIR /app

# Build-time only vars: Vite bakes VITE_* into the client bundle at build time,
# so they must be available as ARGs (not just runtime env vars) during `npm run build`.
ARG VITE_LOGIN_EMAIL
ARG VITE_LOGIN_PASSWORD
ENV VITE_LOGIN_EMAIL=$VITE_LOGIN_EMAIL
ENV VITE_LOGIN_PASSWORD=$VITE_LOGIN_PASSWORD

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Production stage ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "dist/server.cjs"]
