FROM node:18-alpine

WORKDIR /app

# Copy all files first
COPY . .

# Install dependencies
RUN npm install

# Build React app
RUN npm run build

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "start"]