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

# Remove development dependencies
RUN npm prune --production

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Copy output from builder
COPY --from=builder /app/.output ./.output
# Copy prune node_modules just in case, though Nuxt output is usually standalone or bundles what it needs
# For Nuxt 3/4 nitro output, .output/server/index.mjs is the entry
# But we might need public folder if not fully embedded

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", ".output/server/index.mjs"]
