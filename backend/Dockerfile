FROM node:22-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY app ./app
COPY config ./config
COPY routes ./routes
COPY database ./database
COPY index.js ./index.js
EXPOSE 5000
CMD ["npm", "start"]