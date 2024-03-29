FROM --platform=$BUILDPLATFORM node as build-frontend 
WORKDIR /opt/lucle
COPY . . 
RUN cd web && yarn install --network-timeout 500000
RUN cd web && yarn build

FROM --platform=$BUILDPLATFORM rust:alpine3.17 as alpine-builder-amd64
RUN apk add --update mysql mysql-client mariadb-dev postgresql postgresql-client postgresql-dev sqlite sqlite-dev musl-dev
WORKDIR /opt/lucle
COPY . . 
RUN cargo build --release --verbose

FROM --platform=linux/arm64 rust:alpine3.17 as alpine-builder-arm64
RUN apk add --update mariadb-dev postgresql-dev sqlite-dev musl-dev
WORKDIR /opt/lucle
COPY . . 
RUN RUSTFLAGS="-Ctarget-feature=-crt-static" cargo build --release --verbose

FROM alpine-builder-$TARGETARCH as build

FROM alpine:3.17 as alpine
WORKDIR /opt/lucle
#TODO: Workaround to fix link issue
RUN apk add mariadb-connector-c postgresql-client libgcc
COPY --from=build /opt/lucle/target/release/lucle .
COPY --from=build-frontend /opt/lucle/web/dist ./web/dist
EXPOSE 3000
EXPOSE 8080
CMD ["./lucle"] 
