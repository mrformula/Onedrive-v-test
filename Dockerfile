FROM node:18-alpine

# Install required packages
RUN apk add --no-cache \
    python3 \
    py3-pip \
    qbittorrent-nox \
    rclone \
    fuse \
    curl \
    wget \
    git \
    build-base \
    supervisor \
    netcat-openbsd \
    bash

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY webpack.config.js ./

# Install dependencies
RUN npm install

# Copy all source files
COPY . .

# Build React app
RUN npm run build

# Copy supervisor configuration
COPY supervisord.conf /etc/supervisord.conf

# Create necessary directories
RUN mkdir -p /mnt/gdrive /downloads /var/log

# Set permissions
RUN chmod -R 777 /mnt/gdrive /downloads /var/log

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=30s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Expose ports
EXPOSE 3000 8080

# Start services using supervisor
CMD ["supervisord", "-c", "/etc/supervisord.conf"]