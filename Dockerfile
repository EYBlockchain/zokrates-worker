# build zokrates from source for local verify
FROM rust:1.53.0 as builder
WORKDIR /app
COPY . .
RUN git clone --depth 1 --branch 0.8.8 https://github.com/Zokrates/ZoKrates /app/zoKratesv0.8.8
WORKDIR /app/zoKratesv0.8.8
RUN rustup install nightly-2022-06-28
RUN cargo +nightly-2022-06-28 build -p zokrates_cli --release
# Copy the built result into /app/zoKrates
RUN cp -r /app/zoKratesv0.8.8 /app/zoKrates

FROM ubuntu:24.04
ENV USERNAME="node"
WORKDIR /app
# Install Node.js with cleanup and optimization
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        netcat-traditional \
        curl \
        ca-certificates && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    apt-get remove -y curl && \
    apt-get autoremove -y && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    mkdir /npm-cache
# Setup environment variables
ENV npm_config_cache=/npm-cache
ENV ZOKRATES_HOME /app
ENV ZOKRATES_STDLIBv8 /app/stdlibv8
ENV ZOKRATES_STDLIB /app/stdlib
# Copy app files
COPY config/default.js config/default.js
COPY package.json package-lock.json ./
COPY --from=builder /app/zoKratesv0.8.8/zokrates_stdlib/stdlib /app/stdlibv8
COPY --from=builder /app/zoKratesv0.8.8/target/release/zokrates /app/zokratesv8
COPY --from=builder /app/zoKrates/zokrates_stdlib/stdlib /app/stdlib
COPY --from=builder /app/zoKrates/target/release/zokrates /app/zokrates
COPY src ./src
COPY start-script ./start-script
COPY start-dev ./start-dev
RUN mkdir -p /app/output
RUN mkdir -p /app/circuits
# Install npm packages as root
RUN npm ci --omit=dev

# Remove npm, npx to remove glob vulnerability
RUN rm -rf /usr/local/lib/node_modules/npm \
    && rm -f /usr/local/bin/npm /usr/local/bin/npx \
    && rm -f /usr/local/bin/yarn /usr/local/bin/yarnpkg \
    && rm -rf /usr/lib/node_modules/npm

# Change/Add permission to user $USERNAME
RUN groupadd --gid 10001 $USERNAME && \
    useradd --gid 10001 --uid 10001 --home /app --shell /bin/bash $USERNAME && \
    chown -R $USERNAME:$USERNAME /app /npm-cache /app/output /app/circuits
# Switch to user $USERNAME from root
USER $USERNAME:$USERNAME
EXPOSE 80
CMD ["node", "./src/index.mjs"]