FROM node:18-alpine

WORKDIR /app

# Copy package files first
COPY package*.json ./
COPY webpack.config.js ./

# Install dependencies
RUN npm install

# Create necessary directories
RUN mkdir -p src/contexts

# Copy all source files
COPY . .

# Move ThemeContext to correct location
RUN mv contexts/ThemeContext.jsx src/contexts/

# Debug: List files
RUN ls -la src/contexts/

# Build React app
RUN npm run build

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "start"]