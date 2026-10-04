FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY server.js server-bridge.js meeting-rules.js schedule-rules.js schedule-ui.js schedule-recognition.js schedule-recognition-ui.js schedule-ocr-server.js index.html styles.css app.js ./
COPY scripts ./scripts
COPY deploy/aliyun/scripts/backup.js ./scripts/backup.js
COPY vendor ./vendor
RUN apk add --no-cache tesseract-ocr tesseract-ocr-data-chi_sim tesseract-ocr-data-eng && mkdir -p /data/uploads
EXPOSE 8080
CMD ["node", "--no-warnings", "server.js"]
