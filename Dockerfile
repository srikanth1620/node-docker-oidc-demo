# Multi-stage Dockerfile for Node.js app

# ===== Builder Stage =====
FROM node:18-alpine AS builder
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the app (if you have a build step)
RUN npm run build --if-present

# ===== Production Stage =====
FROM node:18-alpine

WORKDIR /app

# Copy only necessary files from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app ./

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S -u 1001 -G nodejs nodeuser

USER nodeuser

EXPOSE 8080

# Start the app
CMD ["npm", "start"]