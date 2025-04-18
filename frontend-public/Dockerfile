# Build Stage
FROM node:18-alpine as build-stage

WORKDIR /app

COPY frontend-public/package*.json ./
RUN npm install

COPY frontend-public .
RUN npm run build

# Production Stage
FROM nginx:alpine as production-stage

COPY --from=build-stage /app/dist /usr/share/nginx/html

# Optional: Replace default nginx config


EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
