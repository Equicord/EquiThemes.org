# -------- Build stage --------
FROM node:lts-alpine AS build
WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

COPY package*.json pnpm-*.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build


FROM node:lts-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

COPY package*.json pnpm-*.yaml ./
RUN pnpm install --prod --frozen-lockfile

COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.* ./

EXPOSE 3000

CMD ["pnpm", "start"]
