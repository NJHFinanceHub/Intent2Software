FROM node:20-alpine

WORKDIR /app

# Copy root workspace config + all workspace packages
COPY package.json package-lock.json ./
COPY shared/ ./shared/
COPY backend/ ./backend/
# Frontend dir needed for workspace resolution but not used
RUN mkdir -p frontend && echo '{"name":"@intent-platform/frontend","version":"1.0.0"}' > frontend/package.json

# Install workspace dependencies
RUN npm install --workspace=shared --workspace=backend

# Build shared package (CJS + ESM)
RUN cd shared && npm run build

EXPOSE 3000

WORKDIR /app/backend
CMD ["npx", "tsx", "watch", "src/index.ts"]
