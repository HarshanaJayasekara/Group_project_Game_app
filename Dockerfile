FROM node:20.11.1-buster-slim

RUN mkdir -p /usr/src/app/server
RUN mkdir -p /uploads
WORKDIR /usr/src/app

COPY ./package.json /usr/src/app/
COPY ./pnpm-lock.yaml /usr/src/app/
COPY ./.npmrc /usr/src/app/

# Copy over hoisted artifacts
# ADD ./node_modules/better-sqlite3/ /usr/src/app/node_modules/better-sqlite3

COPY ./server/package.json /usr/src/app/server
COPY ./server/pnpm-lock.yaml /usr/src/app/server
COPY ./server/.npmrc /usr/src/app/server

# Global deps
RUN npm install -g pnpm
RUN npm install -g tsx

# Client deps
# RUN pnpm install --force && pnpm store prune
RUN pnpm i --production

# Server deps
WORKDIR /usr/src/app/server
# RUN pnpm install --force && pnpm store prune
RUN pnpm i
WORKDIR /usr/src/app

COPY ./ /usr/src/app

ENV NODE_ENV production
ENV PORT 4000
EXPOSE 4000

CMD [ "tsx", "./server/src/index.ts" ]
