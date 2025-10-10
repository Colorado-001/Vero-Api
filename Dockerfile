# ---- Base Stage ----
FROM node:22-alpine AS base

# Set working directory
WORKDIR /usr/src/app

# Install dependencies (only production for smaller image)
COPY package*.json ./
RUN npm ci --omit=dev

# ---- Build Stage (for TypeScript projects) ----
FROM node:22-alpine AS build

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

# Copy source code and build
COPY . .
RUN npm run build

# ---- Production Stage ----
FROM node:22-alpine AS prod

WORKDIR /usr/src/app

# Copy built code and production deps
COPY --from=base /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist
COPY package*.json ./

# Set environment
ENV NODE_ENV=production

# Start the app
CMD ["node", "dist/main.js"]
