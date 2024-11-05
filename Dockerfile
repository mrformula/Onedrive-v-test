FROM node:18-alpine

WORKDIR /app

# Copy package files first
COPY package*.json ./
COPY webpack.config.js ./

# Install dependencies
RUN npm install

# Copy source files
COPY src/ ./src/
COPY public/ ./public/

# Build React app
RUN npm run build

# Copy rest of the files
COPY . .

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "start"]