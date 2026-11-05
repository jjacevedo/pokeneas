FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# URL base de las imágenes en S3; se puede sobrescribir al crear el servicio
ENV PORT=80

EXPOSE 80

CMD ["node", "src/server.js"]
