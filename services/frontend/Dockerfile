# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Copy output from builder
COPY --from=builder --chown=node:node /app/.output ./.output

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Switch to non-root user
USER node

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", ".output/server/index.mjs"]
