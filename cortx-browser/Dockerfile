FROM mcr.microsoft.com/playwright:v1.43.0-jammy

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install
RUN npx playwright install chromium --with-deps

COPY . .
EXPOSE 3000
CMD ["npx", "tsx", "index.ts"]
