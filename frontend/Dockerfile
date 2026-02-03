# Stage 1: Install dependencies
FROM node:22.14.0-alpine AS deps
WORKDIR /frontend

# We are building from the ROOT context, so we point to the frontend subfolder
COPY frontend/package*.json ./
RUN npm install --legacy-peer-deps

# Stage 2: Build the application
FROM node:22.14.0-alpine AS builder
WORKDIR /frontend
COPY --from=deps /frontend/node_modules ./node_modules
# Copy all frontend source code from the subfolder
COPY frontend/ . 
#Provide variables for build process
ENV MONGODB_URI=mongodb://admin:admin@mongo:27017/senior_project?authSource=admin
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Stage 3: Production runner (The 'frontend' target for Compose)
FROM node:22.14.0-alpine AS frontend
WORKDIR /frontend

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy only the compiled output to keep the image small
COPY --from=builder /frontend/public ./public
COPY --from=builder /frontend/.next ./.next
COPY --from=builder /frontend/node_modules ./node_modules
COPY --from=builder /frontend/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"]