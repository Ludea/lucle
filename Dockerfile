FROM alpine:3.20 AS alpine
WORKDIR /opt/lucle
ARG TARGETARCH
#TODO: Workaround to fix link issue
RUN apk add mariadb-connector-c postgresql-client libgcc
COPY lucle-$TARGETARCH/lucle .
RUN chmod +x lucle
RUN ls -R .
RUN pwd
RUN ls -lah .
RUN file ./lucle
COPY  web/dist .
EXPOSE 3000
EXPOSE 8080
CMD ["./lucle"] 
