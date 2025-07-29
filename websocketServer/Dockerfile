FROM node:21-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

COPY . /magnify_ws_server
WORKDIR /magnify_ws_server

FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile
RUN npx tsc

FROM base
COPY --from=prod-deps /magnify_ws_server/dist ./dist
COPY --from=prod-deps /magnify_ws_server/node_modules ./node_modules
COPY package*.json ./
EXPOSE 8080

CMD [ "node", "--env-file", ".env", "dist/index.js" ]