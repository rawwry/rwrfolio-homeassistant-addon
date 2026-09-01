ARG BUILD_FROM=ghcr.io/home-assistant/amd64-base:latest
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Install dependencies (including build tools for Vite/TypeScript)
RUN npm install

# Copy project source
COPY . .

# Build frontend and bundled backend server
RUN npm run build

# Make sure share, config and data directories exist
RUN mkdir -p /share/rwrfolio/db /share/rwrfolio/imported /config /app/data

# Environment
ENV NODE_ENV=production
ENV DATABASE_PATH=/share/rwrfolio/db/rwrfolio.db
ENV IMPORTED_CSV_PATH=/share/rwrfolio/imported
ENV PORT=3000

# Expose port
EXPOSE 3000

# Start compiled server
CMD ["node", "dist/server.cjs"]
