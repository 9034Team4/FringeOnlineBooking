# Use Node.js LTS as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files and install deps
COPY backend/package*.json ./
RUN npm install --production

# Copy source code
COPY backend .

# Expose backend port
EXPOSE 3000

# Run backend
CMD ["node", "index.js"]
