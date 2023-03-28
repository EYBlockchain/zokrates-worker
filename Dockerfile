# build zokrates from source for local verify
FROM rust:1.53.0 as builder
WORKDIR /app
COPY . .
RUN git clone --depth 1 --branch 0.7.12 https://github.com/Zokrates/ZoKrates.git
WORKDIR /app/ZoKrates
RUN rustup install nightly-2022-06-28
RUN cargo +nightly-2022-06-28 build -p zokrates_cli --release

FROM ubuntu:20.04
WORKDIR /app

COPY config/default.js config/default.js
COPY package.json package-lock.json ./
COPY --from=builder /app/ZoKrates/zokrates_stdlib/stdlib /app/stdlib
COPY --from=builder /app/ZoKrates/target/release/zokrates /app/zokrates
COPY src ./src
COPY start-script ./start-script
COPY start-dev ./start-dev

RUN apt-get update -y
RUN apt-get install -y netcat curl
RUN curl -fsSL https://deb.nodesource.com/setup_14.x | bash -
RUN apt-get install -y nodejs gcc g++ make

ENV ZOKRATES_HOME /app
ENV ZOKRATES_STDLIB /app/stdlib

RUN npm ci

EXPOSE 80
CMD npm start