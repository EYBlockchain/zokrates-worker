ARG GPR_TOKEN

FROM zokrates/zokrates:0.6.4 as builder

FROM node:12.18 as node-build
ARG GPR_TOKEN
WORKDIR /app
RUN echo config
COPY ./package.json ./package-lock.json ./.npmrc ./
RUN npm config set '//npm.pkg.github.com/:_authToken=${GPR_TOKEN}'
RUN npm publish
RUN npm ci
RUN rm -f .npmrc

FROM node:12.18
WORKDIR /app

COPY --from=node-build /app /app
COPY --from=builder /home/zokrates/.zokrates/bin/zokrates /app/zokrates
COPY --from=builder /home/zokrates/.zokrates/stdlib /app/stdlib/
COPY ./src ./src
COPY ./circuits ./circuits
COPY ./config ./config
COPY ./start-script ./start-script
COPY ./start-dev ./start-dev

RUN apt-get update -y
RUN apt-get install -y netcat

ENV ZOKRATES_HOME /app
ENV ZOKRATES_STDLIB /app/stdlib

EXPOSE 80
CMD npm start
