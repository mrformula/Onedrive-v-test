FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY webpack.config.js ./

# Install dependencies and build
RUN npm install
RUN npm run build

# Copy rest of the files
COPY . .

EXPOSE 3000

CMD ["npm", "start"]