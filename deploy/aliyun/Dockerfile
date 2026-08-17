FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY server.js server-bridge.js index.html styles.css app.js ./
COPY vendor ./vendor
RUN mkdir -p /data/uploads
EXPOSE 8080
CMD ["node", "--no-warnings", "server.js"]