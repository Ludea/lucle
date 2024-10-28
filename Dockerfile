FROM alpine:3.20 AS alpine
WORKDIR /opt/lucle
#TODO: Workaround to fix link issue
RUN apk add mariadb-connector-c postgresql-client libgcc
COPY lucle .
COPY  web/dist .
EXPOSE 3000
EXPOSE 8080
CMD ["./lucle"] 
