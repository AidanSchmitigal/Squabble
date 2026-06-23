# Dockerfile

FROM node:24-alpine

RUN npm install -g pnpm

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build:all

EXPOSE 7766
CMD ["pnpm", "start:all"]