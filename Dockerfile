FROM node:18-alpine

WORKDIR /app

# Copy package files first
COPY package*.json ./
COPY webpack.config.js ./

# Install dependencies
RUN npm install

# Create necessary directories
RUN mkdir -p src/contexts

# Copy source files
COPY src/ ./src/
COPY public/ ./public/

# Debug: List files
RUN ls -la src/contexts/

# Build React app
RUN npm run build

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "start"]