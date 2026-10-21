# Practical 11: Default Dockerfile (Backend Service)
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY server.js ./
COPY models/ ./models/
COPY middleware/ ./middleware/
COPY services/ ./services/
COPY events/ ./events/
COPY public/ ./public/
COPY .env.example ./.env.example

ENV PORT=5000
ENV NODE_ENV=production
ENV DOCKER_CONTAINER=true

EXPOSE 5000

CMD ["node", "server.js"]
