# Stage 1: Build
FROM maven:3.9.6-eclipse-temurin-17-alpine AS build
# Move directly into the backend directory so Maven sees a standard layout
WORKDIR /app/backend

# 1. Copy the pom.xml to the current directory (/app/backend/pom.xml)
COPY backend/pom.xml .

# 2. Copy the src folder to the current directory (/app/backend/src)
COPY backend/src ./src

# 3. Run Maven from the current directory (no -f needed now)
RUN mvn clean package -DskipTests

# Stage 2: Run
FROM eclipse-temurin:17-jre-alpine AS backend

# Install production dependencies and git for potential debugging. ffmpeg is needed for video processing.
RUN apk update && apk upgrade && apk add --no-cache ffmpeg git

WORKDIR /app

# 4. Correct the path to find the JAR file. 
# Maven builds the JAR in the 'target' folder relative to where the pom.xml is.
COPY --from=build /app/backend/target/*.jar ./backend.jar

EXPOSE 8080

CMD ["java", "-jar", "backend.jar"]