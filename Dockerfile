# build zokrates from source for local verify
FROM rust:1.53.0 as builder
ENV USERNAME="app"

RUN addgroup --gid 10001 $USERNAME && \
    adduser --gid 10001 --uid 10001 --home /app $USERNAME
WORKDIR /app
COPY . .
RUN git clone --depth 1 --branch 0.7.12 https://github.com/Zokrates/ZoKrates.git /app/zoKratesv0.7.12
WORKDIR /app/zoKratesv0.7.12
RUN rustup install nightly-2022-06-28
RUN cargo +nightly-2022-06-28 build -p zokrates_cli --release
WORKDIR /app
RUN git clone --depth 1 --branch 0.8.1 https://github.com/Zokrates/ZoKrates.git /app/zoKrates
WORKDIR /app/zoKrates
RUN rustup install nightly-2022-06-28
RUN cargo +nightly-2022-06-28 build -p zokrates_cli --release


FROM ubuntu:20.04
WORKDIR /app

COPY config/default.js config/default.js
COPY package.json package-lock.json ./
COPY --from=builder /app/zoKratesv0.7.12/zokrates_stdlib/stdlib /app/stdlibv7
COPY --from=builder /app/zoKratesv0.7.12/target/release/zokrates /app/zokratesv7
COPY --from=builder /app/zoKrates/zokrates_stdlib/stdlib /app/stdlib
COPY --from=builder /app/zoKrates/target/release/zokrates /app/zokrates
COPY src ./src
COPY start-script ./start-script
COPY start-dev ./start-dev

RUN apt-get update && apt-get install -y netcat curl
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
RUN apt-get install -y nodejs gcc g++ make

ENV ZOKRATES_HOME /app
ENV ZOKRATES_STDLIBv7 /app/stdlibv7
ENV ZOKRATES_STDLIB /app/stdlib

RUN npm i

USER $USERNAME:$USERNAME
EXPOSE 80
CMD npm start