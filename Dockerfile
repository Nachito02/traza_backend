FROM node:22-bookworm-slim AS builder

WORKDIR /app

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma

# Avoid running postinstall before source/schema are in place.
RUN npm ci --ignore-scripts

COPY tsconfig.json prisma.config.ts ./
COPY src ./src

# Generate only Prisma Client in CI/container builds (skip ERD/DBML generators).
RUN npx prisma generate --generator client
RUN npm run build

# Prisma client is generated under src/generated/prisma and is not emitted by tsc.
RUN mkdir -p dist/generated && cp -R src/generated/prisma dist/generated/prisma

FROM node:22-bookworm-slim AS runner

WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --include=dev --ignore-scripts && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

RUN mkdir -p uploads

EXPOSE 8080

CMD ["sh", "-c", "PORT=${PORT:-8080} node dist/server.js"]
