FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- runtime ----
FROM node:20-alpine AS runtime
WORKDIR /app

# Install minimal runtime tools for HEALTHCHECK
RUN apk add --no-cache curl

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

# Install prod-only deps
RUN npm ci --omit=dev

# Only copy runtime assets if required
COPY --from=builder /app/drizzle ./drizzle

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -fs http://localhost:4000/health || exit 1

CMD ["node", "dist/index.js"]
