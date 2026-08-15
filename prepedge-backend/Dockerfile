FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw
RUN ./mvnw dependency:go-offline -q
COPY src ./src
RUN ./mvnw package -DskipTests -q

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
# JVM tuned for Render free tier (512MB RAM):
# -Xms128m  = start heap at 128MB
# -Xmx350m  = max heap 350MB (leaves room for OS + metaspace)
# G1GC = better throughput under concurrent exam load
# XX:+UseContainerSupport = respect Docker container memory limits
ENTRYPOINT ["java", \
  "-Xms128m", "-Xmx350m", \
  "-XX:+UseG1GC", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=70.0", \
  "-XX:+OptimizeStringConcat", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]
