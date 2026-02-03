# Stage 1: Build
FROM maven:3.9.6-eclipse-temurin-17-alpine AS build
WORKDIR /app

# Copy the backend source and the hidden settings folder explicitly
COPY backend/ ./backend/
# Double-check the path below matches where .m2 is on your WSL host
COPY backend/.m2 ./backend/.m2 

# Run Maven from the root using the specific path
RUN mvn -s backend/.m2/settings.xml clean package -DskipTests -f backend/pom.xml
# Stage 2: Run
FROM eclipse-temurin:17-jre-alpine AS backend

RUN apk update && apk upgrade && apk add --no-cache ffmpeg

WORKDIR /app
COPY --from=build /app/target/backend.jar .

CMD ["java", "-jar", "backend.jar"]

FROM build AS test
