# Build Stage
FROM node:18-alpine as build-stage

WORKDIR /app

COPY frontend-admin/package*.json ./
RUN npm install

COPY frontend-admin .
RUN npm run build

# Production Stage
FROM nginx:alpine as production-stage

COPY --from=build-stage /app/dist /usr/share/nginx/html

# Optional: Replace default nginx config
COPY frontend-admin/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
