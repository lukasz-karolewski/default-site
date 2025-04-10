FROM node:20-alpine AS base

# Step 1: Install dependencies and build the app
FROM base AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Step 2: Extract the standalone output
FROM base AS runner
WORKDIR /app

# Copy only the necessary files from the standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

ENV NODE_ENV=production
ENV PORT=3080
EXPOSE 3080

CMD ["node", "server.js"]
