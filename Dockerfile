FROM node:10-alpine AS node
ARG release-version
COPY . .

ENTRYPOINT ["/entrypoint.sh", release-version]