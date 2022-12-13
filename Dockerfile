FROM node:16-alpine3.16
RUN npm i -g pnpm
WORKDIR /app
COPY package.json ./
COPY pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY ./ ./
RUN pnpm prisma-gen
RUN pnpm build
ENV NODE_ENV=production
RUN pnpm prune --prod
ENTRYPOINT [ "node" ]
CMD [ "dist/main.js" ]