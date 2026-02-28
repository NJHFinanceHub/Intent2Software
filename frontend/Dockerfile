# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/ ./shared/
COPY frontend/ ./frontend/
RUN mkdir -p backend && echo '{"name":"@intent-platform/backend","version":"1.0.0"}' > backend/package.json
RUN npm install --workspace=shared --workspace=frontend
RUN cd shared && npm run build
RUN cd frontend && npm run build

# Stage 2: Production
FROM nginx:alpine
COPY --from=builder /app/frontend/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
