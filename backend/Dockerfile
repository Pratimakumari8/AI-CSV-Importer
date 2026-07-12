FROM node:20-alpine

WORKDIR /app

# Install dependencies first for better layer caching
COPY package*.json ./
RUN npm ci --omit=dev

# Copy the rest of the application
COPY . .

ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "server.js"]
