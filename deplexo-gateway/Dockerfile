FROM node:22-alpine
ENV NODE_ENV=production PORT=3000
WORKDIR /app
COPY --chown=node:node gateway.mjs server.mjs ./
USER node
EXPOSE 3000
CMD ["node", "server.mjs"]
