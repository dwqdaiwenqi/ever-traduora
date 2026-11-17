# Ever Traduora Platform

ARG NODE_OPTIONS
ARG NODE_ENV

# Build stage
FROM node:26.12.1-alpine3.23 as builder

LABEL maintainer="ever@ever.co"
LABEL org.opencontainers.image.source https://github.com/ever-co/ever-traduora

ENV IS_DOCKER=true

# Set Python interpreter for `node-gyp` to use
ENV PYTHON /usr/bin/python

RUN apk --update add bash && npm i -g npm \
	&& apk add --no-cache --virtual build-dependencies bind-tools curl tar xz jq python3 python3-dev py3-configobj py3-pip py3-setuptools build-base \
	snappy libheif dos2unix gcc g++ snappy-dev git libgcc libstdc++ linux-headers autoconf automake make nasm vips-dev vips

# Verify the Node.js version
RUN node --version
RUN npm --version

# Output Python3 version
RUN python3 --version

RUN npm install --quiet node-gyp@13.1.0 -g
RUN npm install pnpm@10.15.1 -g --force

COPY wait docker-entrypoint.compose.sh docker-entrypoint.sh /

RUN chmod +x /wait /docker-entrypoint.compose.sh /docker-entrypoint.sh && dos2unix /docker-entrypoint.compose.sh && dos2unix /docker-entrypoint.sh

WORKDIR /opt/traduora

COPY bin bin
COPY api api
COPY webapp webapp

RUN dos2unix bin/* && chmod +x bin/*.sh

# Configure the npm registry: prefer the internal Verdaccio cache (VERDACCIO_REGISTRY build-arg,
# anonymous), else public npm (empty, e.g. a fork). Writing to the home-level .npmrc makes it
# apply to all installs run by bin/install-deps.sh (root, webapp and api).
ARG VERDACCIO_REGISTRY=""
RUN if [ -n "$VERDACCIO_REGISTRY" ]; then \
		echo "registry=${VERDACCIO_REGISTRY}" >> "$HOME/.npmrc"; \
	fi

RUN bin/build.sh

# Runtime stage
FROM node:26.12.1-alpine3.23

ENV NODE_OPTIONS=${NODE_OPTIONS:-"--max-old-space-size=12288"}
ENV NODE_ENV=${NODE_ENV:-production}

ENV IS_DOCKER=true

WORKDIR /opt/traduora

COPY --from=builder /wait /docker-entrypoint.sh /docker-entrypoint.compose.sh ./

COPY --from=builder /opt/traduora/dist/ /opt/traduora/

EXPOSE 8080

ENTRYPOINT [ "./docker-entrypoint.sh" ]
