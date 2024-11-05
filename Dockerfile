FROM node:18-alpine

WORKDIR /app

# Copy all files
COPY . .

# Install dependencies
RUN npm install

# Create necessary directories
RUN mkdir -p src/contexts

# Move ThemeContext to correct location if it exists
RUN if [ -f "contexts/ThemeContext.jsx" ]; then \
    mv contexts/ThemeContext.jsx src/contexts/; \
    fi

# Debug: List files
RUN ls -la src/contexts/

# Build React app
RUN npm run build

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "start"]