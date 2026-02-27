FROM node:20-alpine

WORKDIR /app

# Copy shared package first
COPY shared /shared

# Install dependencies
COPY backend/package*.json ./
RUN npm install

# Copy source code
COPY backend/ .

# Build TypeScript
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
