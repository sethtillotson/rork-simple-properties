FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev --no-audit --no-fund
COPY server.js ./
EXPOSE 8082
ENV PORT=8082
ENV DEMO_MODE=false
CMD ["node", "server.js"]
