FROM alpine:3.21
WORKDIR /opt/lucle
ARG TARGETARCH

COPY lucle-$TARGETARCH/lucle /usr/local/bin/lucle
RUN chmod +x /usr/local/bin/lucle/lucle

COPY web/dist /usr/local/bin/lucle/web/dist
COPY pkey /usr/local/bin/lucle
EXPOSE 3000
EXPOSE 8080

CMD ["lucle"] 
