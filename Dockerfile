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
    netcat-openbsd

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

# Create wait-for-it script
RUN echo '#!/bin/sh\n\
host="$1"\n\
port="$2"\n\
shift 2\n\
cmd="$@"\n\
\n\
until nc -z "$host" "$port"; do\n\
  echo "Waiting for $host:$port..."\n\
  sleep 1\n\
done\n\
\n\
echo "$host:$port is available"\n\
exec $cmd' > /usr/local/bin/wait-for-it.sh && \
chmod +x /usr/local/bin/wait-for-it.sh

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

# Start services using supervisor directly
CMD ["supervisord", "-c", "/etc/supervisord.conf"]