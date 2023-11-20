FROM ubuntu:20.04
ARG GPR_TOKEN

FROM zokrates/zokrates:0.8.0 as builder

FROM node:20 as node-build
ARG GPR_TOKEN
WORKDIR /app
COPY ./package.json ./package-lock.json ./.npmrc ./
RUN npm ci
RUN rm -f .npmrc

FROM node:20
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
RUN apt-get install -y netcat-traditional
RUN apt-get install vim -y
# RUN apt-get install libc6

RUN cd /etc
RUN mkdir gcc-10-base
RUN cd gcc-10-base/
RUN  wget http://ftp.de.debian.org/debian/pool/main/g/gcc-10/gcc-10-base_10.2.1-6_amd64.deb
RUN dpkg -i gcc-10-base_10.2.1-6_amd64.deb || :

RUN cd /etc
RUN mkdir libgcc-s1
RUN cd libgcc-s1/
RUN  wget http://ftp.de.debian.org/debian/pool/main/g/gcc-10/libgcc-s1_10.2.1-6_amd64.deb
RUN dpkg -i libgcc-s1_10.2.1-6_amd64.deb || :

RUN cd /etc
RUN mkdir libcrypt1
RUN cd libcrypt1/
RUN  wget http://ftp.de.debian.org/debian/pool/main/libx/libxcrypt/libcrypt1_4.4.18-4_amd64.deb 
RUN dpkg -i libcrypt1_4.4.18-4_amd64.deb || :

RUN cd /etc
RUN mkdir libc6
RUN cd libc6/
RUN wget http://ftp.de.debian.org/debian/pool/main/g/glibc/libc6_2.31-13+deb11u5_amd64.deb
RUN dpkg -i libc6_2.31-13+deb11u5_amd64.deb || :
RUN cd ..

ENV ZOKRATES_HOME /app
ENV ZOKRATES_STDLIB /app/stdlib

EXPOSE 80
CMD npm start
