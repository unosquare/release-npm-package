FROM node:10-alpine AS node

COPY . .

ENTRYPOINT ["/entrypoint.sh"]