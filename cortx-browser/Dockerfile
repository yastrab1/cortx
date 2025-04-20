FROM mcr.microsoft.com/playwright:v1.43.0-jammy

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install
RUN npx playwright install chromium --with-deps

COPY . .
ENV GOOGLE_GENERATIVE_AI_API_KEY=AIzaSyCVarjrsqlmhZkOxN2UwQUfTGlyQG8mxbU
EXPOSE 3000
CMD ["npx", "tsx", "index.ts"]
