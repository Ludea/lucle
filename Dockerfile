FROM alpine:3.21
WORKDIR /opt/lucle
ARG TARGETARCH

COPY lucle-$TARGETARCH/lucle /usr/local/bin/lucle
RUN chmod +x /usr/local/bin/lucle

COPY  web/dist /var/www/static
COPY pkey .
EXPOSE 3000
EXPOSE 8080

CMD ["lucle"] 
