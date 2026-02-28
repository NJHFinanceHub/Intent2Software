# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/ ./shared/
COPY backend/ ./backend/
RUN mkdir -p frontend && echo '{"name":"@intent-platform/frontend","version":"1.0.0"}' > frontend/package.json
RUN npm install --workspace=shared --workspace=backend
RUN cd shared && npm run build
RUN cd backend && npm run build

# Stage 2: Production
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/shared/package.json ./shared/
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/package.json ./backend/
RUN npm install --workspace=shared --workspace=backend --omit=dev
EXPOSE 3000
CMD ["node", "backend/dist/index.js"]
