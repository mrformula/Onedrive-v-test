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
    supervisor

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY . .

# Copy supervisor configuration
COPY supervisord.conf /etc/supervisord.conf

# Create necessary directories
RUN mkdir -p /mnt/gdrive /downloads

# Set permissions
RUN chmod -R 777 /mnt/gdrive /downloads

# Environment variables
ENV GOOGLE_CLIENT_ID=your_client_id
ENV GOOGLE_CLIENT_SECRET=your_client_secret
ENV GOOGLE_REDIRECT_URI=https://your-domain.com/auth/google/callback
ENV MOUNT_PATH=/mnt/gdrive
ENV DOWNLOAD_PATH=/downloads
ENV QB_USERNAME=admin
ENV QB_PASSWORD=adminadmin

# Expose ports
EXPOSE 3000 8080

# Start services using supervisor
CMD ["supervisord", "-c", "/etc/supervisord.conf"] 