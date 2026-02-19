# Stage 1: Install dependencies
FROM node:22.14.0-alpine AS deps
WORKDIR /frontend

# We are building from the ROOT context, so we point to the frontend subfolder
COPY frontend/package*.json ./
# Give the 'node' user ownership of the directory so it can write to it
RUN chown -R node:node /frontend
USER node

RUN npm ci --legacy-peer-deps

# Stage 2: Build the application
FROM node:22.14.0-alpine AS builder
WORKDIR /frontend
COPY --from=deps --chown=node:node /frontend/node_modules ./node_modules
# Copy all frontend source code from the subfolder
COPY --chown=node:node frontend/ .

# #Provide variables for build process
# Sets MongoDB connection string for build-time usage.
ENV MONGODB_URI=mongodb://admin:admin@mongo:27017/senior_project?authSource=admin
# Disables Next.js telemetry in this stage.
ENV NEXT_TELEMETRY_DISABLED=1
# Sets Node environment to production for the build.
ENV NODE_ENV=production

# Builds the Next.js app
USER node
RUN npm run build

# Stage 3: Production runner (The 'frontend' target for Compose)
FROM node:22.14.0-alpine AS frontend
WORKDIR /frontend

# Sets production mode for runtime.
ENV NODE_ENV=production
# Disables telemetry at runtime.
ENV NEXT_TELEMETRY_DISABLED=1

# Copy only the compiled output to keep the image small
# Copies built Next.js output.
COPY --from=builder --chown=node:node /frontend/.next ./.next
# Copies production dependencies.
COPY --from=builder --chown=node:node /frontend/node_modules ./node_modules
# Copies package.json for npm start
COPY --from=builder --chown=node:node /frontend/package.json ./package.json

# Install bash
RUN apk add --no-cache bash

USER node

EXPOSE 3000
CMD ["npm", "start"]