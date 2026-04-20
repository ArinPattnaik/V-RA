FROM node:20-slim

WORKDIR /app

COPY package*.json ./
ENV NODE_ENV=production
RUN npm install --production

COPY . .

EXPOSE 3001

CMD ["node", "server.js"]
