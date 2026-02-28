FROM node:20-alpine

WORKDIR /app

# Copy root workspace config + all workspace packages
COPY package.json package-lock.json ./
COPY shared/ ./shared/
COPY frontend/ ./frontend/
# Backend dir needed for workspace resolution but not used
RUN mkdir -p backend && echo '{"name":"@intent-platform/backend","version":"1.0.0"}' > backend/package.json

# Install workspace dependencies
RUN npm install --workspace=shared --workspace=frontend

# Build shared package (CJS + ESM)
RUN cd shared && npm run build

EXPOSE 5173

WORKDIR /app/frontend
CMD ["npx", "vite", "--host", "0.0.0.0"]
