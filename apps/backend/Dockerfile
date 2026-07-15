# Stage 1: Install dependencies
FROM node:22 AS dependencies
WORKDIR /usr/src/app

# Install pnpm
RUN npm install -g pnpm
RUN npm install -g tsx

COPY package.json pnpm-lock.yaml* .npmrc* ./
COPY prisma ./prisma/ 

RUN pnpm install --frozen-lockfile
RUN pnpm exec prisma generate

# Stage 2: Builder
FROM node:22 AS builder
WORKDIR /usr/src/app

# Install pnpm in this stage as well
RUN npm install -g pnpm

# Copy dependencies (including generated prisma client)
COPY --from=dependencies /usr/src/app/node_modules ./node_modules

# Copy the entire source code, which includes the prisma directory
COPY . . 
# After this 'COPY . .', /usr/src/app/prisma should exist in this 'builder' stage

# Optional: If your build process specifically needs Prisma Client types regenerated with full source
# RUN pnpm exec prisma generate 

RUN pnpm run build
RUN ls -la /usr/src/app/prisma 
RUN ls -la /usr/src/app/
# Stage 3: Runner - Production image
FROM node:22 AS runner
WORKDIR /usr/src/app

ENV NODE_ENV production
# Install OpenSSL 1.1 for Prisma
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN npm install -g tsx
# RUN addgroup -S appgroup && adduser -S appuser -G appgroup
# USER appuser

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/src ./src
COPY --from=dependencies /usr/src/app/node_modules ./node_modules

# Now, copy prisma from the builder stage where it was copied by 'COPY . .'
COPY --from=builder /usr/src/app/prisma ./prisma 
COPY --from=builder /usr/src/app/package.json ./
COPY --from=builder /usr/src/app/pnpm-lock.yaml ./
EXPOSE 8080
CMD ["node", "dist/index.js"]